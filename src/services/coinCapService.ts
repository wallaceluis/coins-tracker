import axios from 'axios'

const API_KEY = import.meta.env.VITE_COINCAP_API_KEY
const BASE_URL = 'https://rest.coincap.io/v3'

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        Authorization: `Bearer ${API_KEY}`
    }
})

export const fetchTopCryptos = async (limit = 20) => {
    const response = await api.get(`/assets?limit=${limit}`)
    return response.data.data
}

export const fetchCryptoData = async (id: string) => {
    const response = await api.get(`/assets/${id}`)
    return response.data.data
}
