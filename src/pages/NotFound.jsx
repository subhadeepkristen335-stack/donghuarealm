import { Link } from 'react-router-dom'

export default function NotFound() {
  return <div className="glass mx-auto max-w-xl rounded-lg p-8 text-center"><h1 className="text-5xl font-black text-white">404</h1><p className="mt-3 text-purple-200">This realm page could not be found.</p><Link to="/" className="mt-5 inline-block rounded-lg bg-purple-600 px-5 py-3 font-bold text-white">Back Home</Link></div>
}
