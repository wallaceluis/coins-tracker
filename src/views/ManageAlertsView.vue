<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, BellAlertIcon, CheckCircleIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { deleteManagedAlert, fetchManagedAlerts, type ManagedAlert } from '@/services/quotesApi'
import { formatPrice } from '@/utils/formatters'

const route = useRoute()
const { t, locale } = useI18n()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const status = computed(() => (typeof route.query.status === 'string' ? route.query.status : ''))

const email = ref('')
const alerts = ref<ManagedAlert[]>([])
const state = ref<'loading' | 'ready' | 'invalid' | 'none'>('loading')

onMounted(async () => {
  if (!token.value) {
    state.value = 'none'
    return
  }
  try {
    const data = await fetchManagedAlerts(token.value)
    email.value = data.email
    alerts.value = data.alerts
    state.value = 'ready'
  } catch {
    state.value = 'invalid'
  }
})

async function remove(alert: ManagedAlert) {
  await deleteManagedAlert(token.value, alert.id)
  alerts.value = alerts.value.filter((a) => a.id !== alert.id)
}

const label = (a: ManagedAlert) => (a.kind === 'stock' ? a.symbol : a.name)
</script>

<template>
  <div class="min-h-screen">
    <div class="backdrop" aria-hidden="true" />
    <main class="relative max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-sm text-muted hover:text-[var(--text)]"
      >
        <ArrowLeftIcon class="w-4 h-4" /> {{ t('backToMarket') }}
      </RouterLink>

      <div class="flex items-center gap-3">
        <span class="w-10 h-10 rounded-xl bg-accent/15 text-accent grid place-items-center">
          <BellAlertIcon class="w-5 h-5" />
        </span>
        <div>
          <h1 class="text-xl font-bold">{{ t('myAlerts') }}</h1>
          <p v-if="email" class="text-sm text-muted">{{ email }}</p>
        </div>
      </div>

      <div
        v-if="status === 'confirmed'"
        class="panel p-4 flex items-center gap-3 border-up/30"
        role="status"
      >
        <CheckCircleIcon class="w-5 h-5 text-up shrink-0" />
        <p class="text-sm">{{ t('alertConfirmed') }}</p>
      </div>
      <div v-else-if="status === 'removed'" class="panel p-4 text-sm" role="status">
        {{ t('alertRemoved') }}
      </div>
      <div
        v-else-if="status === 'invalid' || state === 'invalid'"
        class="panel p-4 text-sm"
        role="alert"
      >
        {{ t('alertInvalidLink') }}
      </div>

      <section v-if="state === 'ready'" class="panel divide-y divide-[var(--line)]">
        <p v-if="!alerts.length" class="p-6 text-center text-sm text-muted">{{ t('noAlerts') }}</p>
        <div v-for="a in alerts" :key="a.id" class="flex items-center gap-3 p-4">
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ label(a) }}</p>
            <p class="text-sm text-muted">
              {{ t(a.condition === 'above' ? 'alertAbove' : 'alertBelow') }}
              <span class="font-semibold text-[var(--text)] tabular-nums">{{
                formatPrice(a.target, a.currency, locale)
              }}</span>
              <template v-if="a.lastPrice !== null">
                · {{ t('lastPrice') }} {{ formatPrice(a.lastPrice, a.currency, locale) }}
              </template>
            </p>
            <p v-if="a.triggered" class="text-xs text-up mt-0.5">{{ t('alertTriggered') }}</p>
          </div>
          <button type="button" class="icon-btn" :aria-label="t('removeAlert')" @click="remove(a)">
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </section>

      <p v-if="state === 'none'" class="panel p-6 text-sm text-muted">{{ t('manageHowTo') }}</p>
    </main>
  </div>
</template>
