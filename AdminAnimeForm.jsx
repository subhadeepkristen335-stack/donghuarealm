import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
        console.log('[Telegram] Notification sent successfully', { episode: payload.episodeNumber, anime: payload.animeTitle });
        return;
      }
      throw new Error(data?.error || `API returned status ${res.status}${!isJson ? ' (Not JSON)' : ''}`);
    } catch (error) {
      console.error(`[Telegram] Attempt ${i + 1}/${maxRetries} failed for episode ${payload.episodeNumber}:`, error.message);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // exponential backoff
    }
  }
};

const getAvailableLanguages = (languages) => {
  const available = [];
  if (languages?.hindi_dub?.youtubeId || languages?.hindi_dub?.dailymotionId || languages?.hindi_dub?.rumbleId) available.push('Hindi Dub');
  if (languages?.chinese?.youtubeId || languages?.chinese?.dailymotionId || languages?.chinese?.rumbleId) available.push('Chinese');
  if (languages?.english_sub?.youtubeId || languages?.english_sub?.dailymotionId || languages?.english_sub?.rumbleId) available.push('English Sub');
  return available.join(' / ');
};

const AdminAnimeForm = ({ animeId }) => {
  const { anime: allAnime, episodes: allEpisodes, comments: allComments = [], settings, loading: dataLoading, upsert, remove } = useData();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState(null);
  const [episodesToDelete, setEpisodesToDelete] = useState([]);
  const [newEpisodeIds, setNewEpisodeIds] = useState(new Set()); // Track newly added episodes
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Optimize comments lookup by grouping them by episodeId
  const commentsByEpisode = useMemo(() => {
    const map = {};
    if (allComments) {
      for (const comment of allComments) {
        if (!map[comment.episodeId]) map[comment.episodeId] = [];
        map[comment.episodeId].push(comment);
      }
    }
    return map;
  }, [allComments]);

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
        // Use the Set to track new episodes (more reliable than checking temp- prefix)
        const isNew = newEpisodeIds.has(episode.id);
        const episodeId = episode.id && !episode.id.startsWith('temp-') ? episode.id : `${animeId}-${episode.number}`;
        const episodeData = {
          ...episode,
          id: episodeId,
          animeId: animeId,
        };
        console.log('[Admin Save] Payload for episode upsert:', episodeData);
        await upsert('episodes', episodeData);

        if (isNew) {
          newEpisodesToNotify.push({ ...episodeData, originalTempId: episode.id });
        }
      }

      // 4. Update the main anime document
      let hasHindiDubUpdate = episodes.some(ep => ep.languages?.hindi_dub?.youtubeId || ep.languages?.hindi_dub?.dailymotionId || ep.languages?.hindi_dub?.rumbleId);
      const animeData = { ...anime };
      // Only update the date if a Hindi Dub has been added/modified in this save operation.
      if (hasHindiDubUpdate && (!anime.latestHindiDubReleaseDate || new Date() > new Date(anime.latestHindiDubReleaseDate))) {
        animeData.latestHindiDubReleaseDate = new Date().toISOString();
      }
      console.log('[Admin Save] Payload for anime metadata upsert:', animeData);
      await upsert('anime', animeData);
      console.log('[Admin Save] Anime metadata saved successfully');

      // 5. Send Telegram Notifications (AFTER anime data is saved)
      if (settings?.telegramAutoPost && newEpisodesToNotify.length > 0) {
        console.log(`[Admin Save] Sending Telegram notifications for ${newEpisodesToNotify.length} new episodes`);
        
        // Validate that we have required data for notifications
        const posterImage = animeData.posterImageUrl || animeData.thumbnail || animeData.banner;
        if (!posterImage) {
          console.warn('[Telegram] No poster image available. Notifications will be sent without images.');
        }

        for (const ep of newEpisodesToNotify) {
          const availableLangs = getAvailableLanguages(ep.languages) || 'N/A';
          const watchUrl = `${window.location.origin}/watch/${animeData.slug}/${ep.number}`;
          
          try {
            console.log(`[Telegram] Sending notification for episode ${ep.number}...`);
            await notifyTelegramWithRetry({
              animeTitle: animeData.title,
              episodeNumber: ep.number,
              language: availableLangs,
              watchUrl: watchUrl,
              imageUrl: posterImage || null, // Pass null if no image available
              template: settings.telegramTemplate
            });
            console.log(`[Telegram] Notification sent successfully for episode ${ep.number}`);
          } catch (err) {
            console.error(`[Telegram] Failed to send notification for episode ${ep.number} after retries:`, err.message);
            // Don't throw - we don't want to fail the entire save if Telegram fails
          }
        }
        
        // Clear the new episodes tracking after notifications are sent
        setNewEpisodeIds(new Set());
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
  }, [animeId, anime, episodes, episodesToDelete, newEpisodeIds, upsert, remove, settings]);

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
    const tempId = `temp-${Date.now()}`; // Add a temporary unique ID for the key prop
    setNewEpisodeIds(prev => new Set(prev).add(tempId)); // Track this as a new episode
    setEpisodes(currentEpisodes => {
      const newEpisodeNumber = currentEpisodes.length > 0 ? Math.max(...currentEpisodes.map(e => e.number || 0)) + 1 : 1;
      return [...currentEpisodes, {
        id: tempId,
        number: newEpisodeNumber,
        languages: {
          chinese: { youtubeId: '', dailymotionId: '', rumbleId: '' },
          hindi_dub: { youtubeId: '', dailymotionId: '', rumbleId: '' },
          english_sub: { youtubeId: '', dailymotionId: '', rumbleId: '' }
        }
      }];
    });
  }, []);

  const removeEpisode = useCallback((index) => {
    setEpisodes(currentEpisodes => {
      const episodeToRemove = currentEpisodes[index];
      if (episodeToRemove && episodeToRemove.id) {
        setNewEpisodeIds(prev => {
          const updated = new Set(prev);
          updated.delete(episodeToRemove.id); // Remove from tracked new episodes if it was there
          return updated;
        });
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
                <input 
                  placeholder="Rumble ID" 
                  value={ep.languages?.[lang]?.rumbleId || ''}
                  onChange={(e) => handleEpisodeChange(index, lang, 'rumble', e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600" 
                />
              </div>
            ))}
            
            {/* Episode Comments */}
            {(() => {
              const episodeComments = commentsByEpisode[ep.id] || [];
              return (
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <h4 className="text-md font-bold text-white mb-2">Comments ({episodeComments.length})</h4>
                  {episodeComments.length === 0 ? (
                    <p className="text-sm text-gray-400">No comments for this episode yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {episodeComments.map(comment => (
                        <div key={comment.id} className="bg-gray-800 p-2 rounded-md flex justify-between items-start border border-gray-700">
                          <div>
                            <strong className="text-purple-300 text-sm">{comment.name}</strong>
                            <p className="text-gray-300 text-sm mt-1">{comment.body}</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              if (window.confirm('Are you sure you want to delete this comment?')) {
                                remove('comments', comment.id);
                              }
                            }} 
                            className="text-red-500 hover:text-red-400 text-xs font-semibold ml-2 flex-shrink-0"
                            title="Delete Comment"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
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
