import fs from 'node:fs'
import { animeSeed } from '../src/data/seed.js'

const baseUrl = process.env.SITE_URL || 'https://donghua-realm.vercel.app'
const staticRoutes = ['', 'trending', 'latest', 'genres', 'bookmarks', 'history', 'about-us', 'contact-us', 'privacy-policy', 'terms']
const urls = [
  ...staticRoutes.map((route) => `${baseUrl}/${route}`.replace(/\/$/, '')),
  ...animeSeed.map((anime) => `${baseUrl}/anime/${anime.slug}`),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`

fs.writeFileSync('public/sitemap.xml', xml)
console.log(`Generated ${urls.length} sitemap URLs`)
