import { adsSeed, animeSeed, commentsSeed, episodeSeed, pagesSeed, settingsSeed } from '../data/seed.js'

const KEY = 'donghua-realm-state'

export function createInitialState() {
  return {
    anime: animeSeed,
    episodes: episodeSeed,
    users: [],
    comments: commentsSeed,
    bookmarks: [],
    watch_history: [],
    ads: adsSeed,
    settings: settingsSeed,
    pages: pagesSeed,
  }
}

export function loadState() {
  try {
    const saved = localStorage.getItem(KEY)
    if (!saved) return createInitialState()
    
    const savedState = JSON.parse(saved)
    const initial = createInitialState()
    
    // Properly merge state while preserving arrays
    const merged = { ...initial }
    for (const key in savedState) {
      if (Array.isArray(savedState[key]) && Array.isArray(initial[key])) {
        // For arrays: merge saved with seed, removing duplicates by id
        const savedItems = savedState[key].filter(item => item.id)
        
        // Keep all saved items and add any seed items not in saved
        const seedItems = initial[key].filter(item => !savedState[key].find(s => s.id === item.id))
        merged[key] = [...savedItems, ...seedItems]
      } else if (typeof savedState[key] === 'object' && !Array.isArray(savedState[key])) {
        // For objects: merge properties
        merged[key] = { ...initial[key], ...savedState[key] }
      } else {
        // For primitives: use saved value
        merged[key] = savedState[key]
      }
    }
    
    return merged
  } catch (error) {
    console.error('Failed to load state from localStorage:', error)
    return createInitialState()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save state to localStorage:', error)
  }
}
