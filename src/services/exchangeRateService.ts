import axios from 'axios'

const API_KEY = import.meta.env.VITE_EXCHANGERATE_API_KEY
const BASE_URL = 'https://api.exchangerate.host'

export const fetchExchangeRates = async (currencies: string[]) => {
    if (!API_KEY) {
        console.warn('VITE_EXCHANGERATE_API_KEY not configured')
    }

    const response = await axios.get(`${BASE_URL}/live`, {
        params: {
            access_key: API_KEY,
            source: 'USD',
            currencies: currencies.join(',')
        }
    })

    return response.data?.quotes || {}
}
