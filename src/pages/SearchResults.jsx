import { useSearchParams } from 'react-router-dom'
import AnimeGrid from '../components/AnimeGrid.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { useData } from '../contexts/DataContext.jsx'

export default function SearchResults() {
  const [params] = useSearchParams()
  const query = params.get('q') || ''
  const { anime } = useData()
  const results = anime.filter((item) => `${item.title} ${item.altTitle} ${item.genres.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  return <section><SectionHeader title={`Search: ${query || 'All'}`} subtitle={`${results.length} result(s) found`} /><AnimeGrid items={results} /></section>
}
