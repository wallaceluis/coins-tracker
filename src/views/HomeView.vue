<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { useMarket } from '@/composables/useMarket'
import { useTheme } from '@/composables/useTheme'
import TheHeader from '@/components/TheHeader.vue'
import MarketList from '@/components/MarketList.vue'
import CoinDetail from '@/components/CoinDetail.vue'
import CryptoConverter from '@/components/CryptoConverter.vue'

const { t, locale } = useI18n()
const { isDark, toggleTheme } = useTheme()
const { coins, selected, selectedId, currency, loading, error, lastUpdated, refresh } = useMarket()

const updatedLabel = computed(() =>
  lastUpdated.value
    ? t('updated', {
        time: lastUpdated.value.toLocaleTimeString(locale.value, {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    : '',
)
const errorMessage = computed(() =>
  error.value === 'rate_limited' ? t('errRate') : t('errGeneric'),
)

onMounted(refresh)

// No mobile a lista fica abaixo do detalhe: ao escolher uma moeda, volta ao topo para mostrá-la
watch(selectedId, () => {
  if (window.matchMedia('(max-width: 1023px)').matches)
    window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<template>
  <div class="min-h-screen">
    <div class="backdrop" aria-hidden="true" />

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <TheHeader v-model:currency="currency" :is-dark="isDark" @toggle-theme="toggleTheme()" />

      <div
        v-if="error"
        role="alert"
        class="panel p-4 flex flex-wrap items-center gap-3 border-down/30"
      >
        <ExclamationTriangleIcon class="w-5 h-5 text-down shrink-0" />
        <div class="flex-1 min-w-0 text-sm">
          <p class="font-semibold">{{ t('errTitle') }}</p>
          <p class="text-muted">
            {{ errorMessage }}<template v-if="coins.length"> · {{ t('stale') }}</template>
          </p>
        </div>
        <button type="button" class="btn" @click="refresh">{{ t('retry') }}</button>
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        <div class="space-y-6 min-w-0">
          <template v-if="selected">
            <CoinDetail :coin="selected" :currency="currency" />
            <CryptoConverter :coin="selected" :currency="currency" />
          </template>
          <div v-else-if="loading" class="panel p-6 space-y-4" :aria-label="t('loading')">
            <div class="flex items-center gap-3">
              <div class="skeleton w-12 h-12 rounded-full" />
              <div class="space-y-2">
                <div class="skeleton h-5 w-40" />
                <div class="skeleton h-3 w-24" />
              </div>
            </div>
            <div class="skeleton h-56 w-full" />
          </div>
        </div>

        <div class="lg:sticky lg:top-6">
          <MarketList
            v-model:selected-id="selectedId"
            :coins="coins"
            :currency="currency"
            :loading="loading"
          />
        </div>
      </div>

      <footer
        class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted pt-2"
      >
        <a
          href="https://www.coingecko.com"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:underline"
        >
          {{ t('poweredBy') }}
        </a>
        <span aria-hidden="true">·</span>
        <span>{{ t('autoRefresh') }}</span>
        <template v-if="updatedLabel">
          <span aria-hidden="true">·</span>
          <span class="inline-flex items-center gap-1">
            <ArrowPathIcon class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
            {{ updatedLabel }}
          </span>
        </template>
      </footer>
    </div>
  </div>
</template>
