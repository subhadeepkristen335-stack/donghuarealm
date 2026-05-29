import { Link } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader.jsx'
import { useData } from '../contexts/DataContext.jsx'

export default function History() {
  const { anime, episodes, watch_history } = useData()
  return (
    <section>
      <SectionHeader title="Watch History" subtitle="Auto-saved progress while you watch." />
      <div className="grid gap-3">
        {watch_history.map((entry) => {
          const episode = episodes.find((item) => item.id === entry.episodeId)
          const item = anime.find((row) => row.id === entry.animeId)
          if (!episode || !item) return null
          return <Link key={entry.id} to={`/watch/${episode.id}`} className="rounded-lg bg-purple-950/35 p-4 text-purple-100">{item.title} • Episode {episode.number} • Resume around {entry.progress}s</Link>
        })}
      </div>
    </section>
  )
}
