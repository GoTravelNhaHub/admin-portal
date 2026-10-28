<template>
  <div class="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-[22px] font-bold leading-8 tracking-[-0.02em] text-[#0A1024]">{{ greeting }}</h2>
        <p class="text-[14px] text-[#64748B]">{{ today }} · Here's what needs you first.</p>
      </div>
      <button type="button" class="btn-secondary w-auto min-h-10 px-4 text-[13px]" :disabled="loading" @click="loadStats">
        <svg class="h-4 w-4" :class="loading ? 'animate-spin' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />
        </svg>
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="loadError" class="alert-error" role="alert">{{ loadError }}</p>

    <!-- Needs attention -->
    <section class="grid gap-4" aria-label="Needs attention">
      <article v-for="queue in queues" :key="queue.key" class="flex min-w-0 flex-col rounded-2xl border bg-white" :class="queue.count ? 'border-[#FED7AA]' : 'border-[#E2E8F0]'">
        <header class="flex items-start justify-between gap-3 border-b border-[#F1F5F9] px-5 py-4">
          <div class="flex min-w-0 items-center gap-3">
            <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" :class="queue.count ? 'bg-[#FFF7ED] text-[#C2410C]' : 'bg-[#ECFDF5] text-[#047857]'" aria-hidden="true">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="queue.count ? queue.icon : 'm5 12.5 4.5 4.5L19 7.5'" />
              </svg>
            </span>
            <div class="min-w-0">
              <h3 class="text-[15px] font-bold leading-5 text-[#0A1024]">{{ queue.title }}</h3>
              <p class="text-[13px] leading-5 text-[#64748B]">{{ queue.count ? queue.hint : queue.clear }}</p>
            </div>
          </div>
          <span class="text-[28px] font-bold leading-8 tracking-[-0.02em]" :class="queue.count ? 'text-[#C2410C]' : 'text-[#0A1024]'">
            {{ loading && !loaded ? '–' : queue.count }}
          </span>
        </header>
        <ul v-if="queue.items.length" class="flex-1 divide-y divide-[#F1F5F9]">
          <li v-for="item in queue.items" :key="item.id">
            <NuxtLink :to="queue.to" class="flex items-start justify-between gap-3 px-5 py-3 hover:bg-[#F8FAFC]">
              <span class="min-w-0">
                <span class="block truncate text-[14px] font-semibold text-[#0A1024]">{{ item.title }}</span>
                <span class="block truncate text-[13px] text-[#64748B]">{{ item.detail }}</span>
              </span>
              <span class="shrink-0 text-[12px] text-[#94A3B8]">{{ relative(item.createdAt) }}</span>
            </NuxtLink>
          </li>
        </ul>
        <div v-else class="flex-1 px-5 py-6 text-[14px] text-[#64748B]">{{ loaded ? 'Nothing waiting.' : 'Loading…' }}</div>
        <footer class="border-t border-[#F1F5F9] px-5 py-3">
          <NuxtLink :to="queue.to" class="text-link text-[13px]">{{ queue.cta }} →</NuxtLink>
        </footer>
      </article>
    </section>

    <!-- Last 7 days -->
    <section aria-labelledby="week-title">
      <h2 id="week-title" class="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Last 7 days</h2>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div v-for="tile in weekTiles" :key="tile.label" class="rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-5">
          <p class="text-[13px] font-medium text-[#64748B]">{{ tile.label }}</p>
          <p class="mt-1 text-[26px] font-semibold leading-8 tracking-[-0.02em] text-[#0A1024]">{{ loaded ? tile.value : '–' }}</p>
          <p v-if="tile.note" class="mt-0.5 text-[12px] text-[#94A3B8]">{{ tile.note }}</p>
        </div>
      </div>
    </section>

    <div class="grid gap-4 lg:grid-cols-3">
      <!-- AI planner usage -->
      <section class="rounded-2xl border border-[#E2E8F0] bg-white p-5" aria-labelledby="planner-title">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 id="planner-title" class="text-[15px] font-bold leading-5 text-[#0A1024]">AI Travel Agent usage</h2>
            <p class="text-[13px] text-[#64748B]">Plans in the last 24 hours vs the site cap</p>
          </div>
          <span
            v-if="loaded"
            class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold"
            :class="meter.level === 'ok' ? 'bg-[#EAF2FC] text-[#0057C8]' : meter.level === 'warning' ? 'bg-[#FFFBEB] text-[#B45309]' : 'bg-[#FEF2F2] text-[#B91C1C]'"
          >
            <svg v-if="meter.level !== 'ok'" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10 7v4m0 3h.01M8.6 3.5 2.2 14.6A1.6 1.6 0 0 0 3.6 17h12.8a1.6 1.6 0 0 0 1.4-2.4L11.4 3.5a1.6 1.6 0 0 0-2.8 0Z" /></svg>
            {{ meter.label }}
          </span>
        </div>
        <p class="mt-4 text-[26px] font-semibold leading-8 tracking-[-0.02em] text-[#0A1024]">
          {{ loaded ? planner.last24h : '–' }}
          <span class="text-[15px] font-medium text-[#64748B]">/ {{ planner.siteDailyLimit }}</span>
        </p>
        <div
          class="mt-3 h-2.5 overflow-hidden rounded-full"
          :class="meter.level === 'ok' ? 'bg-[#EAF2FC]' : meter.level === 'warning' ? 'bg-[#FEF3C7]' : 'bg-[#FEE2E2]'"
          role="meter"
          :aria-valuenow="planner.last24h"
          aria-valuemin="0"
          :aria-valuemax="planner.siteDailyLimit"
          aria-label="AI plans in the last 24 hours"
        >
          <div
            class="h-full rounded-full transition-[width] duration-500"
            :class="meter.level === 'ok' ? 'bg-[#0066E4]' : meter.level === 'warning' ? 'bg-[#D97706]' : 'bg-[#DC2626]'"
            :style="{ width: `${meter.percent}%` }"
          ></div>
        </div>
        <p class="mt-2 text-[12px] text-[#94A3B8]">New plans are refused once the cap is reached. Guests get 3 a day, signed-in users 10.</p>
      </section>

      <!-- Setup checks -->
      <section class="rounded-2xl border border-[#E2E8F0] bg-white p-5" aria-labelledby="config-title">
        <h2 id="config-title" class="text-[15px] font-bold leading-5 text-[#0A1024]">Setup checks</h2>
        <p class="text-[13px] text-[#64748B]">Whether each setting is present on this server</p>
        <ul class="mt-4 space-y-2.5">
          <li v-for="check in configChecks" :key="check.label" class="flex items-center justify-between gap-3 text-[14px]">
            <span class="text-[#334155]">{{ check.label }}</span>
            <span v-if="!loaded" class="text-[12px] text-[#94A3B8]">…</span>
            <span v-else-if="check.ok" class="inline-flex items-center gap-1 text-[12px] font-semibold text-[#047857]">
              <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 10.5 3 3 7-7" /></svg>
              Set
            </span>
            <span v-else class="inline-flex items-center gap-1 text-[12px] font-semibold text-[#B45309]">
              <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6v5m0 3h.01" /></svg>
              Missing
            </span>
          </li>
        </ul>
        <p class="mt-3 text-[12px] text-[#94A3B8]">Checks only that a value is set, not that it works.</p>
      </section>

      <!-- All time -->
      <section class="rounded-2xl border border-[#E2E8F0] bg-white p-5" aria-labelledby="totals-title">
        <h2 id="totals-title" class="text-[15px] font-bold leading-5 text-[#0A1024]">All time</h2>
        <dl class="mt-4 space-y-3">
          <div v-for="item in totals" :key="item.label" class="flex items-baseline justify-between gap-3">
            <dt class="text-[14px] text-[#64748B]">{{ item.label }}</dt>
            <dd class="text-[15px] font-semibold tabular-nums text-[#0A1024]">{{ loaded ? item.value : '–' }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <!-- Shortcuts -->
    <section aria-labelledby="shortcuts-title">
      <h2 id="shortcuts-title" class="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Shortcuts</h2>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink
          v-for="link in shortcuts"
          :key="link.to"
          :to="link.to"
          class="group flex items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 transition hover:border-[#0066E4]/40 hover:shadow-[0_12px_28px_-20px_rgba(10,16,36,0.4)]"
        >
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF2FC] text-[#0066E4]" aria-hidden="true">
            <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="link.icon" /></svg>
          </span>
          <span class="min-w-0">
            <span class="block text-[14px] font-semibold text-[#0A1024] group-hover:text-[#0057C8]">{{ link.label }}</span>
            <span class="block text-[13px] leading-5 text-[#64748B]">{{ link.detail }}</span>
          </span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: 'admin'
})

