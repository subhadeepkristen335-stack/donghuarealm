import { Maximize, MonitorUp, SkipForward } from 'lucide-react'
import { useEffect, useRef, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../contexts/DataContext.jsx'
import { getFirstAvailableProvider, getPlayableLanguageKeys, getPlayableLanguages, hasVideoId } from '../utils/languages.js'
import { getEmbedUrl } from '../utils/selectors.js'
import AdSlot from './AdSlot.jsx'
import LanguageSwitcher from '../../LanguageSwitcher.jsx'
import { useLocalStorage } from '../../useLocalStorage.js'

const EMPTY_LANGUAGE_DATA = {}

function EmbedFrame({ src, title }) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black text-purple-200">
          Loading Player...
        </div>
      )}
      <iframe 
        src={src} 
        title={title} 
        className="relative z-0 h-full w-full" 
        onLoad={() => setIsLoading(false)}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        webkitallowfullscreen="true"
        mozallowfullscreen="true"
        loading="lazy"
        scrolling="no"
      />
    </>
  )
}

export default function VideoPlayer({ episode, anime, nextEpisode }) {
  const { watch_history = [], upsert } = useData()
  const containerRef = useRef(null)
  const progressRef = useRef(0)
  const saved = watch_history.find((item) => item?.episodeId === episode?.id)
  
  // OPTIMIZATION & FIX: Normalize episode data for backward compatibility
  const normalizedEpisode = useMemo(() => {
    if (episode.languages) {
      return episode;
    }
    // Handle old data structure by assuming it's Chinese
    const languages = { chinese: {} };
    if (episode.youtube) languages.chinese.youtubeId = episode.youtube;
    if (episode.dailymotion) languages.chinese.dailymotionId = episode.dailymotion;
    if (episode.rumble) languages.chinese.rumbleId = episode.rumble;
    return { ...episode, languages };
  }, [episode]);
  
  const [language, setLanguage] = useLocalStorage('preferredLanguage', 'hindi_dub');
  const [server, setServer] = useLocalStorage('preferredSource', 'youtube');
  const [theater, setTheater] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [initialProgress] = useState(saved?.progress || 0)
  
  const availableLanguages = useMemo(() => getPlayableLanguages(normalizedEpisode.languages || {}), [normalizedEpisode.languages]);
  const availableLanguageKeys = useMemo(() => getPlayableLanguageKeys(normalizedEpisode.languages || {}), [normalizedEpisode.languages]);
  const currentLanguageData = useMemo(() => availableLanguages[language] || EMPTY_LANGUAGE_DATA, [availableLanguages, language]);
  const videoId = useMemo(() => {
    const value = currentLanguageData[`${server}Id`]
    return typeof value === 'string' ? value.trim() : value
  }, [currentLanguageData, server]);
  const hasPlayableVideo = hasVideoId(videoId)
  const src = useMemo(() => hasPlayableVideo ? getEmbedUrl(server, videoId, initialProgress) : '', [server, videoId, initialProgress, hasPlayableVideo]);

  // OPTIMIZATION: Refactored progress tracking
  useEffect(() => {
    progressRef.current = initialProgress

    const saveProgress = () => {
      if (progressRef.current > initialProgress) {
        upsert('watch_history', {
          id: `${episode.id}-history`,
          episodeId: episode.id,
          animeId: anime.id,
          progress: progressRef.current,
          updatedAt: new Date().toISOString()
        }).catch(err => console.warn('Failed to save progress:', err))
      }
    }
    
    const timer = setInterval(() => { progressRef.current += 10 }, 10000)
    window.addEventListener('beforeunload', saveProgress)
    
    return () => {
      clearInterval(timer)
      window.removeEventListener('beforeunload', saveProgress)
      saveProgress() // Save on component unmount
    }
  }, [episode.id, anime.id, upsert, initialProgress])

  // Fallback logic for language and server selection
  useEffect(() => {
    if (availableLanguageKeys.length === 0) {
      return;
    }

    if (!availableLanguageKeys.includes(language)) {
      // If preferred language isn't available, fallback gracefully.
      setLanguage(availableLanguageKeys.find(lang => lang === 'hindi_dub') || availableLanguageKeys[0]);
    } else {
      // If preferred language IS available, check if the preferred server is.
      const langData = availableLanguages[language];
      if (langData && !hasVideoId(langData[`${server}Id`])) {
        // If preferred server is not available for this language, switch to one that is.
        const fallbackServer = getFirstAvailableProvider(langData);
        if (fallbackServer) setServer(fallbackServer);
      }
    }
  }, [language, server, availableLanguages, availableLanguageKeys, setLanguage, setServer]);

  useEffect(() => {
    let wakeLock = null
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch (err) {
        console.warn('Wake Lock error:', err)
      }
    }

    requestWakeLock()

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLock !== null) {
        wakeLock.release().catch(() => {})
      }
    }
  }, [])

  const handleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        } else if (containerRef.current?.webkitRequestFullscreen) {
          await containerRef.current.webkitRequestFullscreen()
        } else if (containerRef.current?.mozRequestFullScreen) {
          await containerRef.current.mozRequestFullScreen()
        } else if (containerRef.current?.msRequestFullscreen) {
          await containerRef.current.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen()
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen()
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen()
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement || !!document.webkitFullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <section className={theater ? 'fixed inset-0 z-[80] overflow-auto bg-black p-3 md:p-6' : ''}>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div>
          <div 
            ref={containerRef}
            className={`overflow-hidden border border-purple-300/20 bg-black shadow-2xl shadow-purple-950/40 ${isFullscreen ? 'h-full w-full rounded-none' : 'rounded-lg'}`}
          >
            <div className={`relative w-full ${isFullscreen ? 'h-full' : 'aspect-video'}`}>
              {hasPlayableVideo ? (
                <EmbedFrame key={src} src={src} title={`${anime.title} Episode ${episode.number}`} />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-black px-4 text-center text-purple-200">
                  Video not available for this episode.
                </div>
              )}
            </div>
          </div>
          <LanguageSwitcher
            selectedLanguage={language}
            onLanguageChange={setLanguage}
            availableLanguages={availableLanguages}
          />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {hasVideoId(currentLanguageData.youtubeId) && (
              <button onClick={() => setServer('youtube')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${server === 'youtube' ? 'bg-red-600 text-white' : 'bg-white/10 text-purple-100 hover:bg-white/15'}`}>YouTube</button>
            )}
            {hasVideoId(currentLanguageData.rumbleId) && (
              <button onClick={() => setServer('rumble')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${server === 'rumble' ? 'bg-green-600 text-white' : 'bg-white/10 text-purple-100 hover:bg-white/15'}`}>Rumble</button>
            )}
            {hasVideoId(currentLanguageData.dailymotionId) && (
              <button onClick={() => setServer('dailymotion')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${server === 'dailymotion' ? 'bg-blue-600 text-white' : 'bg-white/10 text-purple-100 hover:bg-white/15'}`}>Dailymotion</button>
            )}
            <button onClick={() => setTheater(!theater)} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white"><MonitorUp size={16} className="mr-2 inline" />Theater</button>
            <button onClick={handleFullscreen} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isFullscreen ? 'bg-purple-600 text-white' : 'bg-white/10 text-purple-100 hover:bg-white/15'}`}><Maximize size={16} className="mr-2 inline" />Fullscreen</button>
            {nextEpisode && <Link to={`/watch/${nextEpisode.id}`} className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white"><SkipForward size={16} className="mr-2 inline" />Next Episode</Link>}
          </div>
        </div>
        <aside className="space-y-4">
          <AdSlot placement="inVideo" />
          <AdSlot placement="sidebar" />
        </aside>
      </div>
    </section>
  )
}
