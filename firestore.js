import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from './src/lib/firebase.js';

const animeCollectionRef = collection(db, 'anime');

/**
 * Fetches anime with Hindi dub, ordered by trending score.
 * @param {number} count - The number of anime to fetch.
 */
export const getTrendingHindiDub = async (count = 10) => {
  const q = query(
    animeCollectionRef,
    where('isHindiDubAvailable', '==', true),
    limit(count)
  );
  const querySnapshot = await getDocs(q);
  const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Sort client-side to avoid requiring a composite index
  results.sort((a, b) => (b.trendingScore || b.trending || 0) - (a.trendingScore || a.trending || 0));
  return results;
};

/**
 * Fetches the latest released Hindi dub anime.
 * @param {number} count - The number of anime to fetch.
 */
export const getLatestHindiDubReleases = async (count = 10) => {
  const q = query(
    animeCollectionRef,
    where('isHindiDubAvailable', '==', true),
    limit(count)
  );
  const querySnapshot = await getDocs(q);
  const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Sort client-side to avoid requiring a composite index
  results.sort((a, b) => new Date(b.latestHindiDubReleaseDate || 0) - new Date(a.latestHindiDubReleaseDate || 0));
  return results;
};
