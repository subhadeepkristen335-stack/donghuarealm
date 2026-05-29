import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext.jsx'

export default function SearchBox() {
  const navigate = useNavigate()
  const { anime } = useData()
  const [query, setQuery] = useState('')
  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return []
    return anime.filter((item) => `${item.title} ${item.altTitle}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
  }, [anime, query])

  function submit(event) {
    event.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" size={18} />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search donghua, anime, episodes..."
        className="w-full rounded-lg border border-purple-400/20 bg-black/45 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-purple-300"
      />
      {suggestions.length > 0 && (
        <div className="glass absolute left-0 right-0 top-14 z-40 overflow-hidden rounded-lg">
          {suggestions.map((item) => (
            <Link key={item.id} to={`/anime/${item.slug}`} className="flex gap-3 p-3 transition hover:bg-purple-500/20" onClick={() => setQuery('')}>
              <img src={item.thumbnail} alt="" className="h-14 w-10 rounded object-cover" />
              <span>
                <strong className="block text-sm text-white">{item.title}</strong>
                <small className="text-purple-200">{item.genres.join(', ')}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </form>
  )
}
