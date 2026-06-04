export const animeSeed = [
  {
    id: 'btth',
    slug: 'battle-through-the-heavens',
    title: 'Battle Through the Heavens',
    altTitle: 'Doupo Cangqiong',
    description:
      'Xiao Yan rises from disgrace into a blazing cultivation war filled with ancient clans, heavenly flames, and fierce rivals.',
    genres: ['Action', 'Adventure', 'Fantasy', 'Cultivation'],
    releaseDate: '2025-11-08',
    status: 'Ongoing',
    rating: 9.2,
    views: 884200,
    likes: 24700,
    featured: true,
    trending: true,
    latest: true,
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'swallowed-star',
    slug: 'swallowed-star',
    title: 'Swallowed Star',
    altTitle: 'Tunshi Xingkong',
    description:
      'A martial prodigy fights monsters, cosmic empires, and his own limits after Earth enters a terrifying new era.',
    genres: ['Sci-Fi', 'Action', 'Martial Arts'],
    releaseDate: '2025-10-17',
    status: 'Ongoing',
    rating: 8.9,
    views: 642100,
    likes: 18900,
    featured: true,
    trending: true,
    latest: true,
    banner: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'perfect-world',
    slug: 'perfect-world',
    title: 'Perfect World',
    altTitle: 'Wanmei Shijie',
    description:
      'Shi Hao journeys from a small village into a vast mythic world where bloodlines, beasts, and gods decide destiny.',
    genres: ['Fantasy', 'Adventure', 'Drama'],
    releaseDate: '2025-09-29',
    status: 'Ongoing',
    rating: 9.0,
    views: 702300,
    likes: 21040,
    featured: false,
    trending: true,
    latest: true,
    banner: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1509909756405-be0199881695?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'throne-seal',
    slug: 'throne-of-seal',
    title: 'Throne of Seal',
    altTitle: 'Shen Yin Wangzuo',
    description:
      'A young knight enters a holy war against demons while protecting the people and ideals that shaped him.',
    genres: ['Action', 'Fantasy', 'Romance'],
    releaseDate: '2025-08-22',
    status: 'Ongoing',
    rating: 8.7,
    views: 398420,
    likes: 11200,
    featured: false,
    trending: false,
    latest: true,
    banner: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=700&q=80',
  },
]

export const episodeSeed = [
  { id: 'btth-101', animeId: 'btth', number: 101, title: 'Heavenly Flame Pact', youtube: 'dQw4w9WgXcQ', dailymotion: 'x84sh87', duration: '21m', createdAt: '2026-05-24', views: 12500 },
  { id: 'btth-102', animeId: 'btth', number: 102, title: 'Clan War Ignites', youtube: 'ysz5S6PUM-U', dailymotion: 'x7tgcz4', duration: '22m', createdAt: '2026-05-26', views: 8900 },
  { id: 'swallowed-star-78', animeId: 'swallowed-star', number: 78, title: 'Galactic Trial', youtube: 'ScMzIvxBSi4', dailymotion: 'x8m0e9j', duration: '20m', createdAt: '2026-05-23', views: 14200 },
  { id: 'swallowed-star-79', animeId: 'swallowed-star', number: 79, title: 'Star Tower Signal', youtube: 'aqz-KE-bpKQ', dailymotion: 'x7u5rbc', duration: '20m', createdAt: '2026-05-27', views: 9300 },
  { id: 'perfect-world-165', animeId: 'perfect-world', number: 165, title: 'Ancient Beast Realm', youtube: 'M7lc1UVf-VE', dailymotion: 'x6p0b64', duration: '23m', createdAt: '2026-05-25', views: 11500 },
  { id: 'throne-seal-112', animeId: 'throne-seal', number: 112, title: 'Crown of Light', youtube: 'jNQXAC9IVRw', dailymotion: 'x8i9w7x', duration: '21m', createdAt: '2026-05-22', views: 5600 },
]

export const settingsSeed = {
  title: 'Donghua Realm',
  logo: 'Donghua Realm',
  favicon: '/favicon.svg',
  seoDescription: 'Watch latest donghua and anime episodes with YouTube and Dailymotion servers.',
  colors: { primary: '#a855f7', accent: '#ec4899', background: '#06020d' },
  socials: { telegram: 'https://t.me/donghuarealm', youtube: 'https://youtube.com', discord: 'https://discord.com' },
  footer: 'Donghua Realm streams embeds from supported video platforms and stores only video IDs.',
  announcement: 'New episodes are added daily. Bookmark your realm and continue watching anytime.',
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Trending', href: '/trending' },
    { label: 'Latest', href: '/latest' },
    { label: 'Genres', href: '/genres' },
  ],
}

export const adsSeed = {
  top: '<strong>Top Banner Ad</strong><span> Paste HTML/JS ad code in Admin.</span>',
  bottom: '<strong>Bottom Banner Ad</strong>',
  sidebar: '<strong>Sidebar Ad</strong><br/>300 x 250',
  inVideo: '<strong>In-video Ad Space</strong>',
}

export const pagesSeed = {
  about: { title: 'About Us', body: 'Donghua Realm is a modern fan streaming directory for donghua and anime embeds.' },
  contact: { title: 'Contact Us', body: 'Email: admin@donghuarealm.example. Replace this from the admin dashboard.' },
  privacy: { title: 'Privacy Policy', body: 'We store account, bookmark, comment, and watch history data needed to operate the website.' },
  terms: { title: 'Terms & Conditions', body: 'Use Donghua Realm responsibly. Embedded videos are served by their original platforms.' },
}

export const commentsSeed = [
  { id: 'c1', episodeId: 'btth-102', name: 'RealmFan', body: 'The purple flame scene was wild.', createdAt: '2026-05-27' },
  { id: 'c2', episodeId: 'swallowed-star-79', name: 'NovaCultivator', body: 'Server switch works great on mobile.', createdAt: '2026-05-27' },
]
