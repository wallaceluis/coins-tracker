<template>
  <div class="relative group">
    <div class="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 via-emerald-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
    
    <div class="relative rounded-2xl p-6 sm:p-8 backdrop-blur-xl border shadow-2xl transition-all duration-300"
        :class="darkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/90 border-slate-200'">
      
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6">
          <div class="flex items-center gap-4">
            <img 
              :src="`https://assets.coincap.io/assets/icons/${crypto.symbol.toLowerCase()}@2x.png`" 
              @error="(e) => (e.target as HTMLElement).style.display = 'none'"
              class="w-16 h-16 rounded-full bg-white shadow-md p-0.5" 
              alt="Coin Icon" 
            />
            <div>
              <h2 class="text-4xl font-extrabold tracking-tight leading-none mb-1">{{ crypto.name }}</h2>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold px-2 py-0.5 rounded-md uppercase tracking-wide bg-indigo-500/10 text-indigo-500">
                  {{ crypto.symbol }}
                </span>
                <div :class="Number(crypto.changePercent24Hr) >= 0 ? 'text-emerald-500' : 'text-rose-500'" 
                      class="flex items-center text-sm font-bold">
                  <ArrowTrendingUpIcon v-if="Number(crypto.changePercent24Hr) >= 0" class="w-4 h-4 mr-0.5" />
                  <ArrowTrendingDownIcon v-else class="w-4 h-4 mr-0.5" />
                  {{ formatPercent(crypto.changePercent24Hr) }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="text-left sm:text-right">
            <div class="text-4xl font-bold tabular-nums tracking-tight">
              {{ formatFiat(convertValue(crypto.priceUsd), selectedFiat) }}
            </div>
            <div v-if="selectedFiat !== 'USD'" class="text-sm font-medium opacity-50 tracking-wide mt-1">
              {{ formatCurrency(crypto.priceUsd, 'USD') }}
            </div>
          </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
          <div class="p-4 rounded-xl border transition-colors duration-200"
              :class="darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'">
            <p class="text-xs uppercase tracking-wider opacity-60 mb-1">{{ $t('card.marketCap') }} ({{ selectedFiat }})</p>
            <p class="text-lg font-bold tabular-nums">
                {{ formatCompact(convertValue(crypto.marketCapUsd), selectedFiat) }}
            </p>
            <p v-if="selectedFiat !== 'USD'" class="text-xs opacity-40 mt-0.5">
                {{ formatCompact(crypto.marketCapUsd, 'USD') }} (USD)
            </p>
          </div>

          <div class="p-4 rounded-xl border transition-colors duration-200"
              :class="darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'">
            <p class="text-xs uppercase tracking-wider opacity-60 mb-1">{{ $t('card.volume24h') }} ({{ selectedFiat }})</p>
            <p class="text-lg font-bold tabular-nums">
                {{ formatCompact(convertValue(crypto.volumeUsd24Hr), selectedFiat) }}
            </p>
            <p v-if="selectedFiat !== 'USD'" class="text-xs opacity-40 mt-0.5">
                {{ formatCompact(crypto.volumeUsd24Hr, 'USD') }} (USD)
            </p>
          </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/vue/24/solid'
import { formatCurrency, formatPercent, formatFiat, formatCompact } from '@/utils/formatters'

defineProps<{
  crypto: any
  darkMode: boolean
  selectedFiat: string
  convertValue: (val: string | number) => number
}>()
</script>
