<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowPathIcon, BellAlertIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { useMarket } from '@/composables/useMarket'
import { useStocks } from '@/composables/useStocks'
import { useTheme } from '@/composables/useTheme'
import { coinToAsset, stockToAsset, type AssetKind } from '@/types/asset'
import TheHeader from '@/components/TheHeader.vue'
import MarketList from '@/components/MarketList.vue'
import AssetDetail from '@/components/AssetDetail.vue'
import CryptoConverter from '@/components/CryptoConverter.vue'
import AlertDialog from '@/components/AlertDialog.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { isDark, toggleTheme } = useTheme()
const crypto = useMarket()
const stocks = useStocks()

const alertsEnabled = import.meta.env.VITE_ALERTS_ENABLED !== 'false'
const alertOpen = ref(false)

// Aba e ativo vêm da URL (?tab=stocks&asset=PETR4), para os links dos e-mails abrirem no lugar certo
const tab = ref<AssetKind>(route.query.tab === 'stocks' ? 'stock' : 'crypto')
if (typeof route.query.asset === 'string') {
  if (tab.value === 'stock') stocks.selectedId.value = route.query.asset.toUpperCase()
  else crypto.selectedId.value = route.query.asset
}
watch(tab, (value) => {
  router.replace({ query: value === 'stock' ? { tab: 'stocks' } : {} })
})

const active = computed(() => (tab.value === 'crypto' ? crypto : stocks))

const assets = computed(() =>
  tab.value === 'crypto'
    ? crypto.coins.value.map((c) => coinToAsset(c, crypto.currency.value))
    : stocks.quotes.value.map(stockToAsset),
)
const selected = computed(
  () => assets.value.find((a) => a.id === active.value.selectedId.value) ?? null,
)
const selectedId = computed({
  get: () => active.value.selectedId.value,
  set: (id: string) => (active.value.selectedId.value = id),
})

const updatedLabel = computed(() => {
  const at = active.value.lastUpdated.value
  return at
    ? t('updated', {
        time: at.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' }),
      })
    : ''
})
const errorMessage = computed(() =>
  active.value.error.value === 'rate_limited' ? t('errRate') : t('errGeneric'),
)

onMounted(() => {
  crypto.refresh()
  stocks.refresh()
})

// No mobile a lista fica abaixo do detalhe: ao escolher um ativo, volta ao topo
watch(selectedId, () => {
  if (window.matchMedia('(max-width: 1023px)').matches)
    window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<template>
  <div class="min-h-screen">
    <div class="backdrop" aria-hidden="true" />

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <TheHeader
        v-model:currency="crypto.currency.value"
        :is-dark="isDark"
        :show-currency="tab === 'crypto'"
        @toggle-theme="toggleTheme()"
      />

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" :aria-label="t('market')" class="tabs">
          <button
            v-for="k in ['crypto', 'stock'] as const"
            :key="k"
            role="tab"
            type="button"
            :aria-selected="tab === k"
            :class="{ active: tab === k }"
            @click="tab = k"
          >
            {{ t(k === 'crypto' ? 'tabCrypto' : 'tabStocks') }}
          </button>
        </div>
        <RouterLink
          v-if="alertsEnabled"
          to="/alertas"
          class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-[var(--text)]"
        >
          <BellAlertIcon class="w-4 h-4" /> {{ t('myAlerts') }}
        </RouterLink>
      </div>

      <div
        v-if="active.error.value"
        role="alert"
        class="panel p-4 flex flex-wrap items-center gap-3 border-down/30"
      >
        <ExclamationTriangleIcon class="w-5 h-5 text-down shrink-0" />
        <div class="flex-1 min-w-0 text-sm">
          <p class="font-semibold">{{ t('errTitle') }}</p>
          <p class="text-muted">
            {{ errorMessage }}<template v-if="assets.length"> · {{ t('stale') }}</template>
          </p>
        </div>
        <button type="button" class="btn" @click="active.refresh">{{ t('retry') }}</button>
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        <div class="space-y-6 min-w-0">
          <template v-if="selected">
            <AssetDetail
              :asset="selected"
              :alerts-enabled="alertsEnabled"
              @create-alert="alertOpen = true"
            />
            <CryptoConverter :asset="selected" />
            <AlertDialog v-model:open="alertOpen" :asset="selected" />
          </template>
          <div
            v-else-if="active.loading.value"
            class="panel p-6 space-y-4"
            :aria-label="t('loading')"
          >
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
            :assets="assets"
            :loading="active.loading.value"
            :hint="t(tab === 'crypto' ? 'marketHint' : 'stocksHint')"
          />
        </div>
      </div>

      <footer
        class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted pt-2"
      >
        <span>{{ t(tab === 'crypto' ? 'poweredBy' : 'poweredByStocks') }}</span>
        <span aria-hidden="true">·</span>
        <span>{{ t(tab === 'crypto' ? 'autoRefresh' : 'autoRefreshStocks') }}</span>
        <template v-if="updatedLabel">
          <span aria-hidden="true">·</span>
          <span class="inline-flex items-center gap-1">
            <ArrowPathIcon class="w-3.5 h-3.5" :class="{ 'animate-spin': active.loading.value }" />
            {{ updatedLabel }}
          </span>
        </template>
      </footer>
    </div>
  </div>
</template>
