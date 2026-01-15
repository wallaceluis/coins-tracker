<template>
  <div :class="darkMode ? 'bg-slate-950 text-white selection:bg-indigo-500/30' : 'bg-slate-50 text-slate-900 selection:bg-blue-500/30'" class="min-h-screen transition-colors duration-500 font-sans relative overflow-hidden">
    
    <!-- Background Gradients -->
    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
           :class="darkMode ? 'bg-indigo-600' : 'bg-blue-300'"></div>
      <div class="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"
           :class="darkMode ? 'bg-cyan-600' : 'bg-purple-300'"></div>
      <div class="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"
           :class="darkMode ? 'bg-pink-600' : 'bg-pink-300'"></div>
    </div>

    <div class="relative z-10 max-w-3xl mx-auto px-4 py-8 flex flex-col min-h-screen">
      
      <!-- Top Header -->
      <header class="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-md opacity-60"></div>
            <img :src="logo" alt="Logo Coins Tracker" class="relative w-10 h-10 rounded-full ring-2 ring-white/20 shadow-xl" />
          </div>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r"
                :class="darkMode ? 'from-white to-slate-400' : 'from-slate-900 to-slate-600'">
              Coins Tracker
            </h1>
          </div>
        </div>

        <!-- Controls (Dark Mode + Global Currency) -->
        <div class="flex items-center gap-3">
           
           <!-- Moeda Global -->
           <div class="relative group">
              <select 
                v-model="selectedFiat"
                class="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-sm font-bold cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                :class="darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'"
              >
                <option v-for="currency in fiatCurrencies" :key="currency.code" :value="currency.code">
                   {{ currency.code }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none opacity-50">
                <ChevronDownIcon class="w-3 h-3" />
              </div>
           </div>

           <!-- Dark Mode Toggle -->
           <button @click="toggleDarkMode"
                  class="p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  :class="darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm'">
            <SunIcon v-if="!darkMode" class="w-5 h-5" />
            <MoonIcon v-else class="w-5 h-5" />
          </button>
        </div>
      </header>


      <!-- Select Crypto (Main Action - Top) -->
      <div class="mb-8 relative z-20">
         <label class="block text-xs font-bold uppercase tracking-wider mb-2 opacity-60 ml-1">Selecionar Criptomoeda</label>
         <div class="relative group">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <select
              v-model="selectedCryptoId"
              @change="fetchCryptoData"
              class="relative w-full appearance-none p-4 pl-12 rounded-xl text-lg font-bold outline-none cursor-pointer transition-all shadow-lg"
              :class="darkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900 border border-slate-200'"
            >
              <option v-for="crypto in topCryptos" :key="crypto.id" :value="crypto.id">
                {{ crypto.name }} ({{ crypto.symbol.toUpperCase() }})
              </option>
            </select>
            <!-- Logo overlay in select -->
            <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
               <img v-if="selectedCryptoData" :src="getCryptoIcon(selectedCryptoData.symbol)" class="w-6 h-6 rounded-full" />
               <div v-else class="w-6 h-6 rounded-full bg-slate-500/20"></div>
            </div>
            <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
              <ChevronDownIcon class="w-5 h-5" />
            </div>
         </div>
      </div>

      <!-- Main Content -->
      <main class="flex-grow">
        
        <div v-if="selectedCryptoData" class="space-y-6">

          <!-- Crypto Info Card -->
          <div class="relative group">
            <div class="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 via-emerald-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            
            <div class="relative rounded-2xl p-6 sm:p-8 backdrop-blur-xl border shadow-2xl transition-all duration-300"
                :class="darkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/90 border-slate-200'">
              
              <!-- Title & Price Block -->
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6">
                 
                 <!-- Coin ID -->
                 <div class="flex items-center gap-4">
                    <img 
                      :src="getCryptoIcon(selectedCryptoData.symbol)" 
                      @error="handleImageError"
                      class="w-16 h-16 rounded-full bg-white shadow-md p-0.5" 
                      alt="Coin Icon" 
                    />
                    <div>
                      <h2 class="text-4xl font-extrabold tracking-tight leading-none mb-1">{{ selectedCryptoData.name }}</h2>
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-bold px-2 py-0.5 rounded-md uppercase tracking-wide bg-indigo-500/10 text-indigo-500">
                          {{ selectedCryptoData.symbol }}
                        </span>
                        <div :class="Number(selectedCryptoData.changePercent24Hr) >= 0 ? 'text-emerald-500' : 'text-rose-500'" 
                             class="flex items-center text-sm font-bold">
                          <ArrowTrendingUpIcon v-if="Number(selectedCryptoData.changePercent24Hr) >= 0" class="w-4 h-4 mr-0.5" />
                          <ArrowTrendingDownIcon v-else class="w-4 h-4 mr-0.5" />
                          {{ formatPercent(selectedCryptoData.changePercent24Hr) }}
                        </div>
                      </div>
                    </div>
                 </div>
                 
                 <!-- Price Display -->
                 <div class="text-left sm:text-right">
                   <div class="text-4xl font-bold tabular-nums tracking-tight">
                      {{ formatFiat(convertValue(selectedCryptoData.priceUsd)) }}
                   </div>
                   <!-- Secondary Price (USD) -->
                   <div v-if="selectedFiat !== 'USD'" class="text-sm font-medium opacity-50 tracking-wide mt-1">
                      {{ formatCurrency(selectedCryptoData.priceUsd, 'USD') }}
                   </div>
                 </div>
              </div>

              <!-- Metrics Grid -->
              <div class="grid grid-cols-2 gap-4">
                 <!-- Market Cap -->
                 <div class="p-4 rounded-xl border transition-colors duration-200"
                      :class="darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'">
                    <p class="text-xs uppercase tracking-wider opacity-60 mb-1">Market Cap ({{ selectedFiat }})</p>
                    <p class="text-lg font-bold tabular-nums">
                       {{ formatCompactFiat(convertValue(selectedCryptoData.marketCapUsd)) }}
                    </p>
                    <p v-if="selectedFiat !== 'USD'" class="text-xs opacity-40 mt-0.5">
                       {{ formatCompactCurrency(selectedCryptoData.marketCapUsd) }} (USD)
                    </p>
                 </div>

                 <!-- Volume -->
                 <div class="p-4 rounded-xl border transition-colors duration-200"
                      :class="darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'">
                    <p class="text-xs uppercase tracking-wider opacity-60 mb-1">Volume 24h ({{ selectedFiat }})</p>
                    <p class="text-lg font-bold tabular-nums">
                       {{ formatCompactFiat(convertValue(selectedCryptoData.volumeUsd24Hr)) }}
                    </p>
                    <p v-if="selectedFiat !== 'USD'" class="text-xs opacity-40 mt-0.5">
                       {{ formatCompactCurrency(selectedCryptoData.volumeUsd24Hr) }} (USD)
                    </p>
                 </div>
              </div>

            </div>
          </div>

          <!-- Converter Tool -->
          <div class="relative group">
              <div class="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div class="relative rounded-2xl p-6 backdrop-blur-xl border shadow-lg transition-all duration-300"
                 :class="darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-slate-200'">
                  
                  <div class="flex items-center gap-2 mb-6">
                      <div class="p-2 rounded-lg" :class="darkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-100 text-teal-600'">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                        </svg>
                      </div>
                      <h3 class="text-lg font-bold">Conversor Rápido</h3>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                      
                      <!-- Input Fiat (Left Side) -->
                      <div class="relative">
                          <div class="flex justify-between mb-1.5 ml-1">
                             <label class="text-xs font-bold uppercase opacity-60">Você paga</label>
                             <span class="text-xs font-bold text-teal-500">{{ selectedFiat }}</span>
                          </div>
                          
                          <div class="relative group/input">
                              <input 
                                  type="number" 
                                  v-model.number="inputFiat" 
                                  placeholder="0.00"
                                  class="w-full p-4 rounded-xl border outline-none font-bold text-xl transition-all focus:ring-2 focus:ring-teal-500/50"
                                  :class="darkMode ? 'bg-slate-800 border-slate-700 focus:border-teal-500' : 'bg-slate-50 border-slate-200 focus:border-teal-500'"
                              />
                              <!-- Small Currency Badge inside input -->
                              <div class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded bg-black/5 dark:bg-white/10 opacity-50">
                                {{ selectedFiat }}
                              </div>
                          </div>
                      </div>

                      <!-- Separator Icon -->
                      <div class="hidden md:flex justify-center pt-6 opacity-30">
                          <ArrowRightIcon class="w-6 h-6" />
                      </div>

                      <!-- Output Crypto (Right Side) -->
                      <div class="relative">
                          <div class="flex justify-between mb-1.5 ml-1">
                             <label class="text-xs font-bold uppercase opacity-60">Você recebe</label>
                             <span class="text-xs font-bold text-indigo-500">{{ selectedCryptoData.symbol }}</span>
                          </div>
                          <div class="relative">
                             <div class="w-full p-4 rounded-xl border font-bold text-xl truncate flex items-center justify-between"
                                  :class="darkMode ? 'bg-slate-800/50 border-slate-700 text-teal-400' : 'bg-slate-100 border-slate-200 text-teal-600'">
                                  <span>{{ conversionResult }}</span>
                                  <span class="text-sm opacity-50 ml-2 font-normal text-current">{{ selectedCryptoData.symbol }}</span>
                             </div>
                          </div>
                      </div>
                  </div>
                  
                  <p class="text-center text-xs opacity-40 mt-4">
                    1 {{ selectedCryptoData.symbol }} ≈ {{ formatFiat(convertValue(selectedCryptoData.priceUsd)) }}
                  </p>
              </div>
          </div>

        </div>

        <!-- Loading State -->
        <div v-else class="flex flex-col justify-center items-center py-32 opacity-50">
           <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
           <p>Carregando dados do mercado...</p>
        </div>

      </main>
      
      <!-- Footer -->
      <footer class="mt-12 text-center pb-8">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium opacity-40 hover:opacity-100 transition-opacity"
             :class="darkMode ? 'bg-slate-900' : 'bg-slate-100'">
          <span>Powered by CoinCap API</span>
          <span>•</span>
          <span>Atualizado em tempo real</span>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import logo from '../images/logo-coins-tracker.png'
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  SunIcon, 
  MoonIcon,
  ChevronDownIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/solid'

// --- State ---
const darkMode = ref(true)
const apiKey = import.meta.env.VITE_COINCAP_API_KEY
const exchangeRateKey = import.meta.env.VITE_EXCHANGERATE_API_KEY

const selectedCryptoId = ref('bitcoin')
const selectedCryptoData = ref<any>(null)
const topCryptos = ref<any[]>([])

// Currency State
const selectedFiat = ref('BRL')
const fiatRates = ref<Record<string, number>>({ 'USD': 1 }) // Base USD
const inputFiat = ref<number | null>(null)

const fiatCurrencies = [
  { code: 'BRL', name: 'Real Brasileiro' },
  { code: 'USD', name: 'Dólar Americano' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'Libra Esterlina' },
  { code: 'JPY', name: 'Iene Japonês' },
]

// --- Actions ---

const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
}

