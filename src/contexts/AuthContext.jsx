import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, firebaseReady } from '../lib/firebase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!firebaseReady || !auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
    })
    
    return () => unsubscribe()
  }, [])

  async function login(email, password) {
    setAuthError('')
    try {
      if (firebaseReady && auth) {
        const result = await signInWithEmailAndPassword(auth, email, password)
        return result.user
      } else {
        throw new Error('Firebase Auth is not initialized.')
      }
    } catch (error) {
      const errorMsg = error.message || 'Login failed'
      setAuthError(errorMsg)
      throw error
    }
  }

  async function logout() {
    if (firebaseReady && auth) await signOut(auth)
  }

  const value = useMemo(() => ({ user, login, logout, authError, firebaseReady }), [user, authError])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
