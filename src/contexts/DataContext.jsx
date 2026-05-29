import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import { db, firebaseReady } from '../lib/firebase.js'
import { loadState, saveState } from '../lib/storage.js'

const DataContext = createContext(null)
const collections = ['anime', 'episodes', 'comments']

export function DataProvider({ children }) {
  const [state, setState] = useState(loadState)
  const [loading, setLoading] = useState(!firebaseReady) // If Firebase isn't ready, we're already not loading

  useEffect(() => {
    // If Firebase isn't available yet, we're in a loading state. This effect will re-run when it's ready.
    if (!firebaseReady || !db) {
      // Keep loading until firebase is ready.
      if (!loading) {
        setLoading(true);
      }
      return
    }

    setLoading(true);
    const unsubscribers = [];

    const initialLoadPromises = collections.map(name => {
      return new Promise((resolve, reject) => {
        const q = collection(db, name);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  useEffect(() => {
    saveState(state)
  }, [state])

  const upsert = useCallback(async function upsert(collectionName, item) {
    if (!item || !item.id) {
      throw new Error('Cannot upsert item without id');
    }
    
    const id = item.id
    const originalItem = state[collectionName]?.find(entry => entry.id === id);
    const nextItem = { ...item, id, updatedAt: new Date().toISOString() }
    
    // Update local state immediately
    setState((current) => {
      if (!current[collectionName]) {
        // If collection doesn't exist, create it.
        return { ...current, [collectionName]: [nextItem] };
      }
      
      if (Array.isArray(current[collectionName])) {
        // Check if item already exists
        if (originalItem) {
          // Update existing item
          return {
            ...current,
            [collectionName]: current[collectionName].map((entry) => entry.id === id ? nextItem : entry),
          }
        } else {
          // Add new item
          return {
            ...current,
            [collectionName]: [...current[collectionName], nextItem],
          }
        }
      }
      return current
    })
    
    // Persist to Firebase if available
    if (firebaseReady && db && collections.includes(collectionName)) {
      try {
        await setDoc(doc(db, collectionName, id), nextItem)
      } catch (error) {
        console.warn(`Failed to save to Firebase for ${collectionName}:`, error.message)
        // Revert local state on failure
        setState(current => {
            if (!current[collectionName]) return current;
            if (originalItem) {
                // Item existed, so map back to original
                return { ...current, [collectionName]: current[collectionName].map(entry => entry.id === id ? originalItem : entry) };
            } else {
                // Item was new, so filter it out
                return { ...current, [collectionName]: current[collectionName].filter(entry => entry.id !== id) };
            }
        });
        // Re-throw the error so the caller can handle it
        throw error;
      }
    }
    
    return nextItem
  }, [state])

  const remove = useCallback(async function remove(collectionName, id) {
    const itemToRemove = state[collectionName]?.find(entry => entry.id === id);
    if (!itemToRemove) return; // Nothing to remove

    // Update local state first
    setState((current) => ({
      ...current,
      [collectionName]: current[collectionName]?.filter((entry) => entry.id !== id) || [],
    }))
    
    // Persist to Firebase if available
    if (firebaseReady && db && collections.includes(collectionName)) {
      try {
        await deleteDoc(doc(db, collectionName, id))
      } catch (error) {
        console.warn(`Failed to delete from Firebase for ${collectionName}:`, error.message)
        // Revert local state on failure by re-adding the item
        setState((current) => {
          if (!current[collectionName]) return { ...current, [collectionName]: [itemToRemove] };
          // Avoid duplicates if it's somehow still there
          if (current[collectionName].some(entry => entry.id === id)) return current;
          return {
            ...current,
            [collectionName]: [...current[collectionName], itemToRemove],
          }
        })
        // Re-throw error for caller
        throw error;
      }
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
