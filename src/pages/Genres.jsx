import { Link, useParams } from 'react-router-dom'
import AnimeGrid from '../components/AnimeGrid.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { useData } from '../contexts/DataContext.jsx'

export default function Genres() {
  const { genre } = useParams()
  const { anime } = useData()
  const genres = [...new Set(anime.flatMap((item) => item.genres))].sort()
  const items = genre ? anime.filter((item) => item.genres.includes(genre)) : anime
  return (
    <div className="space-y-6">
      <SectionHeader title={genre || 'Genres'} subtitle="Filter by cultivation, fantasy, sci-fi, romance, and more." />
      <div className="flex flex-wrap gap-2">{genres.map((item) => <Link key={item} to={`/genres/${item}`} className={`rounded-full px-3 py-2 text-sm ${item === genre ? 'bg-purple-600 text-white' : 'bg-purple-500/15 text-purple-100'}`}>{item}</Link>)}</div>
      <AnimeGrid items={items} />
    </div>
  )
}
