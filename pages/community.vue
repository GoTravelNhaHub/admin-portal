<template>
  <div class="mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-[20px] font-bold leading-7 tracking-[-0.02em] text-[#0A1024]">Community moderation</h2>
        <p class="text-[14px] text-[#64748B]">Reported trips, comments and profiles. Hiding is reversible: hidden content returns 404 and leaves the sitemap and counts.</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="inline-grid grid-cols-3 gap-1 rounded-xl bg-[#E2E8F0]/70 p-1" role="tablist" aria-label="Reports to show">
          <button
            v-for="option in views"
            :key="option.id"
            type="button"
            role="tab"
            :aria-selected="view === option.id"
            class="min-h-9 rounded-lg px-3.5 text-[13px] font-semibold"
            :class="view === option.id ? 'bg-white text-[#0A1024] shadow-[0_1px_3px_rgba(10,16,36,0.12)]' : 'text-[#64748B] hover:text-[#0A1024]'"
            @click="view = option.id"
          >
            {{ option.label }}
          </button>
        </div>
        <button type="button" class="btn-secondary min-h-10 w-auto px-3.5 text-[13px]" :disabled="loading" @click="load">{{ loading ? 'Refreshing…' : 'Refresh' }}</button>
      </div>
    </div>

    <p v-if="error" class="alert-error" role="alert">{{ error }}</p>
    <p v-if="!loading && !items.length" class="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center text-[14px] text-[#64748B]">
      {{ view === 'OPEN' ? 'No open reports.' : 'Nothing here yet.' }}
    </p>

    <ul class="space-y-3">
      <li v-for="item in items" :key="`${item.target.type}:${item.target.id}`" class="rounded-2xl border bg-white p-4 sm:p-5" :class="item.target.status === 'HIDDEN' ? 'border-[#FDE68A]' : 'border-[#E2E8F0]'">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
              {{ item.target.type.toLowerCase() }}
              <span class="rounded-full px-2 py-0.5 normal-case tracking-normal" :class="statusClass(item.target.status)">{{ item.target.status.toLowerCase() }}</span>
              <span class="normal-case tracking-normal">{{ item.count }} {{ item.count === 1 ? 'report' : 'reports' }} · {{ formatDate(item.latestAt) }}</span>
            </p>
            <p class="mt-1.5 whitespace-pre-line break-words text-[15px] leading-[22px] text-[#0A1024]">{{ item.target.title || '(no longer exists)' }}</p>
            <p class="mt-2 flex flex-wrap gap-1.5">
              <span v-for="reason in item.reasons" :key="reason" class="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#334155]">{{ reason.replace('_', ' ') }}</span>
            </p>
            <ul v-if="item.notes.length" class="mt-2 space-y-1 text-[13px] text-[#475569]">
              <li v-for="(note, index) in item.notes" :key="index">“{{ note }}”</li>
            </ul>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <a v-if="item.target.link" :href="siteLink(item.target.link)" target="_blank" rel="noopener" class="btn-secondary min-h-9 w-auto px-3 text-[13px]">Open</a>
            <template v-if="item.target.status === 'ACTIVE'">
              <button type="button" class="btn-primary min-h-9 w-auto bg-[#B91C1C] px-3 text-[13px] hover:bg-[#991B1B]" :disabled="busy" @click="act(item, 'hide')">Hide</button>
              <button v-if="view === 'OPEN'" type="button" class="btn-secondary min-h-9 w-auto px-3 text-[13px]" :disabled="busy" @click="act(item, 'dismiss')">Dismiss</button>
            </template>
            <button v-else-if="item.target.status === 'HIDDEN'" type="button" class="btn-secondary min-h-9 w-auto px-3 text-[13px]" :disabled="busy" @click="act(item, 'restore')">Restore</button>
            <!-- Deleted since it was reported: nothing to hide, just close the reports -->
            <button v-else-if="view === 'OPEN'" type="button" class="btn-secondary min-h-9 w-auto px-3 text-[13px]" :disabled="busy" @click="act(item, 'dismiss')">Dismiss</button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

interface QueueItem {
  target: { type: 'TRIP' | 'COMMENT' | 'PROFILE'; id: string; status: 'ACTIVE' | 'HIDDEN' | 'REMOVED' | 'MISSING'; title: string; link: string | null }
  count: number
  reasons: string[]
  notes: string[]
  latestAt: string
}

definePageMeta({
  layout: 'default',
  middleware: 'admin'
})

const views = [
  { id: 'OPEN', label: 'Open' },
  { id: 'ACTIONED', label: 'Hidden' },
  { id: 'DISMISSED', label: 'Dismissed' }
] as const
// Reported content lives on the public site, not on admin.gotravelnha.com
const siteLink = (link: string) => new URL(link, String(useRuntimeConfig().public.siteUrl)).toString()

const view = ref<(typeof views)[number]['id']>('OPEN')
const items = ref<QueueItem[]>([])
const loading = ref(false)
const busy = ref(false)
const error = ref('')

const load = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await $api<{ data: QueueItem[] }>(`/api/admin/community/reports?status=${view.value}`)
    items.value = response.data
  } catch (err: any) {
    error.value = err?.data?.message || 'Could not load reports.'
  } finally {
    loading.value = false
  }
}

const act = async (item: QueueItem, action: 'hide' | 'restore' | 'dismiss') => {
  if (action === 'hide' && !window.confirm(`Hide this ${item.target.type.toLowerCase()}? It disappears for everyone until restored.`)) return
  try {
    busy.value = true
    const response = await $api<{ data: QueueItem['target'] }>('/api/admin/community/moderate', {
      method: 'POST',
      body: { targetType: item.target.type, targetId: item.target.id, action }
    })
    item.target = response.data
    if (action !== 'restore' && view.value === 'OPEN') items.value = items.value.filter((entry) => entry !== item)
  } catch (err: any) {
    error.value = err?.data?.message || 'Could not apply that action.'
  } finally {
    busy.value = false
  }
}

const statusClass = (status: string) =>
  ({ ACTIVE: 'bg-[#ECFDF5] text-[#047857]', HIDDEN: 'bg-[#FFFBEB] text-[#B45309]', REMOVED: 'bg-[#F1F5F9] text-[#64748B]', MISSING: 'bg-[#F1F5F9] text-[#64748B]' })[status] || ''
const formatDate = (value: string) => new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

watch(view, load)
onMounted(load)

useHead({ title: 'Community moderation | Admin' })
</script>