const getCryptoIcon = (symbol: string) => {
  if (!symbol) return ''
  return `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`
}

const handleImageError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = 'none';
}

// Fetch Rates (USD Base -> Target)
const fetchExchangeRates = async () => {
  try {
    // API gratuita ExchangeRate-API (exchangerate-api.com) ou similar que tenha base USD
    // Fallback manual para demonstração caso a API falhe ou atinja limite
    // Vamos tentar usar exchangerate.host com fallback
    const currencies = fiatCurrencies.map(c => c.code).join(',')
    
    // Check if key exists
    if (!exchangeRateKey) {
       console.warn('VITE_EXCHANGERATE_API_KEY não configurada')
    }

    const res = await axios.get('https://api.exchangerate.host/live', {
        params: {
          access_key: exchangeRateKey,
          source: 'USD',
          currencies: currencies
        }
    })

    if (res.data?.quotes) {
        // A API retorna keys como "USDBRL", "USDEUR"
        Object.keys(res.data.quotes).forEach(key => {
            const code = key.replace('USD', '')
            fiatRates.value[code] = res.data.quotes[key]
        })
    } else {
        throw new Error('Formato inesperado')
    }

  } catch (err) {
    console.warn('Falha ao buscar taxas reais, usando taxas estimadas de fallback.')
    // Fallback values (estimativas para não quebrar a UI)
    fiatRates.value = {
        'USD': 1,
        'BRL': 6.05,
        'EUR': 0.95,
        'GBP': 0.79,
        'JPY': 150.0
    }
  }
}

