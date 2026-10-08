import { useDark, useToggle } from '@vueuse/core'

/** Tema claro/escuro: segue o sistema na 1ª visita e persiste a escolha (classe .dark no <html>). */
export function useTheme() {
  const isDark = useDark({ storageKey: 'ct:theme' })
  const toggleTheme = useToggle(isDark)
  return { isDark, toggleTheme }
}
