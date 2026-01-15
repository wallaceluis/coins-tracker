import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

export function useLanguage() {
    const { locale } = useI18n()

    const currentLanguage = computed({
        get: () => locale.value,
        set: (val) => {
            locale.value = val
        }
    })
    const languages = [
        { code: 'pt', name: 'Português', flag: '🇧🇷' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Español', flag: '🇪🇸' }
    ]

    const setLanguage = (lang: string) => {
        if (languages.some(l => l.code === lang)) {
            locale.value = lang
        }
    }

    return {
        currentLanguage,
        languages,
        setLanguage
    }
}
