import { computed, onScopeDispose, ref, watch } from 'vue'
import { useDocumentVisibility, useStorage } from '@vueuse/core'
import { fetchStocks } from '@/services/quotesApi'
import type { StockQuote } from '../../shared/stock'

/** Cotações da B3 têm atraso no plano grátis: atualizar a cada 5 min basta. */
export const STOCKS_REFRESH_MS = 5 * 60_000

export function useStocks(refreshMs = STOCKS_REFRESH_MS) {
  const quotes = ref<StockQuote[]>([])
  const selectedId = useStorage('ct:stock', 'PETR4')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)
  let controller: AbortController | null = null

  async function refresh() {
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    try {
      quotes.value = await fetchStocks(undefined, controller.signal)
      error.value = null
      lastUpdated.value = new Date()
      if (!quotes.value.some((q) => q.symbol === selectedId.value) && quotes.value[0]) {
        selectedId.value = quotes.value[0].symbol
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      error.value = (err as Error).message || 'request_failed'
    } finally {
      loading.value = false
    }
  }

  const selected = computed(() => quotes.value.find((q) => q.symbol === selectedId.value) ?? null)

  const visibility = useDocumentVisibility()
  let timer: ReturnType<typeof setInterval> | undefined
  const schedule = () => {
    clearInterval(timer)
    if (visibility.value === 'visible') timer = setInterval(refresh, refreshMs)
  }
  watch(visibility, schedule)
  schedule()
  onScopeDispose(() => {
    clearInterval(timer)
    controller?.abort()
  })

  return { quotes, selected, selectedId, loading, error, lastUpdated, refresh }
}
