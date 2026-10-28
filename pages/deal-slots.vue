<template>
  <div class="bg-gray-100 min-h-full">
    <div class="px-4 sm:px-6 lg:px-8 py-5">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Deal Slot Manager</h3>
          <button
            @click="resetSlotForm"
            class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            New Slot
          </button>
        </div>

        <form @submit.prevent="saveSlot" class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          <input v-model="slotForm.title" required placeholder="Card title (public)" class="px-3 py-2 border border-gray-300 rounded-lg" />
          <input v-model="slotForm.baseUrl" required type="url" placeholder="https://..." class="px-3 py-2 border border-gray-300 rounded-lg" />

          <select v-model="slotForm.provider" required class="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="trip">Trip.com</option>
            <option value="klook">Klook</option>
          </select>
          <select v-model="slotForm.category" required class="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="flight">Flight</option>
            <option value="hotel">Hotel</option>
            <option value="activity">Activity</option>
          </select>

          <input v-model="slotForm.destination" placeholder="destination (e.g. singapore, tokyo, global)" class="px-3 py-2 border border-gray-300 rounded-lg" />
          <input v-model.number="slotForm.priority" type="number" min="0" placeholder="priority" class="px-3 py-2 border border-gray-300 rounded-lg" />

          <input v-model="slotForm.description" placeholder="Public description (optional)" class="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg" />

          <label class="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" v-model="slotForm.isActive" class="w-4 h-4" />
            Active
          </label>

          <div class="md:col-span-2 flex gap-2">
            <button :disabled="slotSaving" type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {{ slotSaving ? 'Saving...' : (slotForm.id ? 'Update Slot' : 'Create Slot') }}
            </button>
            <button type="button" @click="resetSlotForm" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              Clear
            </button>
          </div>
        </form>

        <div v-if="slots.length === 0" class="text-sm text-gray-500">No slots yet. Create one to control Browse partner deals cards.</div>
        <div v-else class="space-y-2">
          <div v-for="slot in slots" :key="slot.id" class="border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-medium text-sm text-gray-900">{{ slot.title }}</p>
              <p class="text-xs text-gray-500 mt-1">
                {{ slot.provider }} • {{ slot.category }} • {{ slot.destination }} • priority {{ slot.priority }}
              </p>
              <p class="text-xs text-gray-500 truncate mt-1" :title="slot.baseUrl">{{ slot.baseUrl }}</p>
            </div>
            <button @click="editSlot(slot)" class="px-3 py-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200">
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: 'admin'
})

const slots = ref<any[]>([])
const slotSaving = ref(false)

const emptySlot = () => ({
  id: '',
  title: '',
  provider: 'trip',
  category: 'hotel',
  destination: 'global',
  description: '',
  baseUrl: '',
  isActive: true,
  priority: 0
})

const slotForm = ref(emptySlot())

const loadSlots = async () => {
  const response = await $api('/api/admin/affiliate/slots') as any
  if (response?.success) {
    slots.value = response.data || []
  }
}

const resetSlotForm = () => {
  slotForm.value = emptySlot()
}

const editSlot = (slot: any) => {
  slotForm.value = {
    id: slot.id,
    title: slot.title || '',
    provider: slot.provider || 'trip',
    category: slot.category || 'hotel',
    destination: slot.destination || 'global',
    description: slot.description || '',
    baseUrl: slot.baseUrl || '',
    isActive: slot.isActive !== false,
    priority: Number(slot.priority || 0) || 0
  }
}

const saveSlot = async () => {
  slotSaving.value = true
  try {
    const response = await $api('/api/admin/affiliate/slots', {
      method: 'POST',
      body: { ...slotForm.value }
    }) as any
    if (response?.success) {
      await loadSlots()
      resetSlotForm()
    }
  } finally {
    slotSaving.value = false
  }
}

onMounted(loadSlots)
</script>
