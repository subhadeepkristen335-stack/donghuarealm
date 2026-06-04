import { BarChart3, Megaphone, Palette, Plus, Save, Trash2, ArrowLeft, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useData } from '../contexts/DataContext.jsx'
import { slugify } from '../utils/selectors.js'
import AdminAnimeForm from '../../AdminAnimeForm.jsx'

const input = 'w-full rounded-lg border border-purple-300/15 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-purple-300'

export default function AdminDashboard() {
  const data = useData()
  const { anime, episodes, comments, bookmarks, watch_history, ads, settings, pages, stats, upsert, remove, updateSetting, updateObject } = data
  const [editingAnimeId, setEditingAnimeId] = useState(null)
  const [animeForm, setAnimeForm] = useState({
    title: '',
    description: '',
    genres: '',
    thumbnail: '',
    banner: '',
    releaseDate: '',
    rating: 8,
    status: 'Ongoing',
    isHindiDubAvailable: false,
  })

  const dashboardStats = useMemo(() => {
    const trafficStats = stats?.find?.((doc) => doc.id === 'traffic') || { views: 0 };
    return [
      ['Website Views', trafficStats.views],
      ['Anime', anime?.length || 0],
      ['Episodes', episodes?.length || 0],
      ['Comments', comments?.length || 0],
      ['Bookmarks', bookmarks?.length || 0],
      ['History Items', watch_history?.length || 0],
    ];
  }, [stats, anime, episodes, comments, bookmarks, watch_history])

  function saveAnime(event) {
    event.preventDefault()
    const id = animeForm.id || slugify(animeForm.title)
    upsert('anime', {
      ...animeForm,
      id,
      slug: slugify(animeForm.title),
      genres: animeForm.genres.split(',').map((genre) => genre.trim()).filter(Boolean),
      rating: Number(animeForm.rating || 0),
      views: Number(animeForm.views || 0),
      likes: Number(animeForm.likes || 0),
      featured: Boolean(animeForm.featured),
      trending: Boolean(animeForm.trending),
      latest: Boolean(animeForm.latest),
      isHindiDubAvailable: Boolean(animeForm.isHindiDubAvailable),
    })
    setAnimeForm({ title: '', description: '', genres: '', thumbnail: '', banner: '', releaseDate: '', rating: 8, status: 'Ongoing', isHindiDubAvailable: false })
  }

  function editAnime(item) {
    setAnimeForm({ ...item, genres: item.genres.join(', ') })
  }

  if (editingAnimeId) {
    return (
      <div>
        <button onClick={() => setEditingAnimeId(null)} className="mb-4 flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 font-bold text-white hover:bg-gray-700">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <AdminAnimeForm animeId={editingAnimeId} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-6">
        {dashboardStats.map(([label, value]) => (
          <div key={label} className="glass rounded-lg p-4">
            <BarChart3 className="mb-3 text-pink-300" />
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-sm text-purple-200">{label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6">
        <section className="glass rounded-lg p-5">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-white"><Plus /> Add/Edit Anime</h2>
          <form onSubmit={saveAnime} className="grid gap-3 md:grid-cols-2">
            <input className={input} placeholder="Title" value={animeForm.title} onChange={(e) => setAnimeForm({ ...animeForm, title: e.target.value })} required />
            <input className={input} placeholder="Alt title" value={animeForm.altTitle || ''} onChange={(e) => setAnimeForm({ ...animeForm, altTitle: e.target.value })} />
            <input className={input} placeholder="Genres comma separated" value={animeForm.genres} onChange={(e) => setAnimeForm({ ...animeForm, genres: e.target.value })} />
            <input className={input} placeholder="Release date" value={animeForm.releaseDate} onChange={(e) => setAnimeForm({ ...animeForm, releaseDate: e.target.value })} />
            <input className={input} placeholder="Thumbnail URL" value={animeForm.thumbnail} onChange={(e) => setAnimeForm({ ...animeForm, thumbnail: e.target.value })} />
            <input className={input} placeholder="Banner URL" value={animeForm.banner} onChange={(e) => setAnimeForm({ ...animeForm, banner: e.target.value })} />
            <textarea className={`${input} md:col-span-2`} placeholder="Description" value={animeForm.description} onChange={(e) => setAnimeForm({ ...animeForm, description: e.target.value })} />
            <div className="flex flex-wrap gap-4 text-sm text-purple-100 md:col-span-2">
              {['featured', 'trending', 'latest'].map((key) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(animeForm[key])} onChange={(e) => setAnimeForm({ ...animeForm, [key]: e.target.checked })} /> {key}</label>)}
              <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(animeForm.isHindiDubAvailable)} onChange={(e) => setAnimeForm({ ...animeForm, isHindiDubAvailable: e.target.checked })} /> isHindiDubAvailable</label>
            </div>
            <button className="rounded-lg bg-purple-600 px-4 py-3 font-bold text-white md:col-span-2"><Save className="inline" /> Save Anime</button>
          </form>
          <div className="mt-6 rounded-lg border border-purple-400/20 bg-purple-900/20 p-3 text-center text-sm text-purple-200">
            <p className="font-semibold">To add or edit episodes (including Hindi Dubs):</p>
            <p>Find the anime in the list below and click <span className="mx-1 inline-block rounded-md bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">Manage Episodes</span>.</p>
          </div>
          <div className="mt-5 grid gap-2">
            {anime.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3 text-sm">
                <span className="text-left text-purple-100">{item.title}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => editAnime(item)} className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700" title="Edit Metadata"><Pencil size={14} /></button>
                  <button onClick={() => setEditingAnimeId(item.id)} className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">Manage Episodes</button>
                  <button onClick={() => remove('anime', item.id)} className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700" title="Delete Anime"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Advertisement Codes" icon={<Megaphone />}>
          {Object.entries(ads).map(([key, value]) => <label key={key} className="mb-3 block text-sm text-purple-200">{key}<textarea className={input} value={value} onChange={(e) => updateObject('ads', key, e.target.value)} /></label>)}
        </Panel>
        <Panel title="Site Settings" icon={<Palette />}>
          <label className="mb-3 block text-sm text-purple-200">Website title<input className={input} value={settings.title} onChange={(e) => updateSetting('title', e.target.value)} /></label>
          <label className="mb-3 block text-sm text-purple-200">Logo text<input className={input} value={settings.logo} onChange={(e) => updateSetting('logo', e.target.value)} /></label>
          <label className="mb-3 block text-sm text-purple-200">SEO description<textarea className={input} value={settings.seoDescription} onChange={(e) => updateSetting('seoDescription', e.target.value)} /></label>
          <label className="mb-3 block text-sm text-purple-200">Announcement<textarea className={input} value={settings.announcement} onChange={(e) => updateSetting('announcement', e.target.value)} /></label>
          <label className="block text-sm text-purple-200">Footer<textarea className={input} value={settings.footer} onChange={(e) => updateSetting('footer', e.target.value)} /></label>
          <label className="mt-3 mb-3 block text-sm text-purple-200">
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={Boolean(settings.telegramAutoPost)} onChange={(e) => updateSetting('telegramAutoPost', e.target.checked)} /> Enable Telegram Auto-Posting
            </span>
          </label>
          <label className="mb-3 block text-sm text-purple-200">Telegram Message Template (Use <code>{`{Anime Title}`}</code>, <code>{`{Number}`}</code>, <code>{`{Language}`}</code>, <code>{`{Episode URL}`}</code>)<textarea className={input} rows="5" value={settings.telegramTemplate || "🔥 {Anime Title} - Episode {Number}\n\n🌐 Language: {Language}\n\n▶ Watch Now:\n{Episode URL}\n\n#DonghuaRealm"} onChange={(e) => updateSetting('telegramTemplate', e.target.value)} /></label>
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Editable Pages">
          {Object.entries(pages).map(([key, page]) => (
            <div key={key} className="mb-4">
              <input className={`${input} mb-2`} value={page.title} onChange={(e) => updateObject('pages', key, { ...page, title: e.target.value })} />
              <textarea className={input} rows="4" value={page.body} onChange={(e) => updateObject('pages', key, { ...page, body: e.target.value })} />
            </div>
          ))}
        </Panel>
        <Panel title="Navigation, Socials, Theme">
          <p className="mb-3 text-sm text-purple-200">Edit nav, social links, logo URLs, favicon, and theme colors in <code>settings</code>. These fields are stored as the <code>settings</code> collection/document when wired to Firestore.</p>
          <pre className="max-h-80 overflow-auto rounded-lg bg-black/45 p-3 text-xs text-purple-100">{JSON.stringify(settings, null, 2)}</pre>
        </Panel>
      </section>
    </div>
  )
}

function Panel({ title, icon, children }) {
  return <section className="glass rounded-lg p-5"><h2 className="mb-4 flex items-center gap-2 text-xl font-black text-white">{icon}{title}</h2>{children}</section>
}
