import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '/firebase-config.js'; // Assuming you have a firebase config file
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { useLocalStorage } from './useLocalStorage.js';

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
  const [animeData, setAnimeData] = useState(null);
  const [episodeData, setEpisodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Use localStorage to persist language preference
  const [language, setLanguage] = useLocalStorage('preferredLanguage', 'hindi_dub');
  const [videoSource, setVideoSource] = useLocalStorage('preferredSource', 'youtube');

  useEffect(() => {
    const fetchEpisode = async () => {
      setLoading(true);
      
      // Query for the anime by slug to get its ID and data
      const animeQuery = query(collection(db, 'anime'), where('slug', '==', animeSlug), limit(1));
      const animeQuerySnapshot = await getDocs(animeQuery);

      if (animeQuerySnapshot.empty) {
        console.error("Anime not found!");
        setAnimeData(null);
        setEpisodeData(null);
        setLoading(false);
        return;
      }

      const animeDoc = animeQuerySnapshot.docs[0];
      const animeId = animeDoc.id;
      setAnimeData(animeDoc.data());

      // Fetch the specific episode using the found animeId
      // FIX: Query the top-level 'episodes' collection instead of a subcollection.
      const episodeId = `${animeId}-${episodeNumber}`;
      const episodeRef = doc(db, 'episodes', episodeId);
      const episodeSnap = await getDoc(episodeRef);

      if (episodeSnap.exists()) {
        setEpisodeData({ id: episodeSnap.id, ...episodeSnap.data() });
      } else {
        // Fallback for numeric episode ID, just in case the ID format is different.
        console.warn(`Episode with ID ${episodeId} not found. Falling back to query.`);
        const q = query(collection(db, 'episodes'), where('animeId', '==', animeId), where('number', '==', parseInt(episodeNumber, 10)), limit(1));
        const episodeQuerySnap = await getDocs(q);
        if (!episodeQuerySnap.empty) {
            const episodeDoc = episodeQuerySnap.docs[0];
            setEpisodeData({ id: episodeDoc.id, ...episodeDoc.data() });
        } else {
            console.error(`Episode ${episodeNumber} for anime ${animeId} not found!`);
            setEpisodeData(null);
        }
      }
      setLoading(false);
    };

    fetchEpisode();
  }, [animeSlug, episodeNumber]);

  if (loading) return <div>Loading episode...</div>;
  if (!animeData || !episodeData) return <div>Episode not found.</div>;

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