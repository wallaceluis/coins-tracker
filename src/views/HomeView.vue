<template>
  <div :class="darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'" class="min-h-screen transition-colors duration-500">
    <div class="max-w-4xl mx-auto px-4 py-8">
      
      <!-- Header com Logo -->
      <div class="flex justify-between items-center mb-8">
        <div class="flex items-center gap-4">
          <img :src="logo" alt="Logo Coins Tracker" class="w-12 h-12 rounded-full shadow-lg" />
          <h1 class="text-4xl font-extrabold">Coins Tracker</h1>
        </div>
        <button @click="toggleDarkMode"
                class="px-4 py-2 rounded-full font-semibold shadow transition duration-300"
                :class="darkMode ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'">
          {{ darkMode ? 'Modo Claro' : 'Modo Escuro' }}
        </button>
      </div>

      <!-- Cripto Card -->
      <div
        v-if="selectedCryptoData"
        class="rounded-xl border-4 p-6 mb-8 transition-all duration-300 shadow-2xl"
        :class="darkMode ? 'bg-gray-800 border-yellow-500 text-white' : 'bg-yellow-300 border-yellow-600 text-gray-900'"
      >
        <div class="text-center">
          <h2 class="text-2xl font-extrabold mb-4">🔥 Destaque: {{ selectedCryptoData.name }}</h2>
          <p><strong>Nome:</strong> {{ selectedCryptoData.name }}</p>
          <p><strong>Símbolo:</strong> {{ selectedCryptoData.symbol.toUpperCase() }}</p>
          <p><strong>Preço (USD):</strong> {{ formatCurrency(selectedCryptoData.priceUsd, 'USD') }}</p>
          <p><strong>Preço (BRL):</strong> {{ convertedBRL }}</p>
          <p>
            <strong>Variação 24h:</strong>
            <span :class="Number(selectedCryptoData.changePercent24Hr) >= 0 ? 'text-green-600' : 'text-red-500'" class="inline-flex items-center gap-1">
              <ArrowTrendingUpIcon v-if="Number(selectedCryptoData.changePercent24Hr) >= 0" class="w-5 h-5" />
              <ArrowTrendingDownIcon v-else class="w-5 h-5" />
              {{ formatPercent(selectedCryptoData.changePercent24Hr) }}
            </span>
        </p>
        </div>
      </div>

      <p v-else class="text-center text-white">Carregando dados da criptomoeda...</p>

      <!-- Selecionar Criptomoeda -->
      <div
        class="rounded-2xl p-6 shadow-xl transition-all duration-300"
        :class="darkMode ? 'bg-gray-700 border border-yellow-500' : 'bg-white border border-yellow-400'"
      >
      <h2 :class="darkMode ? 'text-2xl font-semibold text-center mb-6 text-white' : 'text-2xl font-semibold text-center mb-6 text-gray-900'">💰 Escolha uma Criptomoeda</h2>
        <select
          v-model="selectedCryptoId"
          @change="fetchCryptoData"
          class="w-full p-3 rounded-lg border outline-none transition bg-gray-100 dark:bg-gray-800 dark:text-white"
        >
          <option v-for="crypto in topCryptos" :key="crypto.id" :value="crypto.id">
            {{ crypto.name }} ({{ crypto.symbol.toUpperCase() }})
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import logo from '../images/logo-coins-tracker.png'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/vue/24/solid'


const darkMode = ref(false)
const selectedCryptoId = ref('bitcoin')
const selectedCryptoData = ref<any>(null)
const topCryptos = ref<any[]>([])
const usdToBrl = ref(0)

const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
}

const formatCurrency = (valor: number | string, currency: string = 'BRL') => {
  return Number(valor).toLocaleString("pt-BR", {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const formatPercent = (valor: number | string) => {
  const n = Number(valor)
  return `${n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

const fetchTopCryptos = async () => {
  try {
    const res = await axios.get('https://rest.coincap.io/v3/assets?limit=10', {
      headers: {
        Authorization: 'Bearer 208315cb3e927adc5f2d32fc4f841961978dbe3941148f1f91d31a486ca79947'
      }
    })
    topCryptos.value = res.data.data
  } catch (err) {
    console.error('Erro ao buscar top criptos:', err)
  }
}

const fetchCryptoData = async () => {
  try {
    const res = await axios.get(`https://rest.coincap.io/v3/assets/${selectedCryptoId.value}`, {
      headers: {
        Authorization: 'Bearer 208315cb3e927adc5f2d32fc4f841961978dbe3941148f1f91d31a486ca79947'
      }
    })
    selectedCryptoData.value = res.data.data
  } catch (err) {
    console.error('Erro ao buscar cripto:', err)
  }
}

const fetchUsdToBrl = async () => {
  try {
    const res = await axios.get('https://api.exchangerate.host/live', {
      params: {
        access_key: 'aec2ed068566e047ba938aff64cdcb57',
        source: 'USD',
        currencies: 'BRL'
      }
    })

    const rate = res.data?.quotes?.USDBRL
    if (rate) {
      usdToBrl.value = Number(rate)
      console.log('USD > BRL:', usdToBrl.value)
    } else {
      console.error('Taxa USDBRL não encontrada na resposta:', res.data)
    }
  } catch (err) {
    console.error('Erro ao buscar USD para BRL:', err)
  }
}


const convertedBRL = computed(() => {
  if (!selectedCryptoData.value || !selectedCryptoData.value.priceUsd || !usdToBrl.value) {
    return 'Carregando...'
  }

  const priceUsd = Number(selectedCryptoData.value.priceUsd)
  const valorBRL = priceUsd * usdToBrl.value

  if (isNaN(valorBRL) || valorBRL <= 0) {
    return 'Erro ao calcular'
  }

  return formatCurrency(valorBRL, 'BRL')
})

watch(selectedCryptoId, fetchCryptoData)

onMounted(async () => {
  await fetchUsdToBrl()
  await fetchTopCryptos()
  await fetchCryptoData()
})
</script>
