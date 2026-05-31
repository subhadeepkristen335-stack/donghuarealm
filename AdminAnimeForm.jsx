import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, collection, query, where, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, firebaseReady } from './src/lib/firebase.js';
import { useData } from './src/contexts/DataContext.jsx';

const notifyTelegramWithRetry = async (payload, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch('/api/notify-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : null;

      if (res.ok && isJson) {
        console.log('[Telegram] Notification sent successfully');
        return;
      }
      throw new Error(data?.error || `API returned status ${res.status}${!isJson ? ' (Not JSON)' : ''}`);
    } catch (error) {
      console.error(`[Telegram] Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // exponential backoff
    }
  }
};

const getAvailableLanguages = (languages) => {
  const available = [];
  if (languages?.hindi_dub?.youtubeId || languages?.hindi_dub?.dailymotionId) available.push('Hindi Dub');
  if (languages?.chinese?.youtubeId || languages?.chinese?.dailymotionId) available.push('Chinese');
  if (languages?.english_sub?.youtubeId || languages?.english_sub?.dailymotionId) available.push('English Sub');
  return available.join(' / ');
};

const AdminAnimeForm = ({ animeId }) => {
  const { anime: allAnime, episodes: allEpisodes, settings, loading: dataLoading, upsert, remove } = useData();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState(null);
  const [episodesToDelete, setEpisodesToDelete] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // In a real app, you'd fetch episodes from the subcollection
  useEffect(() => {
    // Wait for animeId and for Firebase to be initialized.
    if (dataLoading || !animeId) {
      setLoading(true);
      return;
    }
    setLoading(true);
    setError('');

    const currentAnime = allAnime.find(a => a.id === animeId);

    if (currentAnime) {
      console.log(`[Admin] Found anime in context: ${currentAnime.title}`);
      setAnime(currentAnime);
      const animeEpisodes = allEpisodes
        .filter(ep => ep.animeId === animeId)
        .sort((a, b) => (a.number || 0) - (b.number || 0));
      console.log(`[Admin] Found ${animeEpisodes.length} episodes for this anime.`);
      setEpisodes(animeEpisodes);
    } else {
      console.error(`[Admin] Anime with ID ${animeId} not found in DataContext.`);
      setError('Failed to find anime data in the application context. The data might not have loaded correctly.');
    }
    setLoading(false);
  }, [animeId, allAnime, allEpisodes, dataLoading]);

  const handleSave = useCallback(async () => {
    setLoading(true);
    setError('');
    console.log('[Admin Save] Starting save process...');

    try {
      // 1. Validate all episodes have numbers
      for (const episode of episodes) {
        if (!episode.number || isNaN(parseInt(episode.number))) {
          throw new Error(`An episode is missing a valid number. Please check your entries.`);
        }
      }

      // 2. Process deletions
      console.log(`[Admin Save] Deleting ${episodesToDelete.length} episodes.`);
      for (const episodeId of episodesToDelete) {
        await remove('episodes', episodeId);
      }
      setEpisodesToDelete([]); // Clear the deletion queue

      // 3. Process upserts for episodes
      console.log(`[Admin Save] Upserting ${episodes.length} episodes.`);
      const newEpisodesToNotify = [];
      for (const episode of episodes) {
        const isNew = episode.id && episode.id.startsWith('temp-');
        const episodeId = episode.id && !episode.id.startsWith('temp-') ? episode.id : `${animeId}-${episode.number}`;
        const episodeData = {
          ...episode,
          id: episodeId,
          animeId: animeId,
        };
        console.log('[Admin Save] Payload for episode upsert:', episodeData);
        await upsert('episodes', episodeData);

        if (isNew) {
          newEpisodesToNotify.push(episodeData);
        }
      }

      // 4. Update the main anime document
      let hasHindiDubUpdate = episodes.some(ep => ep.languages?.hindi_dub?.youtubeId || ep.languages?.hindi_dub?.dailymotionId);
      const animeData = { ...anime };
      // Only update the date if a Hindi Dub has been added/modified in this save operation.
      if (hasHindiDubUpdate && (!anime.latestHindiDubReleaseDate || new Date() > new Date(anime.latestHindiDubReleaseDate))) {
        animeData.latestHindiDubReleaseDate = new Date().toISOString();
      }
      console.log('[Admin Save] Payload for anime metadata upsert:', animeData);
      await upsert('anime', animeData);

      // 5. Send Telegram Notifications
      if (settings?.telegramAutoPost && newEpisodesToNotify.length > 0) {
        for (const ep of newEpisodesToNotify) {
          const availableLangs = getAvailableLanguages(ep.languages) || 'N/A';
          const watchUrl = `${window.location.origin}/watch/${animeData.slug}/${ep.number}`;
          
          try {
            await notifyTelegramWithRetry({
              animeTitle: animeData.title,
              episodeNumber: ep.number,
              language: availableLangs,
              watchUrl: watchUrl,
              imageUrl: animeData.posterImageUrl || animeData.thumbnail || animeData.banner,
              template: settings.telegramTemplate
            });
          } catch (err) {
            console.error(`[Telegram] Failed to send notification for episode ${ep.number}:`, err);
          }
        }
      }

      alert('Saved successfully!');
      console.log('[Admin Save] Save process completed successfully.');
    } catch (e) {
      console.error("Error saving changes: ", e);
      const errorMessage = `Failed to save changes: ${e.message}`;
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [animeId, anime, episodes, episodesToDelete, upsert, remove]);

  const handleEpisodeChange = useCallback((index, lang, provider, value) => {
    setEpisodes(currentEpisodes => {
      const newEpisodes = [...currentEpisodes];
      if (!newEpisodes[index].languages) newEpisodes[index].languages = {};
      if (!newEpisodes[index].languages[lang]) newEpisodes[index].languages[lang] = {};
      newEpisodes[index].languages[lang][`${provider}Id`] = value;
      return newEpisodes;
    });
  }, []);

  const handleEpisodeNumberChange = useCallback((index, value) => {
    setEpisodes(currentEpisodes => {
      const newEpisodes = [...currentEpisodes];
      newEpisodes[index].number = value ? parseInt(value, 10) : '';
      return newEpisodes;
    });
  }, []);

  const addEpisode = useCallback(() => {
    setEpisodes(currentEpisodes => {
      const tempId = `temp-${Date.now()}`; // Add a temporary unique ID for the key prop
      const newEpisodeNumber = currentEpisodes.length > 0 ? Math.max(...currentEpisodes.map(e => e.number || 0)) + 1 : 1;
      return [...currentEpisodes, {
        id: tempId,
        number: newEpisodeNumber,
        languages: {
          chinese: { youtubeId: '', dailymotionId: '' },
          hindi_dub: { youtubeId: '', dailymotionId: '' },
          english_sub: { youtubeId: '', dailymotionId: '' }
        }
      }];
    });
  }, []);

  const removeEpisode = useCallback((index) => {
    setEpisodes(currentEpisodes => {
      const episodeToRemove = currentEpisodes[index];
      if (episodeToRemove && episodeToRemove.id) {
        setEpisodesToDelete(currentDeleteList => [...currentDeleteList, episodeToRemove.id]);
      }
      return currentEpisodes.filter((_, i) => i !== index);
    });
  }, []);

  if (loading || !anime || !episodes) {
    return <div className="p-6 text-center text-purple-300">Loading anime and episodes...</div>;
  }

  if (error) return <div className="p-6 text-red-400">{error}</div>;

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Manage Episodes for: <span className="text-purple-300">{anime.title}</span></h2>
      
      <div className="mb-4">
        <label className="block mb-2">Title</label>
        <input 
          type="text" 
          value={anime.title} 
          onChange={(e) => setAnime({...anime, title: e.target.value})}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600"
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            checked={anime.isHindiDubAvailable}
            onChange={(e) => setAnime({ ...anime, isHindiDubAvailable: e.target.checked })}
            className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-600"
          />
          <span>Hindi Dub Available</span>
        </label>
      </div>

      <h3 className="text-lg font-bold mt-6 mb-4">Episodes</h3>
      
      <div className="space-y-4">
        {episodes.map((ep, index) => (
          <div key={ep.id || index} className="p-4 border border-gray-700 rounded-lg bg-gray-900/50">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <label>Episode:</label>
                <input
                  type="number"
                  value={ep.number || ''}
                  onChange={(e) => handleEpisodeNumberChange(index, e.target.value)}
                  className="p-1 rounded bg-gray-700 w-20 text-center"
                />
              </div>
              <button onClick={() => removeEpisode(index)} className="text-red-500 hover:text-red-400 text-sm font-semibold">Remove</button>
            </div>

            {['hindi_dub', 'english_sub', 'chinese'].map(lang => (
              <div key={lang} className="space-y-2 mt-3">
                <p className="font-semibold text-purple-400 capitalize">{lang.replace('_', ' ')}</p>
                <input 
                  placeholder="YouTube ID" 
                  value={ep.languages?.[lang]?.youtubeId || ''}
                  onChange={(e) => handleEpisodeChange(index, lang, 'youtube', e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600" 
                />
                <input 
                  placeholder="Dailymotion ID" 
                  value={ep.languages?.[lang]?.dailymotionId || ''}
                  onChange={(e) => handleEpisodeChange(index, lang, 'dailymotion', e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600" 
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <button onClick={addEpisode} className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
        Add Episode
      </button>

      <div className="mt-6 border-t border-gray-700 pt-6">
        <button onClick={handleSave} disabled={loading} className="w-full px-4 py-3 bg-purple-600 rounded hover:bg-purple-700 disabled:bg-gray-500 font-bold text-lg">
          {loading ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
};

export default AdminAnimeForm;