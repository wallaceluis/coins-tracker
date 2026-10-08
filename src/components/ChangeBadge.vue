<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatPercent } from '@/utils/formatters'

const props = defineProps<{ value: number | null | undefined; size?: 'sm' | 'md' }>()
const { locale } = useI18n()

const tone = computed(() => {
  if (props.value === null || props.value === undefined) return 'text-slate-400 bg-slate-500/10'
  return props.value >= 0 ? 'text-up bg-up/10' : 'text-down bg-down/10'
})
</script>

<template>
  <span
    class="inline-flex items-center gap-0.5 rounded-md font-semibold tabular-nums whitespace-nowrap"
    :class="[tone, size === 'md' ? 'px-2 py-1 text-sm' : 'px-1.5 py-0.5 text-xs']"
  >
    <span v-if="value !== null && value !== undefined" aria-hidden="true">{{
      value >= 0 ? '▲' : '▼'
    }}</span>
    {{ formatPercent(value, locale, false) }}
  </span>
</template>
