import { Bookmark, Clock, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useData } from '../contexts/DataContext.jsx'
import AdSlot from './AdSlot.jsx'
import SearchBox from './SearchBox.jsx'

export default function Layout() {
  const { settings } = useData()
  const [open, setOpen] = useState(false)
  const nav = settings.nav || []

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-purple-300/10 bg-[#080313]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/" className="text-xl font-black tracking-wide text-white">
            <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{settings.logo}</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => <NavLink key={item.href} to={item.href} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-purple-600 text-white' : 'text-purple-100 hover:bg-purple-500/20'}`}>{item.label}</NavLink>)}
          </nav>
          <div className="ml-auto hidden flex-1 justify-end md:flex"><SearchBox /></div>
          <Link to="/bookmarks" className="hidden rounded-lg p-2 text-purple-100 hover:bg-purple-500/20 sm:block" aria-label="Bookmarks"><Bookmark size={20} /></Link>
          <Link to="/history" className="hidden rounded-lg p-2 text-purple-100 hover:bg-purple-500/20 sm:block" aria-label="History"><Clock size={20} /></Link>
          <button className="ml-auto rounded-lg p-2 text-purple-100 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <div className="border-t border-purple-300/10 px-4 pb-4 lg:hidden">
            <SearchBox />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[...nav, { label: 'Bookmarks', href: '/bookmarks' }, { label: 'History', href: '/history' }].map((item) => (
                <NavLink key={item.href} to={item.href} onClick={() => setOpen(false)} className="rounded-lg bg-purple-500/10 px-3 py-2 text-sm text-purple-100">{item.label}</NavLink>
              ))}
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5">
        <AdSlot placement="top" className="mb-5" />
        <Outlet />
        <AdSlot placement="bottom" className="mt-8" />
      </main>
      <footer className="mt-10 border-t border-purple-300/10 bg-black/30">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm text-purple-200 md:grid-cols-[1fr_auto]">
          <p>{settings.footer}</p>
          <div className="flex gap-4">
            <Link to="/about-us">About</Link><Link to="/contact-us">Contact</Link><Link to="/privacy-policy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/admin">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
