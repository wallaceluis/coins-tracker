import { onScopeDispose, ref, watch, type Ref } from 'vue'
import { fetchCryptoHistory } from '@/services/coinGecko'
import type { PeriodDays } from '@/types/asset'
import type { FiatCode } from '@/types/market'

/**
 * Série da moeda selecionada no período escolhido. Em 7 dias usa o sparkline que já
 * veio na lista (prices fica null); nos demais busca /api/crypto-history e guarda em memória.
 */
export function useCryptoHistory(id: Ref<string>, currency: Ref<FiatCode>, days: Ref<PeriodDays>) {
  const prices = ref<number[] | null>(null)
  const loading = ref(false)
  const cache = new Map<string, number[]>()
  let controller: AbortController | null = null

  async function load() {
    controller?.abort()
    if (days.value === 7 || !id.value) {
      prices.value = null
      loading.value = false
      return
    }
    const key = `${id.value}:${currency.value}:${days.value}`
    const cached = cache.get(key)
    if (cached) {
      prices.value = cached
      return
    }
    controller = new AbortController()
    loading.value = true
    try {
      const result = await fetchCryptoHistory(
        id.value,
        currency.value,
        days.value,
        controller.signal,
      )
      cache.set(key, result)
      prices.value = result
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      // sem a série longa, o gráfico volta para os 7 dias da lista
      prices.value = null
    } finally {
      loading.value = false
    }
  }

  watch([id, currency, days], load, { immediate: true })
  onScopeDispose(() => controller?.abort())

  return { prices, loading }
}
