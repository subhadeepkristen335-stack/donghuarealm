import AnimeCard from './AnimeCard.jsx'

export default function AnimeGrid({ items }) {
  if (!items?.length) return <div className="glass rounded-lg p-8 text-center text-purple-200">No anime found.</div>
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((anime) => <AnimeCard anime={anime} key={anime.id} />)}
    </div>
  )
}
