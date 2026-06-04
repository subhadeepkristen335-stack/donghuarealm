import { Calendar, Heart, Play, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import AnimeGrid from '../components/AnimeGrid.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { formatViews, getAnimeEpisodes } from '../utils/selectors.js'
import NotFound from './NotFound.jsx'

export default function AnimeDetails() {
  const { slug } = useParams()
  const { anime, episodes, upsert } = useData()
  const item = anime.find((entry) => entry.slug === slug)
  if (!item) return <NotFound />
  const list = getAnimeEpisodes(episodes, item.id)
  const related = anime.filter((entry) => entry.id !== item.id && entry.genres.some((genre) => item.genres.includes(genre))).slice(0, 5)

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-lg border border-purple-300/10 bg-black">
        <img src={item.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-[#120720]/95 to-black/40" />
        <div className="relative grid gap-6 p-5 md:grid-cols-[230px_1fr] md:p-8">
          <img src={item.thumbnail} alt={item.title} className="aspect-[3/4] w-full max-w-[230px] rounded-lg object-cover shadow-2xl shadow-purple-950" />
          <div className="flex flex-col justify-end">
            <h1 className="text-3xl font-black text-white md:text-5xl">{item.title}</h1>
            <p className="mt-2 text-purple-200">{item.altTitle}</p>
            <p className="mt-4 max-w-3xl text-purple-100">{item.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {item.genres.map((genre) => <Link key={genre} to={`/genres/${genre}`} className="rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-100">{genre}</Link>)}
            </div>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-purple-200">
              <span><Star size={16} className="inline text-pink-300" /> {item.rating}</span>
              <span><Calendar size={16} className="inline text-pink-300" /> {item.releaseDate}</span>
              <span>{formatViews(item.views)} views</span>
            </div>
            <div className="mt-6 flex gap-3">
              {list[0] && <Link to={`/watch/${list[list.length - 1].id}`} className="rounded-lg bg-purple-600 px-5 py-3 font-bold text-white"><Play size={18} className="inline" /> Start Watching</Link>}
              <button onClick={() => upsert('bookmarks', { id: crypto.randomUUID(), animeId: item.id, createdAt: new Date().toISOString() })} className="rounded-lg bg-white/10 px-5 py-3 font-bold text-purple-100"><Heart size={18} className="inline" /> Favorite</button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Episode List" subtitle="YouTube and Dailymotion server IDs are stored per episode." />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.map((episode) => (
            <Link key={episode.id} to={`/watch/${episode.id}`} className="rounded-lg border border-purple-300/15 bg-purple-950/30 p-4 transition hover:border-purple-300/50 hover:bg-purple-700/25">
              <strong className="text-white">Episode {episode.number}</strong>
              <p className="text-sm text-purple-200">{episode.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Related Anime" />
        <AnimeGrid items={related} />
      </section>
    </div>
  )
}
