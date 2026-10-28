<template>
  <!-- A map pin with a house inside ("nhà" is home): family trips planned from one place.
       Colours from the community design: primary blue, with the yellow sun as the one warm accent.
       `light` (dark backgrounds) uses a brighter blue so the mark stands out on navy.
       Solid fills only, so several logos on one page never share gradient ids. Keep in sync with public/favicon.svg. -->
  <svg :width="size" :height="size" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" class="logo-svg" aria-hidden="true">
    <rect width="48" height="48" rx="13" :fill="blue" />
    <path d="M24 39.5c-7-7.4-10.5-12.7-10.5-17.3a10.5 10.5 0 0 1 21 0c0 4.6-3.5 9.9-10.5 17.3Z" fill="#FFFFFF" />
    <path d="M18.8 23 24 18.4l5.2 4.6v5.5H18.8Z" :fill="blue" />
    <circle cx="35.5" cy="12.5" r="3.2" fill="#FBBF24" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: [String, Number],
    default: '40'
  },
  light: {
    type: Boolean,
    default: false
  }
})

const blue = computed(() => (props.light ? '#2A7FEA' : '#0066E4'))
</script>

<style scoped>
.logo-svg {
  display: inline-block;
  flex-shrink: 0;
}
</style>
