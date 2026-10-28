<template>
  <div class="min-h-full bg-gray-50 pb-12">
    <div class="px-4 sm:px-6 lg:px-8 py-5 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Unit Economics</h2>
          <p class="text-sm text-gray-600">
            Partner clicks and commissions, overall and by acquisition channel.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <span>Window</span>
            <select
              v-model.number="days"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option :value="7">7 days</option>
              <option :value="30">30 days</option>
              <option :value="90">90 days</option>
              <option :value="365">12 months</option>
            </select>
          </label>
          <button
            @click="fetchEconomics"
            :disabled="loading"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            <span>{{ loading ? 'Refreshing…' : 'Refresh' }}</span>
          </button>
        </div>
      </div>

      <div v-if="error" class="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        {{ error }}
      </div>

      <template v-if="data">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Affiliate</h3>
          <div v-if="data.affiliate.clicksByProvider.length === 0" class="text-sm text-gray-500">No affiliate clicks in this window.</div>
          <table v-else class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-xs font-semibold text-gray-500 uppercase">
                <th class="py-2">Provider</th>
                <th class="py-2">Clicks</th>
                <th class="py-2">Conversions</th>
                <th class="py-2">Commission</th>
                <th class="py-2">Per click</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in affiliateRows" :key="row.provider">
                <td class="py-2 font-medium text-gray-800 uppercase">{{ row.provider }}</td>
                <td class="py-2 text-gray-700">{{ row.clicks.toLocaleString() }}</td>
                <td class="py-2 text-gray-700">{{ row.conversions }}</td>
                <td class="py-2 text-gray-700">{{ row.commission || '—' }}</td>
                <td class="py-2 text-gray-700">{{ row.perClick || '—' }}</td>
              </tr>
            </tbody>
          </table>
          <p class="text-xs text-gray-500 mt-3">
            Commissions come from partner postbacks (/api/affiliate/postback) or the CSV import below. Rejected conversions are excluded.
          </p>
          <form @submit.prevent="importConversions" class="mt-4 space-y-2 border-t border-gray-100 pt-4">
            <label class="block text-sm font-semibold text-gray-800">Import partner commission report (CSV)</label>
            <p class="text-xs text-gray-500">Columns: provider, sub_id, order_id, sale_amount, commission, currency, status, date. Re-importing the same order updates it.</p>
            <input type="file" accept=".csv,text/csv" @change="readCsvFile" class="block text-sm" />
            <textarea v-model="csvText" rows="3" placeholder="or paste CSV here" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"></textarea>
            <div class="flex items-center gap-3">
              <button type="submit" :disabled="importing || !csvText.trim()" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
                {{ importing ? 'Importing…' : 'Import' }}
              </button>
              <span v-if="importResult" class="text-xs text-gray-700">{{ importResult }}</span>
            </div>
          </form>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 class="text-lg font-bold text-gray-900 mb-1">By acquisition channel</h3>
          <p class="text-xs text-gray-500 mb-4">
            First touch from UTM tags, ad click ids or referrer; commission is joined to clicks on the sub id.
            <span v-if="data.channelClicksSampled">Clicks are counted from the latest 20,000 only.</span>
          </p>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Channel</th>
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Partner clicks</th>
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Commission</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="row in data.byChannel" :key="row.channel" class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ row.channel }}</td>
                  <td class="px-4 py-3 text-gray-700">{{ row.clicks.toLocaleString() }}</td>
                  <td class="px-4 py-3 text-gray-700">
                    {{ Object.entries(row.commission).map(([currency, value]) => `${currency} ${value.toFixed(2)}`).join(', ') || '—' }}
                  </td>
                </tr>
                <tr v-if="data.byChannel.length === 0">
                  <td colspan="3" class="px-4 py-6 text-center text-gray-500">No partner clicks in this window.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: 'admin'
})

interface UnitEconomicsResponse {
  days: number
  byChannel: Array<{
    channel: string
    clicks: number
    commission: Record<string, number>
  }>
  channelClicksSampled: boolean
  affiliate: {
    clicksByProvider: Array<{ provider: string; clicks: number }>
    conversions: Array<{
      provider: string
      currency: string
      conversions: number
      sales: number
      commission: number
      commissionPerClick: number
      conversionRate: number
    }>
  }
}

const data = ref<UnitEconomicsResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const days = ref(30)

const affiliateRows = computed(() => {
  if (!data.value) return []
  return data.value.affiliate.clicksByProvider.map((row) => {
    const conversions = data.value!.affiliate.conversions.filter((c) => c.provider === row.provider)
    return {
      provider: row.provider,
      clicks: row.clicks,
      conversions: conversions.reduce((sum, c) => sum + c.conversions, 0),
      commission: conversions.map((c) => `${c.currency} ${c.commission.toFixed(2)}`).join(', '),
      perClick: conversions.map((c) => `${c.currency} ${c.commissionPerClick.toFixed(3)}`).join(', ')
    }
  })
})

const csvText = ref('')
const importing = ref(false)
const importResult = ref<string | null>(null)

const readCsvFile = async (changeEvent: Event) => {
  const file = (changeEvent.target as HTMLInputElement).files?.[0]
  if (file) csvText.value = await file.text()
}

const importConversions = async () => {
  try {
    importing.value = true
    importResult.value = null
    const response = await $api<{ created: number; updated: number; skipped: number; errors: string[] }>(
      '/api/admin/affiliate/conversions/import',
      { method: 'POST', body: { csv: csvText.value } }
    )
    importResult.value = `${response.created} added, ${response.updated} updated, ${response.skipped} skipped${
      response.errors.length ? ` (${response.errors.join('; ')})` : ''
    }`
    csvText.value = ''
    await fetchEconomics()
  } catch (err: any) {
    importResult.value = err?.data?.message || 'Import failed.'
  } finally {
    importing.value = false
  }
}

const fetchEconomics = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await $api<{ success: boolean; data: UnitEconomicsResponse }>('/api/admin/analytics/unit-economics', {
      query: { days: days.value }
    })
    data.value = response.data
  } catch (err: any) {
    console.error('Failed to load unit economics:', err)
    error.value = err?.data?.message || err?.message || 'Failed to load unit economics.'
  } finally {
    loading.value = false
  }
}

watch(days, fetchEconomics)

onMounted(() => {
  fetchEconomics()
})
</script>
