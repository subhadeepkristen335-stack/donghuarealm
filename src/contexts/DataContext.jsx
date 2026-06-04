import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import { db, firebaseReady } from '../lib/firebase.js'
import { loadState } from '../lib/storage.js'

const DataContext = createContext(null)
const collections = ['anime', 'episodes', 'comments']

// Collections that should sync with Firestore (not use localStorage)
const firestoreSyncedCollections = ['anime', 'episodes', 'settings', 'ads', 'pages', 'stats']

export function DataProvider({ children }) {
  const [state, setState] = useState(() => {
    // Only load non-Firestore collections from localStorage
    const savedState = loadState()
    const initialState = {}
    for (const key in savedState) {
      if (!firestoreSyncedCollections.includes(key)) {
        initialState[key] = savedState[key]
      }
    }
    return initialState
  })
  // Always start as loading=true since we need to fetch from Firestore before rendering content
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If Firebase isn't available yet, we're in a loading state. This effect will re-run when it's ready.
    if (!firebaseReady || !db) {
      setLoading(true);
      return
    }

    setLoading(true);
    const unsubscribers = [];

    // Subscribe to all collections that should sync with Firestore
    const firestoreCollections = [...collections, 'settings', 'ads', 'pages', 'stats']
    
    const initialLoadPromises = firestoreCollections.map(name => {
      return new Promise((resolve, reject) => {
        const q = collection(db, name);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log(`[DataContext] Received snapshot for ${name}: ${data.length} documents`)
          setState(current => ({
            ...current,
            [name]: data,
          }));
          resolve(); // Resolve on the first snapshot for this collection
        }, (error) => {
          console.error(`Failed to listen to ${name} collection:`, error.message);
          reject(error);
        });
        unsubscribers.push(unsubscribe);
      });
    });

    Promise.all(initialLoadPromises)
      .catch(error => console.error("Error during initial data load:", error))
      .finally(() => {
        setLoading(false)
      });

    // Cleanup function to unsubscribe from all listeners when the component unmounts.
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [firebaseReady])

  // Removed localStorage save - Firestore is the source of truth for synced collections

  const upsert = useCallback(async function upsert(collectionName, item) {
    if (!item || !item.id) {
      throw new Error('Cannot upsert item without id');
    }
    
    const id = item.id
    const originalItem = state[collectionName]?.find(entry => entry.id === id);
    const nextItem = { ...item, id, updatedAt: new Date().toISOString() }
    
    // Persist to Firebase FIRST if available (for admin collections)
    if (firebaseReady && db && collections.includes(collectionName)) {
      try {
        console.log(`[DataContext] Upserting to Firestore: ${collectionName}/${id}`)
        await setDoc(doc(db, collectionName, id), nextItem)
        // Firestore listener will update local state automatically
      } catch (error) {
        console.error(`Failed to save to Firebase for ${collectionName}:`, error.message)
        // Re-throw the error so the caller can handle it
        throw error;
      }
    } else {
      // For non-Firestore collections, update local state immediately
      setState((current) => {
        if (!current[collectionName]) {
          return { ...current, [collectionName]: [nextItem] };
        }
        
        if (Array.isArray(current[collectionName])) {
          if (originalItem) {
            return {
              ...current,
              [collectionName]: current[collectionName].map((entry) => entry.id === id ? nextItem : entry),
            }
          } else {
            return {
              ...current,
              [collectionName]: [...current[collectionName], nextItem],
            }
          }
        }
        return current
      })
    }
    
    return nextItem
  }, [state])

  const remove = useCallback(async function remove(collectionName, id) {
    const itemToRemove = state[collectionName]?.find(entry => entry.id === id);
    if (!itemToRemove) return; // Nothing to remove

    // Persist to Firebase FIRST if available (for admin collections)
    if (firebaseReady && db && collections.includes(collectionName)) {
      try {
        console.log(`[DataContext] Deleting from Firestore: ${collectionName}/${id}`)
        await deleteDoc(doc(db, collectionName, id))
        // Firestore listener will update local state automatically
      } catch (error) {
        console.error(`Failed to delete from Firebase for ${collectionName}:`, error.message)
        // Re-throw error for caller
        throw error;
      }
    } else {
      // For non-Firestore collections, update local state immediately
      setState((current) => ({
        ...current,
        [collectionName]: current[collectionName]?.filter((entry) => entry.id !== id) || [],
      }))
    }
  }, [state])

  const updateSetting = useCallback(function updateSetting(path, value) {
    setState((current) => ({ ...current, settings: { ...current.settings, [path]: value } }))
  }, [])

  const updateObject = useCallback(function updateObject(collectionName, key, value) {
    setState((current) => ({ ...current, [collectionName]: { ...current[collectionName], [key]: value } }))
  }, [])

  const value = useMemo(() => ({ ...state, loading, setState, upsert, remove, updateSetting, updateObject }), [state, loading, upsert, remove, updateSetting, updateObject])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  return useContext(DataContext)
}
