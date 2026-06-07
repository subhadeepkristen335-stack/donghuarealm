export const LANGUAGE_OPTIONS = [
  { key: 'hindi_dub', name: 'Hindi Dub' },
  { key: 'chinese', name: 'Chinese' },
  { key: 'english_sub', name: 'English Sub' },
]

export const VIDEO_PROVIDERS = [
  { key: 'youtube', idField: 'youtubeId' },
  { key: 'rumble', idField: 'rumbleId' },
  { key: 'dailymotion', idField: 'dailymotionId' },
]

export function hasVideoId(value) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

export function languageHasVideo(languageData) {
  return VIDEO_PROVIDERS.some(({ idField }) => hasVideoId(languageData?.[idField]))
}

export function getPlayableLanguageKeys(languages = {}) {
  return LANGUAGE_OPTIONS
    .map(({ key }) => key)
    .filter((key) => languageHasVideo(languages?.[key]))
}

export function getPlayableLanguages(languages = {}) {
  return Object.fromEntries(
    getPlayableLanguageKeys(languages).map((key) => [key, languages[key]])
  )
}

export function getFirstAvailableProvider(languageData) {
  return VIDEO_PROVIDERS.find(({ idField }) => hasVideoId(languageData?.[idField]))?.key
}
