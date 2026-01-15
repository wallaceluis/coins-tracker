import { ref, watch } from 'vue'
import { fetchCryptoData, fetchTopCryptos } from '@/services/coinCapService'

export function useCrypto() {
    const selectedCryptoId = ref('bitcoin')
    const selectedCryptoData = ref<any>(null)
    const topCryptos = ref<any[]>([])

    const getTopCryptos = async () => {
        try {
            topCryptos.value = await fetchTopCryptos()
        } catch (err) {
            console.error(err)
        }
    }

    const getCryptoData = async () => {
        try {
            selectedCryptoData.value = await fetchCryptoData(selectedCryptoId.value)
        } catch (err) {
            console.error(err)
        }
    }

    watch(selectedCryptoId, getCryptoData)

    return {
        selectedCryptoId,
        selectedCryptoData,
        topCryptos,
        getTopCryptos,
        getCryptoData
    }
}
