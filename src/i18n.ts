import { createI18n } from 'vue-i18n'
import pt from './locales/pt'
import en from './locales/en'
import es from './locales/es'

export const LANGUAGES = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
] as const

const STORAGE_KEY = 'ct:lang'

function initialLocale() {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  if (saved && LANGUAGES.some((l) => l.code === saved)) return saved
  const browser = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'pt'
  return LANGUAGES.some((l) => l.code === browser) ? browser : 'pt'
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages: { pt, en, es },
})

export function setLocale(code: string) {
  i18n.global.locale.value = code as typeof i18n.global.locale.value
  localStorage.setItem(STORAGE_KEY, code)
  document.documentElement.lang = code === 'pt' ? 'pt-BR' : code
}

export default i18n
