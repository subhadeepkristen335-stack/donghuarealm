import { Lock } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Login() {
  const { login, authError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function submit(event) {
    event.preventDefault()
    try {
      await login(email, password)
      navigate('/admin')
    } catch (error) {
      // Error is already set in authError state
      console.error('Login failed:', error.message)
    }
  }

  return (
    <form onSubmit={submit} className="glass mx-auto max-w-md rounded-lg p-6">
      <h1 className="mb-5 flex items-center gap-2 text-2xl font-black text-white"><Lock /> Admin Login</h1>
      <label className="mb-3 block text-sm text-purple-200">Email<input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-purple-300/15 bg-black/35 px-4 py-3 text-white outline-none" /></label>
      <label className="mb-4 block text-sm text-purple-200">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-purple-300/15 bg-black/35 px-4 py-3 text-white outline-none" /></label>
      {authError && <p className="mb-3 text-sm text-pink-200">{authError}</p>}
      <button className="w-full rounded-lg bg-purple-600 py-3 font-bold text-white">Login</button>
    </form>
  )
}
