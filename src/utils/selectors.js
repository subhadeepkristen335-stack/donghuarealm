export const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export function getAnimeEpisodes(episodes, animeId) {
  return episodes.filter((episode) => episode.animeId === animeId).sort((a, b) => b.number - a.number)
}

export function getLatest(anime, episodes) {
  const seenAnimeIds = new Set()
  return [...episodes]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((episode) => {
      if (seenAnimeIds.has(episode.animeId)) {
        return false
      }
      seenAnimeIds.add(episode.animeId)
      return true
    })
    .map((episode) => ({ episode, anime: anime.find((item) => item.id === episode.animeId) }))
    .filter((item) => item.anime)
}

export function getEmbedUrl(server, id, start = 0) {
  if (server === 'dailymotion') {
    // Optimized Dailymotion embed with better parameters
    return `https://www.dailymotion.com/embed/video/${id}?start=${Math.floor(start)}&autoplay=0&controls=1&quality=auto&ui-highlights=true&ui-logo=false`
  }
  // Optimized YouTube embed with better parameters
  return `https://www.youtube.com/embed/${id}?start=${Math.floor(start)}&rel=0&modestbranding=1&controls=1&fs=1`
}

export function formatViews(value) {
  return Intl.NumberFormat('en', { notation: 'compact' }).format(value || 0)
}
