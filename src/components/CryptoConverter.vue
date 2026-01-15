<template>
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
              <h3 class="text-lg font-bold">{{ $t('converter.title') }}</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              
              <div class="relative">
                  <div class="flex justify-between mb-1.5 ml-1">
                      <label class="text-xs font-bold uppercase opacity-60">{{ $t('converter.pay') }}</label>
                      <span class="text-xs font-bold text-teal-500">{{ selectedFiat }}</span>
                  </div>
                  
                  <div class="relative group/input">
                      <input 
                          type="number" 
                          :value="modelValue"
                          @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
                          placeholder="0.00"
                          class="w-full p-4 rounded-xl border outline-none font-bold text-xl transition-all focus:ring-2 focus:ring-teal-500/50"
                          :class="darkMode ? 'bg-slate-800 border-slate-700 focus:border-teal-500' : 'bg-slate-50 border-slate-200 focus:border-teal-500'"
                      />
                      <div class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded bg-black/5 dark:bg-white/10 opacity-50">
                        {{ selectedFiat }}
                      </div>
                  </div>
              </div>

              <div class="hidden md:flex justify-center pt-6 opacity-30">
                  <ArrowRightIcon class="w-6 h-6" />
              </div>

              <div class="relative">
                  <div class="flex justify-between mb-1.5 ml-1">
                      <label class="text-xs font-bold uppercase opacity-60">{{ $t('converter.receive') }}</label>
                      <span class="text-xs font-bold text-indigo-500">{{ cryptoSymbol }}</span>
                  </div>
                  <div class="relative">
                      <div class="w-full p-4 rounded-xl border font-bold text-xl truncate flex items-center justify-between"
                          :class="darkMode ? 'bg-slate-800/50 border-slate-700 text-teal-400' : 'bg-slate-100 border-slate-200 text-teal-600'">
                          <span>{{ conversionResult }}</span>
                          <span class="text-sm opacity-50 ml-2 font-normal text-current">{{ cryptoSymbol }}</span>
                      </div>
                  </div>
              </div>
          </div>
          
          <p class="text-center text-xs opacity-40 mt-4">
            1 {{ cryptoSymbol }} ≈ {{ oneCryptoInFiat }}
          </p>
      </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRightIcon } from '@heroicons/vue/24/solid'
import { formatFiat } from '@/utils/formatters'

const props = defineProps<{
  modelValue: number | null
  darkMode: boolean
  selectedFiat: string
  cryptoSymbol: string
  cryptoPriceUsd: string
  convertValue: (val: string | number) => number
}>()

defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const conversionResult = computed(() => {
    if (!props.modelValue || !props.cryptoPriceUsd) return '0.00000000'
    
    const cryptoPriceInFiat = props.convertValue(props.cryptoPriceUsd)

    if (cryptoPriceInFiat <= 0) return '0.00000000'

    const result = props.modelValue / cryptoPriceInFiat
    return result.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 })
})

const oneCryptoInFiat = computed(() => {
  return formatFiat(props.convertValue(props.cryptoPriceUsd), props.selectedFiat)
})
</script>

<style scoped>
/* Ocultar spinning button de input number */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
</style>
