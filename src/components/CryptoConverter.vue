<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowsUpDownIcon } from '@heroicons/vue/24/outline'
import type { Asset } from '@/types/asset'
import { cryptoToFiat, fiatToCrypto } from '@/utils/convert'
import { formatAmount, formatPrice } from '@/utils/formatters'

const props = defineProps<{ asset: Asset }>()
const { t, locale } = useI18n()

const amount = ref<number | null>(1000)
/** true: dinheiro → ativo; false: ativo → dinheiro */
const fromFiat = ref(true)

const fromCode = computed(() => (fromFiat.value ? props.asset.currency : props.asset.symbol))
const toCode = computed(() => (fromFiat.value ? props.asset.symbol : props.asset.currency))

const result = computed(() => {
  const value = amount.value ?? 0
  return fromFiat.value
    ? formatAmount(
        fiatToCrypto(value, props.asset.price),
        locale.value,
        props.asset.kind === 'stock' ? 2 : 8,
      )
    : formatPrice(cryptoToFiat(value, props.asset.price), props.asset.currency, locale.value)
})

function swap() {
  fromFiat.value = !fromFiat.value
  amount.value = fromFiat.value ? 1000 : props.asset.kind === 'stock' ? 100 : 1
}

watch(
  () => props.asset.kind,
  () => {
    fromFiat.value = true
    amount.value = 1000
  },
)
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
        <span class="text-xs text-muted">{{
          t(fromFiat && asset.kind === 'stock' ? 'buys' : 'receive')
        }}</span>
        <output
          class="field mt-1 flex items-center justify-between py-3 text-lg font-semibold tabular-nums bg-accent/5"
        >
          <span class="truncate">{{ result }}</span>
          <span class="text-xs font-medium text-muted ml-2">{{ toCode }}</span>
        </output>
      </div>
    </div>

    <p class="mt-3 text-xs text-muted tabular-nums">
      1 {{ asset.symbol }} = {{ formatPrice(asset.price, asset.currency, locale) }}
    </p>
  </section>
</template>
