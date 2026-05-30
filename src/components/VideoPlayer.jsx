import { Maximize, MonitorUp, SkipForward } from 'lucide-react'
import { useEffect, useRef, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../contexts/DataContext.jsx'
import { getEmbedUrl } from '../utils/selectors.js'
import AdSlot from './AdSlot.jsx'
import LanguageSwitcher from '../../LanguageSwitcher.jsx'
import { useLocalStorage } from '../../useLocalStorage.js'

export default function VideoPlayer({ episode, anime, nextEpisode }) {
  const { watch_history, upsert } = useData()
  const iframeRef = useRef(null)
  const containerRef = useRef(null)
  const progressRef = useRef(0)
  const saved = watch_history.find((item) => item.episodeId === episode.id)
  
  // OPTIMIZATION & FIX: Normalize episode data for backward compatibility
  const normalizedEpisode = useMemo(() => {
    if (episode.languages) {
      return episode;
    }
    // Handle old data structure by assuming it's Chinese
    const languages = { chinese: {} };
    if (episode.youtube) languages.chinese.youtubeId = episode.youtube;
    if (episode.dailymotion) languages.chinese.dailymotionId = episode.dailymotion;
    return { ...episode, languages };
  }, [episode]);
  
  const [language, setLanguage] = useLocalStorage('preferredLanguage', 'hindi_dub');
  const [server, setServer] = useLocalStorage('preferredSource', 'youtube');
  const [theater, setTheater] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [initialProgress] = useState(saved?.progress || 0)
  const [isPlayerLoading, setPlayerLoading] = useState(true);
  
  const availableLanguages = normalizedEpisode.languages || {};
  const currentLanguageData = availableLanguages[language] || {};
  const videoId = useMemo(() => currentLanguageData[`${server}Id`], [currentLanguageData, server]);
  const src = useMemo(() => getEmbedUrl(server, videoId, initialProgress), [server, videoId, initialProgress]);

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
    const availableLangs = Object.keys(availableLanguages);
    if (!availableLangs.includes(language)) {
      // If preferred language isn't available, fallback gracefully.
      setLanguage(availableLangs.find(lang => lang === 'hindi_dub') || availableLangs[0] || 'chinese');
    } else {
      // If preferred language IS available, check if the preferred server is.
      const langData = availableLanguages[language];
      if (langData && !langData[`${server}Id`]) {
        // If preferred server is not available for this language, switch to one that is.
        if (langData.youtubeId) setServer('youtube');
        else if (langData.dailymotionId) setServer('dailymotion');
      }
    }
  }, [language, server, availableLanguages, setLanguage, setServer]);

  // OPTIMIZATION: Add loading state for iframe
  useEffect(() => {
    if (src) {
      setPlayerLoading(true);
    }
  }, [src]);


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
            <div className={`w-full ${isFullscreen ? 'h-full' : 'aspect-video'}`}>
              {isPlayerLoading && videoId && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black text-purple-200">
                  Loading Player...
                </div>
              )}
              <iframe 
                ref={iframeRef}
                src={src} 
                title={`${anime.title} Episode ${episode.number}`} 
                className="relative z-0 h-full w-full" 
                onLoad={() => setPlayerLoading(false)}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                loading="lazy"
                scrolling="no"
              />
            </div>
          </div>
          <LanguageSwitcher
            selectedLanguage={language}
            onLanguageChange={setLanguage}
            availableLanguages={availableLanguages}
          />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {currentLanguageData.youtubeId && (
              <button onClick={() => setServer('youtube')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${server === 'youtube' ? 'bg-red-600 text-white' : 'bg-white/10 text-purple-100 hover:bg-white/15'}`}>YouTube</button>
            )}
            {currentLanguageData.dailymotionId && (
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
