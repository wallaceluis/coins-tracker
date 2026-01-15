<template>
  <div :class="darkMode ? 'bg-slate-950 text-white selection:bg-indigo-500/30' : 'bg-slate-50 text-slate-900 selection:bg-blue-500/30'" 
       class="min-h-screen transition-colors duration-500 font-sans relative overflow-hidden">
    
    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
           :class="darkMode ? 'bg-indigo-600' : 'bg-blue-300'"></div>
      <div class="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"
           :class="darkMode ? 'bg-cyan-600' : 'bg-purple-300'"></div>
      <div class="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"
           :class="darkMode ? 'bg-pink-600' : 'bg-pink-300'"></div>
    </div>

    <div class="relative z-10 max-w-3xl mx-auto px-4 py-8 flex flex-col min-h-screen">
      
      <TheHeader 
        :darkMode="darkMode"
        :selectedLanguage="currentLanguage"
        :languages="languages"
        @toggleDarkMode="toggleDarkMode"
        @update:selectedLanguage="setLanguage"
      />

      <CryptoSelector 
        v-model="selectedCryptoId"
        :topCryptos="topCryptos"
        :selectedSymbol="selectedCryptoData?.symbol"
        :darkMode="darkMode"
        :fiatCurrencies="fiatCurrencies"
        :selectedFiat="selectedFiat"
        @update:selectedFiat="selectedFiat = $event"
      />

      <main class="flex-grow">
        <div v-if="selectedCryptoData" class="space-y-6">
          
          <CryptoCard 
            :crypto="selectedCryptoData"
            :darkMode="darkMode"
            :selectedFiat="selectedFiat"
            :convertValue="convertValue"
          />

          <CryptoConverter 
            v-if="selectedCryptoData.priceUsd"
            :darkMode="darkMode"
            v-model="inputFiat"
            :selectedFiat="selectedFiat"
            :cryptoSymbol="selectedCryptoData.symbol"
            :cryptoPriceUsd="selectedCryptoData.priceUsd"
            :convertValue="convertValue"
          />

        </div>

        <div v-else class="flex flex-col justify-center items-center py-32 opacity-50">
           <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
           <p>{{ $t('loading') }}</p>
        </div>
      </main>
      
      <footer class="mt-12 text-center pb-8">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium opacity-40 hover:opacity-100 transition-opacity"
             :class="darkMode ? 'bg-slate-900' : 'bg-slate-100'">
          <span>{{ $t('footer.poweredBy') }}</span>
          <span>•</span>
          <span>{{ $t('footer.updated') }}</span>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCrypto } from '@/composables/useCrypto'
import { useCurrency } from '@/composables/useCurrency'
import { useTheme } from '@/composables/useTheme'
import { useLanguage } from '@/composables/useLanguage'

import TheHeader from '@/components/TheHeader.vue'
import CryptoSelector from '@/components/CryptoSelector.vue'
import CryptoCard from '@/components/CryptoCard.vue'
import CryptoConverter from '@/components/CryptoConverter.vue'

const { darkMode, toggleDarkMode } = useTheme()
const { selectedCryptoId, selectedCryptoData, topCryptos, getTopCryptos, getCryptoData } = useCrypto()
const { selectedFiat, fiatCurrencies, getExchangeRates, convertValue } = useCurrency()
const { currentLanguage, languages, setLanguage } = useLanguage()

const inputFiat = ref<number | null>(null)

onMounted(async () => {
  await Promise.all([
    getExchangeRates(),
    getTopCryptos(),
    getCryptoData()
  ])
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
</style>