// Converter Valor USD -> Fiat Selecionada
const convertValue = (usdValue: string | number) => {
    if (!usdValue) return 0
    const rate = fiatRates.value[selectedFiat.value] || 1
    return Number(usdValue) * rate
}

// --- Formatters ---

// Formata o valor já convertido na moeda selecionada
const formatFiat = (val: number) => {
    return val.toLocaleString(undefined, { // undefined usa locale do browser ou default
        style: 'currency',
        currency: selectedFiat.value,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
}

const formatCompactFiat = (val: number) => {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: selectedFiat.value,
        notation: "compact",
        maximumFractionDigits: 2
    }).format(val)
}

// Formata USD fixo (currency string pura)
const formatCurrency = (valor: number | string, currency: string) => {
  if (!valor) return '---'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor))
}

// Formatação compacta USD fixa
const formatCompactCurrency = (valor: number | string) => {
  if (!valor) return '---'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: "compact",
    maximumFractionDigits: 2
  }).format(Number(valor))
}

const formatPercent = (valor: number | string) => {
  if (!valor) return '0.00%'
  const n = Number(valor)
  return `${n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "never"
  })}%`
}

// --- Data Fetching ---

const fetchTopCryptos = async () => {
  try {
    const res = await axios.get('https://rest.coincap.io/v3/assets?limit=20', {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    topCryptos.value = res.data.data
  } catch (err) {
    console.error('Erro ao buscar top criptos:', err)
  }
}

const fetchCryptoData = async () => {
  try {
    const res = await axios.get(`https://rest.coincap.io/v3/assets/${selectedCryptoId.value}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    selectedCryptoData.value = res.data.data
  } catch (err) {
    console.error('Erro ao buscar cripto:', err)
  }
}

// --- Computeds ---

const conversionResult = computed(() => {
    if (!inputFiat.value || !selectedCryptoData.value) return '0.00000000';
    
    // Preço da Crypto em Moeda Fiat
    const cryptoPriceInUsd = Number(selectedCryptoData.value.priceUsd)
    const rate = fiatRates.value[selectedFiat.value] || 1
    const cryptoPriceInFiat = cryptoPriceInUsd * rate

    if (cryptoPriceInFiat <= 0) return '0.00000000';

    const result = inputFiat.value / cryptoPriceInFiat;
    return result.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
})

watch(selectedCryptoId, fetchCryptoData)

// Quando mudar a moeda fiat, não é necessário refetch, pois a conversão é client-side baseada nas rates já carregadas.
// Mas se quiséssemos atualizar rates periodicamente, faríamos aqui.

onMounted(async () => {
  await fetchExchangeRates()
  await fetchTopCryptos()
  await fetchCryptoData()
})
</script>

<style scoped>
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
</style>
