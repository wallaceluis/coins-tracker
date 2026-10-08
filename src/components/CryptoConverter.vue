<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowsUpDownIcon } from '@heroicons/vue/24/outline'
import type { Coin, FiatCode } from '@/types/market'
import { cryptoToFiat, fiatToCrypto } from '@/utils/convert'
import { formatAmount, formatPrice } from '@/utils/formatters'

const props = defineProps<{ coin: Coin; currency: FiatCode }>()
const { t, locale } = useI18n()

const amount = ref<number | null>(1000)
/** true: fiat → cripto; false: cripto → fiat */
const fromFiat = ref(true)

const fromCode = computed(() => (fromFiat.value ? props.currency : props.coin.symbol.toUpperCase()))
const toCode = computed(() => (fromFiat.value ? props.coin.symbol.toUpperCase() : props.currency))

const result = computed(() => {
  const value = amount.value ?? 0
  return fromFiat.value
    ? formatAmount(fiatToCrypto(value, props.coin.current_price), locale.value, 8)
    : formatPrice(cryptoToFiat(value, props.coin.current_price), props.currency, locale.value)
})

function swap() {
  fromFiat.value = !fromFiat.value
  amount.value = fromFiat.value ? 1000 : 1
}
</script>

<template>
  <section class="panel p-5 sm:p-6">
    <h3 class="font-semibold mb-4">{{ t('converter') }}</h3>

    <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-3">
      <label class="block">
        <span class="text-xs text-muted">{{ t('pay') }}</span>
        <span class="relative mt-1 block">
          <input
            v-model.number="amount"
            type="number"
            inputmode="decimal"
            min="0"
            step="any"
            class="field pr-16 py-3 text-lg font-semibold tabular-nums"
          />
          <span class="unit">{{ fromCode }}</span>
        </span>
      </label>

      <button
        type="button"
        class="icon-btn self-end mb-1.5 mx-auto"
        :aria-label="t('swap')"
        @click="swap"
      >
        <ArrowsUpDownIcon class="w-5 h-5 sm:-rotate-90" />
      </button>

      <div>
        <span class="text-xs text-muted">{{ t('receive') }}</span>
        <output
          class="field mt-1 flex items-center justify-between py-3 text-lg font-semibold tabular-nums bg-accent/5"
        >
          <span class="truncate">{{ result }}</span>
          <span class="text-xs font-medium text-muted ml-2">{{ toCode }}</span>
        </output>
      </div>
    </div>

    <p class="mt-3 text-xs text-muted tabular-nums">
      1 {{ coin.symbol.toUpperCase() }} = {{ formatPrice(coin.current_price, currency, locale) }}
    </p>
  </section>
</template>
