import { useData } from '../contexts/DataContext.jsx'

export default function Page({ slug }) {
  const { pages } = useData()
  const page = pages[slug]
  return <article className="glass mx-auto max-w-3xl rounded-lg p-6"><h1 className="mb-4 text-3xl font-black text-white">{page?.title}</h1><p className="whitespace-pre-wrap text-purple-100">{page?.body}</p></article>
}
