import { Bookmark, Play, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useData } from '../contexts/DataContext.jsx'
import { formatViews, getAnimeEpisodes } from '../utils/selectors.js'

export default function AnimeCard({ anime }) {
  const { episodes, bookmarks, upsert, remove } = useData()
  const latest = getAnimeEpisodes(episodes, anime.id)[0]
  const saved = bookmarks.some((item) => item.animeId === anime.id)

  function toggleBookmark(event) {
    event.preventDefault()
    if (saved) remove('bookmarks', bookmarks.find((item) => item.animeId === anime.id).id)
    else upsert('bookmarks', { id: crypto.randomUUID(), animeId: anime.id, createdAt: new Date().toISOString() })
  }

  return (
    <Link to={`/anime/${anime.slug}`} className="anime-card group block overflow-hidden rounded-lg">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img src={anime.thumbnail} alt={anime.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {anime.isHindiDubAvailable && (
          <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-10">
            HINDI DUB
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <button
          onClick={toggleBookmark}
          className="absolute right-3 top-3 rounded-full bg-black/65 p-2 text-purple-100 transition hover:bg-purple-600"
          aria-label="Toggle bookmark"
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
          <span className="rounded-full bg-purple-600 px-2 py-1 font-semibold">EP {latest?.number || 1}</span>
          <span className="flex items-center gap-1 rounded-full bg-black/65 px-2 py-1"><Star size={13} /> {anime.rating}</span>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 font-bold text-white">{anime.title}</h3>
        <p className="line-clamp-2 text-sm text-purple-200">{anime.description}</p>
        <div className="flex items-center justify-between text-xs text-purple-300">
          <span>{formatViews(anime.views)} views</span>
          <span className="flex items-center gap-1 text-pink-200"><Play size={13} /> Watch</span>
        </div>
      </div>
    </Link>
  )
}
