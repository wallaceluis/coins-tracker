<template>
  <header class="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
    <div class="flex items-center gap-3">
      <div class="relative">
        <div class="absolute inset-0 bg-gradient-to-tr rounded-full blur-md opacity-60" 
        :class="darkMode ? 'from-indigo-500 to-purple-500' : 'from-purple-600 to-purple-600'"></div>
        <img :src="logo" alt="Logo Coins Tracker" class="relative w-10 h-10 rounded-full ring-2 ring-white/20 shadow-xl"
        :class="darkMode ? 'bg-transparent' : 'bg-black/60'" />
      </div>
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r"
            :class="darkMode ? 'from-white to-slate-400' : 'from-slate-900 to-slate-600'">
          Coins Tracker
        </h1>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div class="relative group">
        <select 
          :value="selectedFiat"
          @input="$emit('update:selectedFiat', ($event.target as HTMLSelectElement).value)"
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

      <button @click="$emit('toggleDarkMode')"
              class="p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              :class="darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm'">
        <SunIcon v-if="!darkMode" class="w-5 h-5" />
        <MoonIcon v-else class="w-5 h-5" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import logo from '@/assets/images/logo-coins-tracker.png'
import { SunIcon, MoonIcon, ChevronDownIcon } from '@heroicons/vue/24/solid'

defineProps<{
  darkMode: boolean
  selectedFiat: string
  fiatCurrencies: Array<{ code: string; name: string }>
}>()

defineEmits<{
  (e: 'toggleDarkMode'): void
  (e: 'update:selectedFiat', value: string): void
}>()
</script>
