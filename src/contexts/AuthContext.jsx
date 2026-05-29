import { createContext, useContext, useMemo, useState } from 'react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, firebaseReady } from '../lib/firebase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('donghua-admin')
    return saved ? JSON.parse(saved) : null
  })
  const [authError, setAuthError] = useState('')

  async function login(email, password) {
    setAuthError('')
    try {
      // Try Firebase first if available
      if (firebaseReady && auth) {
        try {
          const result = await signInWithEmailAndPassword(auth, email, password)
          setUser(result.user)
          return result.user
        } catch (firebaseError) {
          // Firebase error - fall through to local auth
          if (firebaseError.code === 'auth/configuration-not-found' || firebaseError.code === 'auth/firebase-app-check-token-is-invalid') {
            console.warn(`Firebase auth issue (${firebaseError.code}), falling back to local auth`)
          } else {
            throw firebaseError
          }
        }
      }
      
      // Local authentication fallback
      if (email === 'admin@donghuarealm.local' && password === 'admin123') {
        const localUser = { email, uid: 'local-admin', role: 'admin' }
        localStorage.setItem('donghua-admin', JSON.stringify(localUser))
        setUser(localUser)
        return localUser
      }
      
      const error = new Error('Invalid email or password')
      setAuthError('Invalid email or password')
      throw error
    } catch (error) {
      const errorMsg = error.message || 'Login failed'
      setAuthError(errorMsg)
      throw error
    }
  }

  async function logout() {
    if (firebaseReady && auth) await signOut(auth)
    localStorage.removeItem('donghua-admin')
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, logout, authError, firebaseReady }), [user, authError])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
