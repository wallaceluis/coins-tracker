<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline'
import logo from '@/assets/images/logo-coins-tracker.png'
import { LANGUAGES, setLocale } from '@/i18n'
import { FIAT_CURRENCIES, type FiatCode } from '@/types/market'

defineProps<{ isDark: boolean }>()
const currency = defineModel<FiatCode>('currency', { required: true })
defineEmits<{ toggleTheme: [] }>()

const { t, locale } = useI18n()
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-3 w-full sm:w-auto">
      <img :src="logo" alt="" class="w-10 h-10 rounded-xl ring-1 ring-black/5 dark:ring-white/10" />
      <div class="leading-tight">
        <h1 class="text-xl font-bold tracking-tight">{{ t('title') }}</h1>
        <p class="text-xs text-muted">{{ t('subtitle') }}</p>
      </div>
      <!-- No mobile o botão de tema fica ao lado do logo para não sobrar sozinho numa linha -->
      <button
        type="button"
        class="icon-btn ml-auto sm:hidden"
        :aria-label="t('theme')"
        @click="$emit('toggleTheme')"
      >
        <SunIcon v-if="isDark" class="w-5 h-5" />
        <MoonIcon v-else class="w-5 h-5" />
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <div role="radiogroup" :aria-label="t('currency')" class="segmented">
        <button
          v-for="code in FIAT_CURRENCIES"
          :key="code"
          type="button"
          role="radio"
          :aria-checked="currency === code"
          :class="{ active: currency === code }"
          @click="currency = code"
        >
          {{ code }}
        </button>
      </div>

      <div role="radiogroup" :aria-label="t('language')" class="segmented">
        <button
          v-for="lang in LANGUAGES"
          :key="lang.code"
          type="button"
          role="radio"
          :aria-checked="locale === lang.code"
          :class="{ active: locale === lang.code }"
          @click="setLocale(lang.code)"
        >
          {{ lang.label }}
        </button>
      </div>

      <button
        type="button"
        class="icon-btn hidden sm:inline-flex"
        :aria-label="t('theme')"
        @click="$emit('toggleTheme')"
      >
        <SunIcon v-if="isDark" class="w-5 h-5" />
        <MoonIcon v-else class="w-5 h-5" />
      </button>
    </div>
  </header>
</template>
