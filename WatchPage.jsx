import React from 'react';
import { useParams } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { useLocalStorage } from './useLocalStorage.js';
import { useData } from './src/contexts/DataContext.jsx';

// Dummy player component
const VideoPlayer = ({ source, videoId }) => {
  if (!videoId) {
    return <div className="aspect-video w-full bg-black text-white flex items-center justify-center">Language not available.</div>;
  }
  const embedUrl = source === 'youtube'
    ? `https://www.youtube.com/embed/${videoId}`
    : `https://www.dailymotion.com/embed/video/${videoId}`;

  return (
    <div className="aspect-video w-full">
      <iframe
        src={embedUrl}
        title="Anime Episode Player"
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

const WatchPage = () => {
  const { animeSlug, episodeNumber } = useParams();
  const { anime, episodes, loading } = useData();
  
  // Use localStorage to persist language preference
  const [language, setLanguage] = useLocalStorage('preferredLanguage', 'hindi_dub');
  const [videoSource, setVideoSource] = useLocalStorage('preferredSource', 'youtube');

  if (loading) return <div>Loading episode...</div>;

  const animeData = anime.find(a => a.slug === animeSlug);

  if (!animeData) {
    return <div>Anime not found.</div>;
  }

  // Use '==' for comparison as episodeNumber from URL is a string
  const episodeData = episodes.find(e => e.animeId === animeData.id && e.number == episodeNumber);

  if (!episodeData) return <div>Episode not found.</div>;

  const videoId = episodeData.languages[language]?.[`${videoSource}Id`];

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-2xl font-bold mb-2">{`${animeData.title} - Episode ${episodeData.number}`}</h1>
      <LanguageSwitcher selectedLanguage={language} onLanguageChange={setLanguage} availableLanguages={episodeData.languages} />
      <VideoPlayer source={videoSource} videoId={videoId} />
      {/* Add episode list, comments, etc. here */}
    </div>
  );
};

export default WatchPage;