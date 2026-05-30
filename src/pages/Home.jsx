import { Flame, Megaphone, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import AnimeGrid from '../components/AnimeGrid.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { getLatest } from '../utils/selectors.js'

export default function Home() {
  const { anime = [], episodes = [], settings = {}, loading } = useData()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    )
  }

  const featured = anime.find((item) => item.featured) || anime[0]
  
  if (!featured) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold text-white">No content available</h2>
        <p className="text-purple-200">
          The database is empty or could not be reached.<br/>
          Check your Firebase Firestore configuration.
        </p>
      </div>
    )
  }

  const latest = getLatest(anime, episodes).slice(0, 6)

  return (
    <div className="space-y-10">
      <section className="relative min-h-[520px] overflow-hidden rounded-lg border border-purple-300/10 bg-black">
        <img src={featured.banner} alt={featured.title} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-[#120720]/88 to-transparent" />
        <div className="relative flex min-h-[520px] max-w-3xl flex-col justify-end px-5 py-8 md:px-10">
          <div className="mb-4 flex w-fit items-center gap-2 rounded-full bg-purple-600/80 px-3 py-1 text-sm font-semibold text-white">
            <Flame size={16} /> Featured Realm Pick
          </div>
          <h1 className="text-4xl font-black text-white md:text-6xl">{featured.title}</h1>
          <p className="mt-4 line-clamp-3 max-w-2xl text-base text-purple-100 md:text-lg">{featured.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/anime/${featured.slug}`} className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-bold text-white shadow-lg shadow-purple-900/40">
              <PlayCircle className="mr-2 inline" /> Watch Now
            </Link>
            <Link to="/trending" className="rounded-lg bg-white/10 px-5 py-3 font-bold text-purple-100 hover:bg-white/15">Explore Trending</Link>
          </div>
        </div>
      </section>

      {settings?.announcement && (
        <div className="glass flex items-center gap-3 rounded-lg p-4 text-purple-100">
          <Megaphone className="text-pink-300" />
          <p>{settings.announcement}</p>
        </div>
      )}

      <section>
        <SectionHeader title="Latest Episodes" subtitle="Fresh releases with clean episode navigation." action="View all" to="/latest" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {latest.map(({ anime: item, episode }) => (
            <Link key={episode.id} to={`/watch/${item.slug}/${episode.number}`} className="anime-card flex gap-3 rounded-lg p-3">
              <img src={item.thumbnail} alt="" className="h-24 w-16 rounded object-cover" />
              <div className="min-w-0">
                <h3 className="truncate font-bold text-white">{item.title}</h3>
                <p className="text-sm text-purple-200">Episode {episode.number}: {episode.title}</p>
                <p className="mt-2 text-xs text-pink-200">{episode.duration} • {episode.createdAt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Trending Donghua" subtitle="Most watched realms this week." action="More trending" to="/trending" />
        <AnimeGrid items={anime.filter((item) => item.trending)} />
      </section>
    </div>
  )
}
