<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import type { Coin, FiatCode } from '@/types/market'
import { formatPrice } from '@/utils/formatters'
import ChangeBadge from './ChangeBadge.vue'
import SparkLine from './SparkLine.vue'

const props = defineProps<{ coins: Coin[]; currency: FiatCode; loading: boolean }>()
const selectedId = defineModel<string>('selectedId', { required: true })

const { t, locale } = useI18n()
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.coins
  return props.coins.filter(
    (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
  )
})
</script>

<template>
  <section class="panel flex flex-col min-h-0" :aria-label="t('market')">
    <div class="p-4 pb-3 border-b border-line">
      <div class="flex items-baseline justify-between mb-3">
        <h2 class="font-semibold">{{ t('market') }}</h2>
        <span class="text-xs text-muted">{{ t('marketHint') }}</span>
      </div>
      <label class="relative block">
        <span class="sr-only">{{ t('search') }}</span>
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          v-model="query"
          type="search"
          :placeholder="t('search')"
          class="field pl-9 py-2 text-sm"
        />
      </label>
    </div>

    <ul
      class="overflow-y-auto lg:max-h-[calc(100vh-14rem)] p-2"
      role="listbox"
      :aria-label="t('market')"
    >
      <template v-if="loading && !coins.length">
        <li v-for="n in 8" :key="n" class="flex items-center gap-3 p-3">
          <div class="skeleton w-8 h-8 rounded-full" />
          <div class="flex-1 space-y-1.5">
            <div class="skeleton h-3 w-24" />
            <div class="skeleton h-2.5 w-12" />
          </div>
          <div class="skeleton h-6 w-16" />
        </li>
      </template>

      <li v-for="coin in filtered" :key="coin.id">
        <button
          type="button"
          role="option"
          :aria-selected="coin.id === selectedId"
          class="row"
          :class="{ selected: coin.id === selectedId }"
          @click="selectedId = coin.id"
        >
          <span class="w-5 text-xs text-muted tabular-nums text-right">{{
            coin.market_cap_rank
          }}</span>
          <img
            :src="coin.image"
            :alt="''"
            width="32"
            height="32"
            loading="lazy"
            class="w-8 h-8 rounded-full"
          />
          <span class="flex-1 min-w-0 text-left">
            <span class="block font-medium truncate">{{ coin.name }}</span>
            <span class="block text-xs text-muted uppercase">{{ coin.symbol }}</span>
          </span>
          <span class="hidden sm:block w-16 h-7">
            <SparkLine
              :points="coin.sparkline_in_7d?.price ?? []"
              :width="64"
              :height="28"
              :max-points="28"
            />
          </span>
          <span class="text-right">
            <span class="block text-sm font-medium tabular-nums">
              {{ formatPrice(coin.current_price, currency, locale) }}
            </span>
            <ChangeBadge :value="coin.price_change_percentage_24h" />
          </span>
        </button>
      </li>

      <li
        v-if="!loading && coins.length && !filtered.length"
        class="p-6 text-center text-sm text-muted"
      >
        {{ t('noResults') }}
      </li>
    </ul>
  </section>
</template>