interface DashboardStats {
  totalEvents: number
  activeUsers: number
  revenue: number
  lastScrapeAt: string | null
  attention: { support: number }
  week: { newUsers: number; aiPlans: number; affiliateClicks: number }
  planner: { last24h: number; siteDailyLimit: number }
  queue: {
    support: Array<{ id: string; name: string; message: string; createdAt: string }>
  }
  config: { email: boolean; supportInbox: boolean; aiPlanner: boolean }
}

const { user } = useAuthState()
const stats = ref<DashboardStats | null>(null)
const loading = ref(false)
const loadError = ref('')
const loaded = computed(() => !!stats.value)

const compact = new Intl.NumberFormat('en-SG', { notation: 'compact', maximumFractionDigits: 1 })
const money = (value: number) => `S$${value >= 10000 ? compact.format(value) : value.toLocaleString('en-SG', { maximumFractionDigits: 0 })}`

const relative = (value?: string | null) => {
  if (!value) return 'Never'
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000)
  if (Number.isNaN(minutes)) return 'Never'
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

const greeting = computed(() => {
  const hour = new Date().getHours()
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const name = (user.value as { firstName?: string; username?: string } | null)?.firstName || ''
  return name ? `${part}, ${name}` : part
})
const today = new Intl.DateTimeFormat('en-SG', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

const queues = computed(() => [
  {
    key: 'support',
    title: 'Unanswered messages',
    hint: 'Contact form messages not marked handled',
    clear: 'The support inbox is empty',
    cta: 'Open support inbox',
    to: '/support',
    icon: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5l-4 3v-3H6a2 2 0 0 1-2-2V6Z',
    count: stats.value?.attention.support ?? 0,
    items: (stats.value?.queue.support ?? []).map((message) => ({
      id: message.id,
      title: message.name,
      detail: message.message,
      createdAt: message.createdAt
    }))
  }
])

const weekTiles = computed(() => {
  const week = stats.value?.week
  return [
    { label: 'New users', value: compact.format(week?.newUsers ?? 0) },
    { label: 'AI trip plans', value: compact.format(week?.aiPlans ?? 0), note: 'Successful plans' },
    { label: 'Partner clicks', value: compact.format(week?.affiliateClicks ?? 0), note: 'Trip.com and Klook' }
  ]
})

const planner = computed(() => stats.value?.planner ?? { last24h: 0, siteDailyLimit: 300 })
const meter = computed(() => {
  const { last24h, siteDailyLimit } = planner.value
  const ratio = siteDailyLimit ? last24h / siteDailyLimit : 0
  const percent = Math.min(100, Math.round(ratio * 100))
  if (ratio >= 0.95) return { percent, level: 'critical', label: 'At cap' }
  if (ratio >= 0.8) return { percent, level: 'warning', label: 'Near cap' }
  return { percent, level: 'ok', label: `${percent}% used` }
})

const configChecks = computed(() => {
  const config = stats.value?.config
  return [
    { label: 'Email sending (SMTP)', ok: !!config?.email },
    { label: 'Support inbox address', ok: !!config?.supportInbox },
    { label: 'AI planner key', ok: !!config?.aiPlanner }
  ]
})

const totals = computed(() => [
  { label: 'Active users', value: (stats.value?.activeUsers ?? 0).toLocaleString('en-SG') },
  { label: 'Active partner listings', value: (stats.value?.totalEvents ?? 0).toLocaleString('en-SG') },
  { label: 'Affiliate commission', value: money(stats.value?.revenue ?? 0) },
  { label: 'Offers last updated', value: relative(stats.value?.lastScrapeAt) }
])

const shortcuts = [
  { to: '/deal-template-generator', label: 'Deal templates', detail: 'Edit the Explore comparison pages', icon: 'M4 5h16v4H4V5Zm0 8h7v6H4v-6Zm11 0h5v6h-5v-6Z' },
  { to: '/support', label: 'Support inbox', detail: 'Read and answer contact messages', icon: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5l-4 3v-3H6a2 2 0 0 1-2-2V6Z' },
  { to: '/affiliate-performance', label: 'Affiliate performance', detail: 'Clicks and conversions by placement', icon: 'M4 20V10m6 10V4m6 16v-7m4 7H2' },
  { to: '/users', label: 'Users', detail: 'Find and manage accounts', icon: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' }
]

const loadStats = async () => {
  try {
    loading.value = true
    loadError.value = ''
    const res = await $api<{ success?: boolean; data?: DashboardStats }>('/api/admin/dashboard/stats')
    if (res?.success && res.data) stats.value = res.data
  } catch (error: any) {
    loadError.value = error?.data?.message || 'Could not load the dashboard. Try Refresh.'
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>
