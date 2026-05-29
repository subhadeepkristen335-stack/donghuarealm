import { MessageCircle, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader.jsx'
import VideoPlayer from '../components/VideoPlayer.jsx'
import { useData } from '../contexts/DataContext.jsx'
import { getAnimeEpisodes } from '../utils/selectors.js'
import NotFound from './NotFound.jsx'

export default function Watch() {
  const { episodeId } = useParams()
  const { anime, episodes, comments, upsert, loading } = useData()
  const [body, setBody] = useState('')
  
  const episode = episodes.find((item) => item.id === episodeId)
  const item = anime.find((entry) => entry.id === episode?.animeId)
  const episodeComments = useMemo(() => comments.filter((comment) => comment.episodeId === episodeId), [comments, episodeId])
  
  // Show loading state while data is being loaded
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center text-purple-200">
          <p className="mb-2 text-xl font-bold">Loading episode...</p>
          <p className="text-sm">Please wait</p>
        </div>
      </div>
    )
  }
  
  // If episode not found
  if (!episode) {
    return (
      <div className="space-y-6">
        <NotFound />
        <div className="text-center text-purple-200">
          <p className="text-sm">Episode ID: {episodeId}</p>
          <p className="text-xs">Episode data not found. Try navigating from home or latest episodes.</p>
        </div>
      </div>
    )
  }
  
  // If anime not found
  if (!item) {
    return <NotFound />
  }

  const list = getAnimeEpisodes(episodes, item.id).reverse()
  const index = list.findIndex((entry) => entry.id === episodeId)
  const nextEpisode = list[index + 1]

  function submit(event) {
    event.preventDefault()
    if (!body.trim()) return
    upsert('comments', { episodeId, name: 'Guest', body, createdAt: new Date().toISOString().slice(0, 10) })
    setBody('')
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/anime/${item.slug}`} className="text-sm text-pink-300">{item.title}</Link>
        <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">Episode {episode.number}: {episode.title}</h1>
      </div>
      <VideoPlayer episode={episode} anime={item} nextEpisode={nextEpisode} />
      <section>
        <SectionHeader title="Episode Navigation" />
        <div className="flex flex-wrap gap-2">
          {list.map((entry) => <Link key={entry.id} to={`/watch/${entry.id}`} className={`rounded-lg px-3 py-2 text-sm ${entry.id === episodeId ? 'bg-purple-600 text-white' : 'bg-white/10 text-purple-100'}`}>EP {entry.number}</Link>)}
        </div>
      </section>
      <section className="glass rounded-lg p-5">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white"><MessageCircle /> Comments</h2>
        <form onSubmit={submit} className="mb-5 flex gap-2">
          <input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a comment..." className="flex-1 rounded-lg border border-purple-300/15 bg-black/35 px-4 py-3 outline-none focus:border-purple-300" />
          <button className="rounded-lg bg-pink-600 px-4 py-3 text-white"><Send size={18} /></button>
        </form>
        <div className="space-y-3">
          {episodeComments.map((comment) => <div key={comment.id} className="rounded-lg bg-white/5 p-3"><strong className="text-purple-100">{comment.name}</strong><p className="text-sm text-purple-200">{comment.body}</p></div>)}
        </div>
      </section>
    </div>
  )
}