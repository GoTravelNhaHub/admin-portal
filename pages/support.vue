<template>
  <div class="mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-[20px] font-bold leading-7 tracking-[-0.02em] text-[#0A1024]">Support inbox</h2>
        <p class="text-[14px] text-[#64748B]">Messages from the contact form. Reply by email, then mark them handled.</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="inline-grid grid-cols-2 gap-1 rounded-xl bg-[#E2E8F0]/70 p-1" role="tablist" aria-label="Messages to show">
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
        <button type="button" class="btn-secondary min-h-10 w-auto px-3.5 text-[13px]" :disabled="loading" @click="load">
          <svg class="h-4 w-4" :class="loading ? 'animate-spin' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />
          </svg>
          <span class="sr-only sm:not-sr-only">{{ loading ? 'Refreshing…' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <p v-if="error" class="alert-error" role="alert">{{ error }}</p>

    <ul class="space-y-3">
      <li
        v-for="message in messages"
        :key="message.id"
        class="rounded-2xl border bg-white p-4 sm:p-5"
        :class="message.handledAt ? 'border-[#E2E8F0]' : 'border-[#FED7AA]'"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF2FC] text-[14px] font-bold text-[#0057C8]" aria-hidden="true">
              {{ message.name.charAt(0).toUpperCase() }}
            </span>
            <div class="min-w-0">
              <p class="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-[#0A1024]">
                {{ message.name }}
                <span v-if="message.handledAt" class="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-semibold text-[#047857]">Handled</span>
                <span v-else class="rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[11px] font-semibold text-[#C2410C]">Open</span>
              </p>
              <p class="truncate text-[13px] text-[#64748B]">{{ message.email }}</p>
              <p class="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-[#94A3B8]">
                <span>{{ formatDate(message.createdAt) }}</span>
                <span v-if="message.reference">· Booking <span class="font-mono text-[#475569]">{{ message.reference }}</span></span>
                <span v-if="!message.emailedAt" class="font-medium text-[#B45309]" title="Saved here only. Email notifications need SMTP set up.">· Not emailed</span>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a :href="replyLink(message)" class="btn-primary min-h-9 w-auto px-3.5 text-[13px]">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
              Reply
            </a>
            <button type="button" class="btn-secondary min-h-9 w-auto px-3.5 text-[13px]" @click="mark(message, message.handledAt ? 'reopen' : 'handled')">
              {{ message.handledAt ? 'Reopen' : 'Mark handled' }}
            </button>
          </div>
        </div>
        <p class="mt-3 whitespace-pre-wrap rounded-xl bg-[#F8FAFC] px-4 py-3 text-[14px] leading-[22px] text-[#334155]">{{ message.message }}</p>
      </li>
    </ul>

    <div v-if="!loading && messages.length === 0" class="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-12 text-center">
      <span class="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF5] text-[#047857]" aria-hidden="true">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 12.5 4.5 4.5L19 7.5" /></svg>
      </span>
      <p class="mt-3 font-semibold text-[#0A1024]">{{ view === 'open' ? 'Inbox zero' : 'No messages yet' }}</p>
      <p class="mt-1 text-[14px] text-[#64748B]">{{ view === 'open' ? 'Every message has been handled.' : 'Contact form messages will appear here.' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: 'admin'
})

interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  reference: string | null
  emailedAt: string | null
  handledAt: string | null
  createdAt: string
}

const view = ref<'open' | 'all'>('open')
const views = [
  { id: 'open' as const, label: 'Open' },
  { id: 'all' as const, label: 'All' }
]
const messages = ref<ContactMessage[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

const replyLink = (message: ContactMessage) =>
  `mailto:${message.email}?subject=${encodeURIComponent(message.reference ? `Re: booking ${message.reference}` : 'Re: your message to GoTravelNha')}`

const load = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await $api<{ data: ContactMessage[] }>('/api/admin/support/messages', { query: { view: view.value } })
    messages.value = response.data
  } catch (err: any) {
    error.value = err?.data?.message || 'Failed to load messages.'
  } finally {
    loading.value = false
  }
}

const mark = async (message: ContactMessage, action: 'handled' | 'reopen') => {
  try {
    await $api(`/api/admin/support/messages/${message.id}`, { method: 'POST', body: { action } })
    await load()
  } catch (err: any) {
    error.value = err?.data?.message || 'Could not update the message.'
  }
}

watch(view, load)
onMounted(load)
</script>
