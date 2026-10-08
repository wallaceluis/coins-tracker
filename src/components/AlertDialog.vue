<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStorage } from '@vueuse/core'
import { CheckCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { Asset } from '@/types/asset'
import { createAlert } from '@/services/quotesApi'
import { formatPrice } from '@/utils/formatters'

const props = defineProps<{ asset: Asset }>()
const open = defineModel<boolean>('open', { required: true })
const { t, locale } = useI18n()

const email = useStorage('ct:alert-email', '')
const condition = ref<'above' | 'below'>('above')
const target = ref<number | null>(null)
const website = ref('') // honeypot
const status = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const errorCode = ref('')
const dialog = ref<HTMLDialogElement | null>(null)

// Sugere um alvo 5% acima/abaixo do preço atual
const suggest = () => {
  const factor = condition.value === 'above' ? 1.05 : 0.95
  const value = props.asset.price * factor
  target.value = value >= 1 ? Math.round(value * 100) / 100 : Number(value.toPrecision(4))
}

watch(open, (isOpen) => {
  if (isOpen) {
    status.value = 'idle'
    condition.value = 'above'
    suggest()
    dialog.value?.showModal()
  } else {
    dialog.value?.close()
  }
})
watch(condition, suggest)

const diff = computed(() => {
  if (!target.value) return null
  return ((target.value - props.asset.price) / props.asset.price) * 100
})

const errorText = computed(() => {
  const known = [
    'invalid_email',
    'too_many_alerts',
    'too_many_requests',
    'alerts_disabled',
    'invalid_target',
  ]
  return t(`alertErrors.${known.includes(errorCode.value) ? errorCode.value : 'generic'}`)
})

async function submit() {
  if (!target.value) return
  status.value = 'sending'
  try {
    await createAlert({
      email: email.value,
      kind: props.asset.kind,
      symbol: props.asset.id,
      condition: condition.value,
      target: target.value,
      currency: props.asset.currency,
      website: website.value,
    })
    status.value = 'sent'
  } catch (err) {
    errorCode.value = (err as Error).message
    status.value = 'error'
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="panel w-[calc(100%-2rem)] max-w-md p-0 m-auto backdrop:bg-black/50 backdrop:backdrop-blur-sm text-[var(--text)]"
    :aria-label="t('createAlert')"
    @close="open = false"
    @click.self="open = false"
  >
    <div class="p-5 sm:p-6">
      <div class="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 class="text-lg font-semibold">{{ t('alertTitle', { symbol: asset.symbol }) }}</h2>
          <p class="text-sm text-muted mt-0.5">
            {{ t('alertNow', { price: formatPrice(asset.price, asset.currency, locale) }) }}
          </p>
        </div>
        <button
          type="button"
          class="icon-btn shrink-0"
          :aria-label="t('close')"
          @click="open = false"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div v-if="status === 'sent'" class="text-center py-4" role="status">
        <CheckCircleIcon class="w-12 h-12 mx-auto text-up" />
        <p class="font-semibold mt-3">{{ t('alertSentTitle') }}</p>
        <p class="text-sm text-muted mt-1">{{ t('alertSentText', { email }) }}</p>
        <button type="button" class="btn mt-5" @click="open = false">{{ t('ok') }}</button>
      </div>

      <form v-else class="space-y-4" @submit.prevent="submit">
        <fieldset>
          <legend class="text-xs text-muted mb-1.5">{{ t('alertWhen') }}</legend>
          <div class="segmented w-full">
            <button
              v-for="c in ['above', 'below'] as const"
              :key="c"
              type="button"
              class="flex-1"
              :class="{ active: condition === c }"
              :aria-pressed="condition === c"
              @click="condition = c"
            >
              {{ t(c === 'above' ? 'alertAbove' : 'alertBelow') }}
            </button>
          </div>
        </fieldset>

        <label class="block">
          <span class="text-xs text-muted">{{ t('alertTarget') }}</span>
          <span class="relative mt-1 block">
            <input
              v-model.number="target"
              type="number"
              min="0"
              step="any"
              required
              class="field pr-14 py-2.5 font-semibold tabular-nums"
            />
            <span class="unit">{{ asset.currency }}</span>
          </span>
          <span v-if="diff !== null" class="text-xs text-muted mt-1 block tabular-nums">
            {{ t('alertDiff', { diff: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%` }) }}
          </span>
        </label>

        <label class="block">
          <span class="text-xs text-muted">{{ t('email') }}</span>
          <input
            v-model.trim="email"
            type="email"
            required
            autocomplete="email"
            placeholder="voce@email.com"
            class="field mt-1 py-2.5"
          />
        </label>

        <!-- Honeypot: invisível para pessoas -->
        <input
          v-model="website"
          type="text"
          name="website"
          tabindex="-1"
          autocomplete="off"
          class="hidden"
          aria-hidden="true"
        />

        <p v-if="status === 'error'" class="text-sm text-down" role="alert">{{ errorText }}</p>

        <button type="submit" class="btn w-full py-2.5" :disabled="status === 'sending'">
          {{ status === 'sending' ? t('sending') : t('createAlert') }}
        </button>
        <p class="text-xs text-muted text-center">{{ t('alertFinePrint') }}</p>
      </form>
    </div>
  </dialog>
</template>
