<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BellAlertIcon } from '@heroicons/vue/24/outline'
import type { Asset } from '@/types/asset'
import { formatCompact, formatCompactNumber, formatPrice } from '@/utils/formatters'
import ChangeBadge from './ChangeBadge.vue'
import SparkLine from './SparkLine.vue'

const props = defineProps<{ asset: Asset; alertsEnabled: boolean }>()
defineEmits<{ createAlert: [] }>()
const { t, locale } = useI18n()

const range = computed(() => {
  const h = props.asset.history
  return h.length < 2 ? null : { min: Math.min(...h), max: Math.max(...h) }
})

const stats = computed(() => {
  const a = props.asset
  const money = (v: number | null) => formatPrice(v, a.currency, locale.value)
  return [
    { label: t('marketCap'), value: formatCompact(a.marketCap, a.currency, locale.value) },
    {
      label: t('volume24h'),
      value:
        a.kind === 'stock'
          ? formatCompactNumber(a.volume, locale.value)
          : formatCompact(a.volume, a.currency, locale.value),
    },
    { label: t('high24h'), value: money(a.high) },
    { label: t('low24h'), value: money(a.low) },
    ...a.extra.map((e) => ({
      label: t(e.label),
      value:
        e.label === 'supply'
          ? `${formatCompactNumber(e.value, locale.value)} ${e.unit ?? ''}`
          : money(e.value),
    })),
  ]
})
</script>

<template>
  <section class="panel p-5 sm:p-6" aria-live="polite">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <img
          v-if="asset.image"
          :src="asset.image"
          alt=""
          width="48"
          height="48"
          class="w-12 h-12 rounded-full bg-white object-contain"
        />
        <div>
          <h2 class="text-2xl font-bold tracking-tight leading-none">
            {{ asset.kind === 'stock' ? asset.symbol : asset.name }}
          </h2>
          <div class="flex items-center gap-2 mt-1.5 text-sm text-muted">
            <span class="font-medium truncate max-w-[16rem]">{{
              asset.kind === 'stock' ? asset.name : asset.symbol
            }}</span>
            <template v-if="asset.rank">
              <span aria-hidden="true">·</span>
              <span>{{ t('rank') }} #{{ asset.rank }}</span>
            </template>
          </div>
        </div>
      </div>

      <div class="text-left sm:text-right">
        <p class="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
          {{ formatPrice(asset.price, asset.currency, locale) }}
        </p>
        <div class="flex items-center gap-2 mt-1.5 sm:justify-end text-xs text-muted">
          <span>{{ t('changeDay') }}</span>
          <ChangeBadge :value="asset.changeDay" size="md" />
          <span>{{ t(asset.historyDays === 7 ? 'change7d' : 'change30d') }}</span>
          <ChangeBadge :value="asset.changePeriod" size="md" />
        </div>
      </div>
    </div>

    <figure class="mt-6">
      <figcaption class="flex justify-between text-xs text-muted mb-2">
        <span>{{ t(asset.historyDays === 7 ? 'chart7d' : 'chart30d') }}</span>
        <span v-if="range" class="tabular-nums">
          {{ formatPrice(range.min, asset.currency, locale) }} –
          {{ formatPrice(range.max, asset.currency, locale) }}
        </span>
      </figcaption>
      <div class="h-48 sm:h-56 rounded-xl bg-chart p-2">
        <SparkLine
          :points="asset.history"
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

    <div
      v-if="alertsEnabled"
      class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent/5 border border-accent/20 p-4"
    >
      <p class="text-sm">
        <span class="font-semibold">{{ t('alertCtaTitle') }}</span>&nbsp;<span class="text-muted">{{ t('alertCtaText', { symbol: asset.symbol }) }}</span>
      </p>
      <button
        type="button"
        class="btn inline-flex items-center gap-2"
        @click="$emit('createAlert')"
      >
        <BellAlertIcon class="w-4 h-4" />
        {{ t('createAlert') }}
      </button>
    </div>
  </section>
</template>
