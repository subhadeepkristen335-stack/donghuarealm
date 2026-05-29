import AnimeGrid from '../components/AnimeGrid.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { useData } from '../contexts/DataContext.jsx'

export default function Bookmarks() {
  const { anime, bookmarks } = useData()
  const items = anime.filter((item) => bookmarks.some((bookmark) => bookmark.animeId === item.id))
  return <section><SectionHeader title="Bookmarks" subtitle="Your saved favorites stay in local storage or Firestore after integration." /><AnimeGrid items={items} /></section>
}
