import { LogOut } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function AdminLayout() {
  const { logout, user } = useAuth()
  return (
    <div className="min-h-screen bg-[#07020f]">
      <header className="border-b border-purple-300/10 bg-black/45">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-black text-purple-100">Donghua Realm Admin</Link>
          <div className="flex items-center gap-3 text-sm text-purple-200">
            <span>{user?.email}</span>
            <button onClick={logout} className="rounded-lg bg-purple-600 px-3 py-2 text-white"><LogOut size={16} className="inline" /> Logout</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6"><Outlet /></main>
    </div>
  )
}
