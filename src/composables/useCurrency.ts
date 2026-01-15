import { ref } from 'vue'
import { fetchExchangeRates } from '@/services/exchangeRateService'

export function useCurrency() {
    const selectedFiat = ref('BRL')
    const fiatRates = ref<Record<string, number>>({ 'USD': 1 })
    const fiatCurrencies = [
        { code: 'BRL', name: 'Real Brasileiro' },
        { code: 'USD', name: 'Dólar Americano' },
        { code: 'EUR', name: 'Euro' },
        { code: 'GBP', name: 'Libra Esterlina' },
        { code: 'JPY', name: 'Iene Japonês' },
    ]

    const getExchangeRates = async () => {
        const currencies = fiatCurrencies.map(c => c.code)
        try {
            const rates = await fetchExchangeRates(currencies)
            Object.keys(rates).forEach(key => {
                const code = key.replace('USD', '')
                fiatRates.value[code] = rates[key]
            })
        } catch (err) {
            console.error(err)
            fiatRates.value = {
                'USD': 1,
                'BRL': 6.05,
                'EUR': 0.95,
                'GBP': 0.79,
                'JPY': 150.0
            }
        }
    }

    const convertValue = (usdValue: string | number) => {
        if (!usdValue) return 0
        const rate = fiatRates.value[selectedFiat.value] || 1
        return Number(usdValue) * rate
    }

    return {
        selectedFiat,
        fiatRates,
        fiatCurrencies,
        getExchangeRates,
        convertValue
    }
}
