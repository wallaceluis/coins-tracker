import { createI18n } from 'vue-i18n'
import pt from './locales/pt'
import en from './locales/en'
import es from './locales/es'

const i18n = createI18n({
    legacy: false, // Vue 3 Composition API mode
    globalInjection: true, // Inject $t into templates
    locale: 'pt', // default locale
    fallbackLocale: 'en',
    messages: {
        pt,
        en,
        es
    }
})

export default i18n
