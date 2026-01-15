<template>
  <div class="mb-8 relative z-20">
    <label class="block text-xs font-bold uppercase tracking-wider mb-2 opacity-60 ml-1">{{ $t('selector.label') }}</label>
    
    <div class="flex gap-4">
      <!-- Crypto Selector -->
      <div class="relative group flex-grow">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <select
          :value="modelValue"
          @input="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
          class="relative w-full appearance-none p-4 pl-12 rounded-xl text-lg font-bold outline-none cursor-pointer transition-all shadow-lg"
          :class="darkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900 border border-slate-200'"
        >
          <option v-for="crypto in topCryptos" :key="crypto.id" :value="crypto.id">
            {{ crypto.name }} ({{ crypto.symbol.toUpperCase() }})
          </option>
        </select>
        
        <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <img v-if="selectedSymbol" :src="`https://assets.coincap.io/assets/icons/${selectedSymbol.toLowerCase()}@2x.png`" 
               @error="(e) => (e.target as HTMLElement).style.display = 'none'"
               class="w-6 h-6 rounded-full" />
          <div v-else class="w-6 h-6 rounded-full bg-slate-500/20"></div>
        </div>
        <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
          <ChevronDownIcon class="w-5 h-5" />
        </div>
      </div>

      <!-- Currency Selector (Fiat) -->
      <div class="relative group w-32 shrink-0">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <select
          :value="selectedFiat"
          @input="$emit('update:selectedFiat', ($event.target as HTMLSelectElement).value)"
          class="relative w-full appearance-none p-4 rounded-xl text-lg font-bold outline-none cursor-pointer transition-all shadow-lg text-left"
          :class="darkMode ? 'bg-slate-900 text-white border border-slate-700' : 'bg-white text-slate-900 border border-slate-200'"
        >
          <option v-for="currency in fiatCurrencies" :key="currency.code" :value="currency.code">
            {{ currency.code }}
          </option>
        </select>
        <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
          <ChevronDownIcon class="w-4 h-4" />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/solid'

defineProps<{
  modelValue: string
  topCryptos: any[]
  selectedSymbol?: string
  darkMode: boolean
  selectedFiat: string
  fiatCurrencies: Array<{ code: string; name: string }>
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:selectedFiat', value: string): void
}>()
</script>
