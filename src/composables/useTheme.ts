import { ref } from 'vue'

export function useTheme() {
    const darkMode = ref(true)

    const toggleDarkMode = () => {
        darkMode.value = !darkMode.value
    }

    return {
        darkMode,
        toggleDarkMode
    }
}
