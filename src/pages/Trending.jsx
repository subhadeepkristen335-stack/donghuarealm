import AnimeGrid from '../components/AnimeGrid.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { useData } from '../contexts/DataContext.jsx'

export default function Trending() {
  const { anime } = useData()
  return <section><SectionHeader title="Trending" subtitle="Featured by watch activity and admin curation." /><AnimeGrid items={anime.filter((item) => item.trending)} /></section>
}
