import { computed, onScopeDispose, ref, watch } from 'vue'
import { useDocumentVisibility, useStorage } from '@vueuse/core'
import { fetchStocks } from '@/services/quotesApi'
import { DEFAULT_TICKERS, TICKER_PATTERN, type StockQuote } from '../../shared/stock'

/** Papéis que a pessoa pode somar aos padrões (a API aceita até 20 por chamada). */
export const MAX_EXTRA_TICKERS = 8

/** Cotações da B3 têm atraso no plano grátis: atualizar a cada 5 min basta. */
export const STOCKS_REFRESH_MS = 5 * 60_000

export function useStocks(refreshMs = STOCKS_REFRESH_MS) {
  const quotes = ref<StockQuote[]>([])
  const selectedId = useStorage('ct:stock', 'PETR4')
  /** Papéis adicionados pela busca, salvos no navegador */
  const extraTickers = useStorage<string[]>('ct:stocks:extra', [])
  /** Último papel adicionado que a brapi não encontrou */
  const notFound = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)
  let controller: AbortController | null = null

  async function refresh() {
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    try {
      const signal = controller.signal
      // Os padrões vêm numa chamada só e os extras um por chamada: assim cada URL
      // é igual para todo mundo e o cache da CDN serve todos os visitantes
      const [base, ...extras] = await Promise.allSettled([
        fetchStocks(undefined, signal),
        ...extraTickers.value.map((t) => fetchStocks([t], signal)),
      ])
      if (base!.status === 'rejected') throw base!.reason
      const found = extras.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      // Só descarta um papel se a brapi respondeu os padrões (não foi uma queda geral)
      const missing = base!.value.length
        ? extraTickers.value.filter(
            (t, i) => extras[i]!.status === 'fulfilled' && !found.some((q) => q.symbol === t),
          )
        : []
      if (missing.length) {
        notFound.value = missing[missing.length - 1]!
        extraTickers.value = extraTickers.value.filter((t) => !missing.includes(t))
      }
      quotes.value = [...base!.value, ...found]
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

  /** Soma um papel à lista; devolve false se for inválido, repetido ou passar do limite. */
  function addTicker(raw: string): boolean {
    const ticker = raw.trim().toUpperCase()
    const known = [...DEFAULT_TICKERS, ...extraTickers.value] as string[]
    if (!TICKER_PATTERN.test(ticker) || known.includes(ticker)) return false
    if (extraTickers.value.length >= MAX_EXTRA_TICKERS) return false
    notFound.value = null
    extraTickers.value = [...extraTickers.value, ticker]
    selectedId.value = ticker
    refresh()
    return true
  }

  function removeTicker(ticker: string) {
    extraTickers.value = extraTickers.value.filter((t) => t !== ticker)
    quotes.value = quotes.value.filter((q) => q.symbol !== ticker)
    if (selectedId.value === ticker && quotes.value[0]) selectedId.value = quotes.value[0].symbol
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

  return {
    quotes,
    selected,
    selectedId,
    loading,
    error,
    lastUpdated,
    refresh,
    extraTickers,
    notFound,
    addTicker,
    removeTicker,
  }
}
