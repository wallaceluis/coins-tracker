import { computed, onScopeDispose, ref, watch } from 'vue'
import { useDocumentVisibility, useStorage } from '@vueuse/core'
import { fetchMarkets } from '@/services/coinGecko'
import type { Coin, FiatCode } from '@/types/market'

export const REFRESH_MS = 60_000

/**
 * Estado do mercado: lista das top moedas na moeda escolhida, moeda selecionada
 * e atualização automática (pausa quando o separador não está visível).
 */
export function useMarket(refreshMs = REFRESH_MS) {
  const currency = useStorage<FiatCode>('ct:currency', 'BRL')
  const selectedId = useStorage('ct:selected', 'bitcoin')
  const coins = ref<Coin[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  let controller: AbortController | null = null

  async function refresh() {
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    try {
      coins.value = await fetchMarkets(currency.value, 20, controller.signal)
      error.value = null
      lastUpdated.value = new Date()
      if (!coins.value.some((c) => c.id === selectedId.value) && coins.value[0]) {
        selectedId.value = coins.value[0].id
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      // Mantém os últimos dados na tela; só sinaliza o erro
      error.value = (err as Error).message || 'request_failed'
    } finally {
      loading.value = false
    }
  }

  const selected = computed(() => coins.value.find((c) => c.id === selectedId.value) ?? null)

  watch(currency, refresh)

  const visibility = useDocumentVisibility()
  let timer: ReturnType<typeof setInterval> | undefined
  const schedule = () => {
    clearInterval(timer)
    if (visibility.value === 'visible') timer = setInterval(refresh, refreshMs)
  }
  watch(visibility, (v, prev) => {
    // Voltou ao separador com dados velhos: atualiza já
    if (v === 'visible' && prev === 'hidden') refresh()
    schedule()
  })
  schedule()

  onScopeDispose(() => {
    clearInterval(timer)
    controller?.abort()
  })

  return { coins, selected, selectedId, currency, loading, error, lastUpdated, refresh }
}
