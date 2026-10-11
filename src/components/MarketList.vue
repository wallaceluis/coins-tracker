<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { TICKER_PATTERN } from '../../shared/stock'
import type { Asset } from '@/types/asset'
import { formatPrice } from '@/utils/formatters'
import ChangeBadge from './ChangeBadge.vue'
import SparkLine from './SparkLine.vue'

const props = defineProps<{
  assets: Asset[]
  loading: boolean
  hint: string
  /** Aba Bolsa: a busca também adiciona um ticker que não está na lista */
  addable?: boolean
  /** ids que a pessoa adicionou e pode remover */
  removable?: string[]
  placeholder?: string
}>()
const selectedId = defineModel<string>('selectedId', { required: true })
const emit = defineEmits<{ add: [ticker: string]; remove: [id: string] }>()

const { t, locale } = useI18n()
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.assets
  return props.assets.filter(
    (a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q),
  )
})

/** Ticker digitado que ainda não está na lista e pode ser adicionado */
const candidate = computed(() => {
  if (!props.addable) return null
  const ticker = query.value.trim().toUpperCase()
  if (!TICKER_PATTERN.test(ticker) || props.assets.some((a) => a.symbol === ticker)) return null
  return ticker
})

function add() {
  if (!candidate.value) return
  emit('add', candidate.value)
  query.value = ''
}
</script>

<template>
  <section class="panel flex flex-col min-h-0" :aria-label="t('market')">
    <div class="p-4 pb-3 border-b border-line">
      <div class="flex items-baseline justify-between mb-3">
        <h2 class="font-semibold">{{ t('market') }}</h2>
        <span class="text-xs text-muted">{{ hint }}</span>
      </div>
      <label class="relative block">
        <span class="sr-only">{{ t('search') }}</span>
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          v-model="query"
          type="search"
          :placeholder="placeholder ?? t('search')"
          @keydown.enter.prevent="add"
          class="field pl-9 py-2 text-sm"
        />
      </label>
    </div>

    <ul
      class="overflow-y-auto lg:max-h-[calc(100vh-16rem)] p-2"
      role="listbox"
      :aria-label="t('market')"
    >
      <template v-if="loading && !assets.length">
        <li v-for="n in 8" :key="n" class="flex items-center gap-3 p-3">
          <div class="skeleton w-8 h-8 rounded-full" />
          <div class="flex-1 space-y-1.5">
            <div class="skeleton h-3 w-24" />
            <div class="skeleton h-2.5 w-12" />
          </div>
          <div class="skeleton h-6 w-16" />
        </li>
      </template>

      <li v-if="candidate">
        <button type="button" class="row text-accent font-medium" @click="add">
          <PlusIcon class="w-5 h-5" />
          <span class="flex-1 text-left">{{ t('addTicker', { ticker: candidate }) }}</span>
        </button>
      </li>

      <li v-for="(asset, index) in filtered" :key="asset.id" class="flex items-center gap-1">
        <button
          type="button"
          role="option"
          :aria-selected="asset.id === selectedId"
          class="row min-w-0"
          :class="{ selected: asset.id === selectedId }"
          @click="selectedId = asset.id"
        >
          <span class="w-5 text-xs text-muted tabular-nums text-right">{{
            asset.rank ?? index + 1
          }}</span>
          <img
            v-if="asset.image"
            :src="asset.image"
            alt=""
            width="32"
            height="32"
            loading="lazy"
            class="w-8 h-8 rounded-full bg-white object-contain"
          />
          <span
            v-else
            class="w-8 h-8 rounded-full bg-accent/15 text-accent text-[10px] font-bold grid place-items-center"
          >
            {{ asset.symbol.slice(0, 4) }}
          </span>
          <span class="flex-1 min-w-0 text-left">
            <span class="block font-medium truncate">{{
              asset.kind === 'stock' ? asset.symbol : asset.name
            }}</span>
            <span class="block text-xs text-muted truncate">{{
              asset.kind === 'stock' ? asset.name : asset.symbol
            }}</span>
          </span>
          <span class="hidden sm:block w-16 h-7">
            <SparkLine :points="asset.history" :width="64" :height="28" :max-points="28" />
          </span>
          <span class="text-right">
            <span class="block text-sm font-medium tabular-nums">
              {{ formatPrice(asset.price, asset.currency, locale) }}
            </span>
            <ChangeBadge :value="asset.changeDay" />
          </span>
        </button>
        <button
          v-if="removable?.includes(asset.id)"
          type="button"
          class="icon-btn shrink-0"
          :aria-label="t('removeTicker', { ticker: asset.symbol })"
          :title="t('removeTicker', { ticker: asset.symbol })"
          @click="emit('remove', asset.id)"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </li>

      <li
        v-if="!loading && assets.length && !filtered.length && !candidate"
        class="p-6 text-center text-sm text-muted"
      >
        {{ t('noResults') }}
      </li>
    </ul>
  </section>
</template>
