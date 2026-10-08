<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Coin, FiatCode } from '@/types/market'
import { formatCompact, formatCompactNumber, formatPrice } from '@/utils/formatters'
import ChangeBadge from './ChangeBadge.vue'
import SparkLine from './SparkLine.vue'

const props = defineProps<{ coin: Coin; currency: FiatCode }>()
const { t, locale } = useI18n()

const series = computed(() => props.coin.sparkline_in_7d?.price ?? [])
const range = computed(() => {
  if (series.value.length < 2) return null
  return { min: Math.min(...series.value), max: Math.max(...series.value) }
})

const stats = computed(() => [
  {
    label: t('marketCap'),
    value: formatCompact(props.coin.market_cap, props.currency, locale.value),
  },
  {
    label: t('volume24h'),
    value: formatCompact(props.coin.total_volume, props.currency, locale.value),
  },
  { label: t('high24h'), value: formatPrice(props.coin.high_24h, props.currency, locale.value) },
  { label: t('low24h'), value: formatPrice(props.coin.low_24h, props.currency, locale.value) },
  {
    label: t('supply'),
    value: `${formatCompactNumber(props.coin.circulating_supply, locale.value)} ${props.coin.symbol.toUpperCase()}`,
  },
  { label: t('ath'), value: formatPrice(props.coin.ath, props.currency, locale.value) },
])
</script>

<template>
  <section class="panel p-5 sm:p-6" aria-live="polite">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <img :src="coin.image" alt="" width="48" height="48" class="w-12 h-12 rounded-full" />
        <div>
          <h2 class="text-2xl font-bold tracking-tight leading-none">{{ coin.name }}</h2>
          <div class="flex items-center gap-2 mt-1.5 text-sm text-muted">
            <span class="uppercase font-medium">{{ coin.symbol }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ t('rank') }} #{{ coin.market_cap_rank }}</span>
          </div>
        </div>
      </div>

      <div class="text-left sm:text-right">
        <p class="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
          {{ formatPrice(coin.current_price, currency, locale) }}
        </p>
        <div class="flex items-center gap-2 mt-1.5 sm:justify-end text-xs text-muted">
          <span>{{ t('change24h') }}</span>
          <ChangeBadge :value="coin.price_change_percentage_24h" size="md" />
          <span>{{ t('change7d') }}</span>
          <ChangeBadge :value="coin.price_change_percentage_7d_in_currency" size="md" />
        </div>
      </div>
    </div>

    <figure class="mt-6">
      <figcaption class="flex justify-between text-xs text-muted mb-2">
        <span>{{ t('chart7d') }}</span>
        <span v-if="range" class="tabular-nums">
          {{ formatPrice(range.min, currency, locale) }} –
          {{ formatPrice(range.max, currency, locale) }}
        </span>
      </figcaption>
      <div class="h-48 sm:h-56 rounded-xl bg-chart p-2">
        <SparkLine
          :points="series"
          :width="600"
          :height="200"
          :max-points="168"
          filled
          :stroke-width="2"
        />
      </div>
    </figure>

    <dl class="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div v-for="s in stats" :key="s.label" class="rounded-xl border border-line p-3">
        <dt class="text-xs text-muted">{{ s.label }}</dt>
        <dd class="mt-1 font-semibold tabular-nums truncate">{{ s.value }}</dd>
      </div>
    </dl>
  </section>
</template>
