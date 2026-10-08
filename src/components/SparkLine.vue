<script setup lang="ts">
import { computed, useId } from 'vue'
import { buildChart, downsample } from '@/utils/sparkline'

const props = withDefaults(
  defineProps<{
    points: number[]
    width?: number
    height?: number
    maxPoints?: number
    filled?: boolean
    strokeWidth?: number
  }>(),
  { width: 120, height: 36, maxPoints: 42, filled: false, strokeWidth: 1.5 },
)

const gradientId = `spark-${useId()}`
const chart = computed(() =>
  buildChart(downsample(props.points, props.maxPoints), props.width, props.height),
)
const color = computed(() => (chart.value?.up ? 'var(--color-up)' : 'var(--color-down)'))
</script>

<template>
  <svg
    v-if="chart"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    class="block w-full h-full overflow-visible"
    aria-hidden="true"
  >
    <defs v-if="filled">
      <linearGradient :id="gradientId" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.28" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path v-if="filled" :d="chart.area" :fill="`url(#${gradientId})`" />
    <path
      :d="chart.line"
      fill="none"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linejoin="round"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
  <div v-else class="w-full h-full" />
</template>
