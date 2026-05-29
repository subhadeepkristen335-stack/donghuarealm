import { Link } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { getLatest } from '../utils/selectors.js'

export default function Latest() {
  const { anime, episodes } = useData()
  return (
    <section>
      <SectionHeader title="Latest Releases" subtitle="Newest episodes first." />
      <div className="grid gap-3">
        {getLatest(anime, episodes).map(({ anime: item, episode }) => (
          <Link key={episode.id} to={`/watch/${episode.id}`} className="anime-card grid gap-4 rounded-lg p-4 sm:grid-cols-[90px_1fr_auto] sm:items-center">
            <img src={item.thumbnail} alt="" className="h-28 w-20 rounded object-cover" />
            <div><h3 className="font-bold text-white">{item.title}</h3><p className="text-purple-200">Episode {episode.number}: {episode.title}</p></div>
            <span className="text-sm text-pink-200">{episode.createdAt}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
