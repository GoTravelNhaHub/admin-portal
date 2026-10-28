<template>
  <div>
    <div class="mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="text-[20px] font-bold leading-7 tracking-[-0.02em] text-[#0A1024]">Users</h2>
          <p class="text-[14px] text-[#64748B]">Find accounts, change roles, and turn access on or off.</p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn-secondary min-h-10 w-auto px-3.5 text-[13px]" :disabled="!filteredUsers.length" @click="exportCsv">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" /></svg>
            <span class="sr-only sm:not-sr-only">Export CSV</span>
          </button>
          <button type="button" class="btn-primary min-h-10 w-auto px-4 text-[13px]" @click="openCreate">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14M5 12h14" /></svg>
            Add user
          </button>
        </div>
      </div>

      <p v-if="pageError" class="alert-error" role="alert">{{ pageError }}</p>
      <p v-if="notice" class="alert-success" role="status">{{ notice }}</p>

      <!-- Summary tiles double as quick filters -->
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          v-for="tile in tiles"
          :key="tile.key"
          type="button"
          class="rounded-2xl border bg-white p-4 text-left transition hover:border-[#0066E4]/40"
          :class="tile.active ? 'border-[#0066E4] ring-2 ring-[#0066E4]/15' : 'border-[#E2E8F0]'"
          :aria-pressed="tile.active"
          @click="applyTile(tile.key)"
        >
          <p class="text-[13px] font-medium text-[#64748B]">{{ tile.label }}</p>
          <p class="mt-1 text-[24px] font-semibold leading-8 tracking-[-0.02em] text-[#0A1024]">{{ loaded ? tile.value.toLocaleString('en-SG') : '–' }}</p>
        </button>
      </div>

      <!-- Toolbar -->
      <div class="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3 lg:flex-row lg:items-center">
        <label class="relative block flex-1">
          <span class="sr-only">Search users</span>
          <svg class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m20 20-4.5-4.5M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" /></svg>
          <input v-model="searchQuery" type="search" class="form-input py-2.5 pl-10" placeholder="Search name, username or email" />
        </label>
        <div class="flex flex-wrap items-center gap-2">
          <div class="inline-grid grid-cols-3 gap-1 rounded-xl bg-[#F1F5F9] p-1" role="group" aria-label="Role">
            <button
              v-for="option in roleOptions"
              :key="option.value"
              type="button"
              class="min-h-9 rounded-lg px-3 text-[13px] font-semibold"
              :class="filterRole === option.value ? 'bg-white text-[#0A1024] shadow-[0_1px_3px_rgba(10,16,36,0.12)]' : 'text-[#64748B] hover:text-[#0A1024]'"
              :aria-pressed="filterRole === option.value"
              @click="filterRole = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <label class="sr-only" for="filter-status">Status</label>
          <select id="filter-status" v-model="filterStatus" class="form-input w-auto py-2 pr-9 text-[14px] sm:text-[13px]">
            <option value="">Any status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <label class="sr-only" for="sort-users">Sort</label>
          <select id="sort-users" v-model="sortBy" class="form-input w-auto py-2 pr-9 text-[14px] sm:text-[13px]">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading && !loaded" class="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center text-[14px] text-[#64748B]">Loading users…</div>

      <template v-else>
        <!-- Desktop table -->
        <div class="hidden overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white md:block">
          <table class="min-w-full divide-y divide-[#E2E8F0] text-[14px]">
            <thead class="bg-[#F8FAFC]">
              <tr>
                <th v-for="heading in ['User', 'Role', 'Status', 'Activity', 'Joined', '']" :key="heading" class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
                  <span v-if="heading">{{ heading }}</span><span v-else class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F1F5F9]">
              <tr v-for="user in paginatedUsers" :key="user.id" class="hover:bg-[#F8FAFC]" :class="user.isActive ? '' : 'bg-[#FAFAFA]'">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold" :class="user.isActive ? 'bg-[#EAF2FC] text-[#0057C8]' : 'bg-[#F1F5F9] text-[#94A3B8]'" aria-hidden="true">{{ initialOf(user) }}</span>
                    <div class="min-w-0">
                      <p class="flex items-center gap-1.5 truncate font-semibold text-[#0A1024]">
                        {{ nameOf(user) }}
                        <span v-if="isCurrentUser(user)" class="rounded-full bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">You</span>
                      </p>
                      <p class="truncate text-[13px] text-[#64748B]">
                        @{{ user.username }} · {{ user.email }}
                        <span v-if="user.provider === 'google'" class="ml-1 rounded bg-[#F1F5F9] px-1 text-[11px] font-medium text-[#475569]">Google</span>
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3"><span class="rounded-full border px-2 py-0.5 text-[12px] font-semibold" :class="roleBadge(user.role)">{{ user.role === 'ADMIN' ? 'Admin' : 'User' }}</span></td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center gap-1.5 text-[13px] font-medium" :class="user.isActive ? 'text-[#047857]' : 'text-[#94A3B8]'">
                    <span class="h-1.5 w-1.5 rounded-full" :class="user.isActive ? 'bg-[#10B981]' : 'bg-[#CBD5E1]'" aria-hidden="true"></span>
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="min-w-[10rem] max-w-[16rem] px-4 py-3 text-[13px] leading-5 text-[#475569]">{{ activityOf(user) }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-[13px] text-[#64748B]" :title="longDate(user.createdAt)">{{ shortDate(user.createdAt) }}</td>
                <td class="whitespace-nowrap px-4 py-3">
                  <div class="flex justify-end gap-1">
                    <button type="button" class="btn-secondary min-h-8 w-auto px-3 text-[12px]" @click="openEdit(user)">Edit</button>
                    <template v-if="!isCurrentUser(user)">
                      <button type="button" class="btn-secondary min-h-8 w-auto px-3 text-[12px]" :disabled="busyId === user.id" @click="toggleUserStatus(user)">
                        {{ user.isActive ? 'Deactivate' : 'Activate' }}
                      </button>
                      <button
                        type="button"
                        class="inline-flex min-h-8 items-center rounded-xl border border-[#FECACA] px-3 text-[12px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2]"
                        :aria-label="`Delete ${user.username}`"
                        @click="confirmDelete(user)"
                      >
                        Delete
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
              <tr v-if="!paginatedUsers.length">
                <td colspan="6" class="px-4 py-12 text-center">
                  <p class="font-semibold text-[#0A1024]">No users match</p>
                  <p class="mt-1 text-[14px] text-[#64748B]">Try a different search or clear the filters.</p>
                  <button v-if="hasFilters" type="button" class="text-link mt-2 text-[14px]" @click="clearFilters">Clear filters</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <ul class="space-y-3 md:hidden">
          <li v-for="user in paginatedUsers" :key="user.id" class="rounded-2xl border border-[#E2E8F0] bg-white p-4">
            <div class="flex items-start gap-3">
              <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold" :class="user.isActive ? 'bg-[#EAF2FC] text-[#0057C8]' : 'bg-[#F1F5F9] text-[#94A3B8]'" aria-hidden="true">{{ initialOf(user) }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-[#0A1024]">{{ nameOf(user) }} <span v-if="isCurrentUser(user)" class="text-[12px] font-medium text-[#64748B]">(you)</span></p>
                <p class="truncate text-[13px] text-[#64748B]">{{ user.email }}</p>
                <div class="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
                  <span class="rounded-full border px-2 py-0.5 font-semibold" :class="roleBadge(user.role)">{{ user.role === 'ADMIN' ? 'Admin' : 'User' }}</span>
                  <span :class="user.isActive ? 'text-[#047857]' : 'text-[#94A3B8]'">{{ user.isActive ? 'Active' : 'Inactive' }}</span>
                  <span class="text-[#94A3B8]">· Joined {{ shortDate(user.createdAt) }}</span>
                </div>
                <p class="mt-1 text-[12px] text-[#64748B]">{{ activityOf(user) }}</p>
              </div>
            </div>
            <div class="mt-3 flex gap-2">
              <button type="button" class="btn-secondary min-h-10 flex-1 text-[13px]" @click="openEdit(user)">Edit</button>
              <template v-if="!isCurrentUser(user)">
                <button type="button" class="btn-secondary min-h-10 flex-1 text-[13px]" :disabled="busyId === user.id" @click="toggleUserStatus(user)">{{ user.isActive ? 'Deactivate' : 'Activate' }}</button>
                <button type="button" class="inline-flex min-h-10 items-center rounded-xl border border-[#FECACA] px-3 text-[13px] font-semibold text-[#B91C1C]" @click="confirmDelete(user)">Delete</button>
              </template>
            </div>
          </li>
          <li v-if="!paginatedUsers.length" class="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center text-[14px] text-[#64748B]">
            No users match.
            <button v-if="hasFilters" type="button" class="text-link ml-1" @click="clearFilters">Clear filters</button>
          </li>
        </ul>

        <!-- Pagination -->
        <div v-if="filteredUsers.length" class="flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#64748B]">
          <p>Showing {{ paginationInfo.start }}–{{ paginationInfo.end }} of {{ paginationInfo.total }}</p>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2">
              Rows
              <select v-model.number="itemsPerPage" class="form-input w-auto py-1.5 pr-8 text-[14px] sm:text-[13px]">
                <option v-for="size in [10, 25, 50, 100]" :key="size" :value="size">{{ size }}</option>
              </select>
            </label>
            <div class="flex gap-1">
              <button type="button" class="btn-secondary h-9 min-h-9 w-9 px-0" :disabled="currentPage === 1" aria-label="Previous page" @click="currentPage--">
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m12 5-5 5 5 5" /></svg>
              </button>
              <button type="button" class="btn-secondary h-9 min-h-9 w-9 px-0" :disabled="currentPage >= totalPages" aria-label="Next page" @click="currentPage++">
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m8 5 5 5-5 5" /></svg>
              </button>
            </div>
          </div>
        </div>
      </template>

    </div>

    <!-- Dialogs sit outside the space-y list so its margins don't offset the fixed overlays -->
    <!-- Create / edit -->
    <div v-if="formOpen" class="fixed inset-0 z-50 flex items-end justify-center bg-[#0A1024]/55 p-0 sm:items-center sm:p-4" @click.self="closeForm">
      <div class="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
        <div class="flex items-center justify-between border-b border-[#F1F5F9] px-6 py-4">
          <h2 id="user-form-title" class="text-[18px] font-bold text-[#0A1024]">{{ editing ? 'Edit user' : 'Add user' }}</h2>
          <button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9]" aria-label="Close" @click="closeForm">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <form class="space-y-4 px-6 py-5" @submit.prevent="submitForm">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="user-first" class="form-label">First name</label>
              <input id="user-first" ref="firstField" v-model.trim="userForm.firstName" class="form-input" autocomplete="off" />
            </div>
            <div>
              <label for="user-last" class="form-label">Last name</label>
              <input id="user-last" v-model.trim="userForm.lastName" class="form-input" autocomplete="off" />
            </div>
          </div>
          <div>
            <label for="user-username" class="form-label">Username <span class="text-[#B91C1C]" aria-hidden="true">*</span></label>
            <input id="user-username" v-model.trim="userForm.username" required :minlength="editing ? 1 : 3" maxlength="40" class="form-input" autocomplete="off" />
          </div>
          <div>
            <label for="user-email" class="form-label">Email <span class="text-[#B91C1C]" aria-hidden="true">*</span></label>
            <input id="user-email" v-model.trim="userForm.email" type="email" required class="form-input" autocomplete="off" />
          </div>
          <div>
            <label for="user-password" class="form-label">
              {{ editing ? 'New password' : 'Password' }}
              <span v-if="!editing" class="text-[#B91C1C]" aria-hidden="true">*</span>
            </label>
            <div class="relative">
              <input
                id="user-password"
                v-model="userForm.password"
                :type="showPassword ? 'text' : 'password'"
                :required="!editing"
                minlength="8"
                autocomplete="new-password"
                class="form-input pr-16"
                :placeholder="editing ? 'Leave blank to keep the current one' : 'At least 8 characters'"
              />
              <button type="button" class="absolute inset-y-0 right-0 px-3 text-[12px] font-semibold text-[#0057C8]" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button>
            </div>
          </div>

          <fieldset :disabled="editingSelf">
            <legend class="form-label">Role</legend>
            <div class="grid grid-cols-2 gap-2">
              <label
                v-for="option in [{ value: 'USER', title: 'User', text: 'Uses the site and their own account' }, { value: 'ADMIN', title: 'Admin', text: 'Full access to this admin portal' }]"
                :key="option.value"
                class="flex cursor-pointer gap-2.5 rounded-xl border p-3"
                :class="userForm.role === option.value ? 'border-[#0066E4] bg-[#EAF2FC]' : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'"
              >
                <input v-model="userForm.role" type="radio" name="role" :value="option.value" class="mt-0.5 h-4 w-4 accent-[#0066E4]" />
                <span>
                  <span class="block text-[14px] font-semibold text-[#0A1024]">{{ option.title }}</span>
                  <span class="block text-[12px] leading-[18px] text-[#64748B]">{{ option.text }}</span>
                </span>
              </label>
            </div>
            <label class="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] px-3 py-2.5">
              <span>
                <span class="block text-[14px] font-semibold text-[#0A1024]">Active</span>
                <span class="block text-[12px] text-[#64748B]">Inactive accounts can't sign in</span>
              </span>
              <input v-model="userForm.isActive" type="checkbox" class="h-5 w-5 accent-[#0066E4]" />
            </label>
            <p v-if="editingSelf" class="mt-2 text-[12px] text-[#64748B]">You can't change your own role or status. Ask another admin.</p>
          </fieldset>

          <p v-if="formError" class="alert-error" role="alert">{{ formError }}</p>

          <div class="flex gap-2 pt-1">
            <button type="button" class="btn-secondary flex-1" @click="closeForm">Cancel</button>
            <button type="submit" class="btn-primary flex-1" :disabled="saving">{{ saving ? 'Saving…' : editing ? 'Save changes' : 'Add user' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete -->
    <div v-if="userToDelete" class="fixed inset-0 z-50 flex items-end justify-center bg-[#0A1024]/55 p-0 sm:items-center sm:p-4" @click.self="userToDelete = null">
      <div class="w-full rounded-t-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-desc">
        <div class="px-6 pt-6">
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF2F2] text-[#B91C1C]" aria-hidden="true">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
          </span>
          <h2 id="delete-title" class="mt-3 text-[18px] font-bold text-[#0A1024]">Delete {{ nameOf(userToDelete) }}?</h2>
          <div id="delete-desc" class="mt-2 space-y-2 text-[14px] leading-[22px] text-[#475569]">
            <p>This can't be undone. Deleting the account also deletes:</p>
            <ul class="list-disc space-y-0.5 pl-5">
              <li>{{ plural(userToDelete._count?.trips, 'saved trip') }}</li>
              <li>{{ plural(userToDelete._count?.travellers, 'family member') }}</li>
              <li>{{ plural(userToDelete._count?.loyaltyPoints, 'loyalty point record') }} and their referrals</li>
            </ul>
            <p class="text-[13px] text-[#64748B]">To keep the data, deactivate the account instead.</p>
          </div>
          <label for="delete-confirm" class="form-label mt-4">Type <span class="font-mono">{{ userToDelete.username }}</span> to confirm</label>
          <input id="delete-confirm" v-model="deleteConfirmText" class="form-input" autocomplete="off" />
          <p v-if="formError" class="alert-error mt-3" role="alert">{{ formError }}</p>
        </div>
        <div class="flex gap-2 px-6 py-5">
          <button type="button" class="btn-secondary flex-1" @click="userToDelete = null">Cancel</button>
          <button
            type="button"
            class="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#B91C1C] px-4 text-[15px] font-semibold text-white hover:bg-[#991B1B] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="saving || deleteConfirmText.trim() !== userToDelete.username"
            @click="deleteUser"
          >
            {{ saving ? 'Deleting…' : 'Delete account' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuthState } from '~/composables/useAuthState'

definePageMeta({
  layout: 'default',
  middleware: 'admin'
})

interface AdminUser {
  id: string
  username: string
  email: string
  firstName: string | null
  lastName: string | null
  role: 'USER' | 'ADMIN'
  isActive: boolean
  createdAt: string
  updatedAt: string
  provider: string | null
  _count?: { trips: number; travellers: number; loyaltyPoints: number }
}

type TileKey = 'all' | 'active' | 'admins' | 'new'

const { user: currentUser } = useAuthState()

const users = ref<AdminUser[]>([])
const loading = ref(false)
const loaded = ref(false)
const saving = ref(false)
const busyId = ref<string | null>(null)
const pageError = ref('')
const notice = ref('')
const formError = ref('')

const searchQuery = ref('')
const filterRole = ref<'' | 'USER' | 'ADMIN'>('')
const filterStatus = ref<'' | 'true' | 'false'>('')
const filterNew = ref(false)
const sortBy = ref<'newest' | 'oldest' | 'name'>('newest')
const currentPage = ref(1)
const itemsPerPage = ref(25)

const roleOptions = [
  { value: '' as const, label: 'All' },
  { value: 'USER' as const, label: 'Users' },
  { value: 'ADMIN' as const, label: 'Admins' }
]

const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
const isNew = (user: AdminUser) => new Date(user.createdAt).getTime() >= weekAgo

const nameOf = (user: AdminUser) => [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username
const initialOf = (user: AdminUser) => nameOf(user).charAt(0).toUpperCase()
const isCurrentUser = (user: AdminUser) => !!currentUser.value && user.id === currentUser.value.id
const roleBadge = (role: AdminUser['role']) => (role === 'ADMIN' ? 'border-[#CFE0F7] bg-[#EAF2FC] text-[#0057C8]' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]')
const plural = (count = 0, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`
const activityOf = (user: AdminUser) => {
  const counts = user._count
  if (!counts) return '—'
  return [plural(counts.trips, 'trip'), plural(counts.travellers, 'family member')].join(' · ')
}
const shortDate = (value: string) => new Intl.DateTimeFormat('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
const longDate = (value: string) => new Intl.DateTimeFormat('en-SG', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value))

const tiles = computed(() => [
  { key: 'all' as TileKey, label: 'Total users', value: users.value.length, active: !filterRole.value && !filterStatus.value && !filterNew.value },
  { key: 'active' as TileKey, label: 'Active', value: users.value.filter((u) => u.isActive).length, active: filterStatus.value === 'true' && !filterNew.value },
  { key: 'admins' as TileKey, label: 'Admins', value: users.value.filter((u) => u.role === 'ADMIN').length, active: filterRole.value === 'ADMIN' && !filterNew.value },
  { key: 'new' as TileKey, label: 'New in 7 days', value: users.value.filter(isNew).length, active: filterNew.value }
])

const applyTile = (key: TileKey) => {
  filterRole.value = key === 'admins' ? 'ADMIN' : ''
  filterStatus.value = key === 'active' ? 'true' : ''
  filterNew.value = key === 'new'
}

const hasFilters = computed(() => !!(searchQuery.value || filterRole.value || filterStatus.value || filterNew.value))
const clearFilters = () => {
  searchQuery.value = ''
  applyTile('all')
}

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const list = users.value.filter((user) => {
    if (filterRole.value && user.role !== filterRole.value) return false
    if (filterStatus.value && String(user.isActive) !== filterStatus.value) return false
    if (filterNew.value && !isNew(user)) return false
    if (!query) return true
    return [user.username, user.email, user.firstName, user.lastName].some((field) => field?.toLowerCase().includes(query))
  })
  const sorted = [...list]
  if (sortBy.value === 'name') sorted.sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
  else sorted.sort((a, b) => (sortBy.value === 'oldest' ? 1 : -1) * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
  return sorted
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / itemsPerPage.value)))
const paginatedUsers = computed(() => filteredUsers.value.slice((currentPage.value - 1) * itemsPerPage.value, currentPage.value * itemsPerPage.value))
const paginationInfo = computed(() => {
  const total = filteredUsers.value.length
  if (!total) return { start: 0, end: 0, total: 0 }
  return { start: (currentPage.value - 1) * itemsPerPage.value + 1, end: Math.min(currentPage.value * itemsPerPage.value, total), total }
})

const flash = (message: string) => {
  notice.value = message
  pageError.value = ''
  setTimeout(() => {
    if (notice.value === message) notice.value = ''
  }, 5000)
}

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await $api<{ users: AdminUser[] }>('/api/users')
    users.value = response.users
    loaded.value = true
  } catch (err: any) {
    pageError.value = err?.data?.message || 'Could not load users.'
  } finally {
    loading.value = false
  }
}

// Create / edit form
const formOpen = ref(false)
const editing = ref<AdminUser | null>(null)
const showPassword = ref(false)
const firstField = ref<HTMLInputElement | null>(null)
const emptyForm = () => ({ username: '', email: '', password: '', firstName: '', lastName: '', role: 'USER' as AdminUser['role'], isActive: true })
const userForm = ref(emptyForm())
const editingSelf = computed(() => !!editing.value && isCurrentUser(editing.value))

const openForm = () => {
  formError.value = ''
  showPassword.value = false
  formOpen.value = true
  nextTick(() => firstField.value?.focus())
}
const openCreate = () => {
  editing.value = null
  userForm.value = emptyForm()
  openForm()
}
const openEdit = (user: AdminUser) => {
  editing.value = user
  userForm.value = {
    username: user.username,
    email: user.email,
    password: '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    role: user.role,
    isActive: user.isActive
  }
  openForm()
}
const closeForm = () => {
  formOpen.value = false
  editing.value = null
}

const submitForm = async () => {
  saving.value = true
  formError.value = ''
  try {
    const { password, ...rest } = userForm.value
    if (editing.value) {
      await $api(`/api/users/${editing.value.id}`, {
        method: 'PUT',
        body: {
          ...rest,
          firstName: rest.firstName || null,
          lastName: rest.lastName || null,
          ...(editingSelf.value ? { role: undefined, isActive: undefined } : {}),
          ...(password ? { password } : {})
        }
      })
      flash(`Saved ${rest.username}.`)
    } else {
      await $api('/api/admin/users', { method: 'POST', body: { ...rest, password } })
      flash(`Added ${rest.username}.`)
    }
    closeForm()
    await loadUsers()
  } catch (err: any) {
    formError.value = err?.data?.message || 'Could not save the user.'
  } finally {
    saving.value = false
  }
}

const toggleUserStatus = async (user: AdminUser) => {
  busyId.value = user.id
  try {
    // Send only the change, so a stale row can't overwrite other fields
    await $api(`/api/users/${user.id}`, { method: 'PUT', body: { isActive: !user.isActive } })
    flash(`${user.username} is now ${user.isActive ? 'inactive' : 'active'}.`)
    await loadUsers()
  } catch (err: any) {
    pageError.value = err?.data?.message || 'Could not change the status.'
  } finally {
    busyId.value = null
  }
}

// Delete
const userToDelete = ref<AdminUser | null>(null)
const deleteConfirmText = ref('')
const confirmDelete = (user: AdminUser) => {
  formError.value = ''
  deleteConfirmText.value = ''
  userToDelete.value = user
}
const deleteUser = async () => {
  const target = userToDelete.value
  if (!target) return
  saving.value = true
  formError.value = ''
  try {
    await $api(`/api/users/${target.id}`, { method: 'DELETE' })
    userToDelete.value = null
    flash(`Deleted ${target.username}.`)
    await loadUsers()
  } catch (err: any) {
    formError.value = err?.data?.message || 'Could not delete the user.'
  } finally {
    saving.value = false
  }
}

// CSV of the current filtered list
const exportCsv = () => {
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const rows = [
    ['Name', 'Username', 'Email', 'Role', 'Status', 'Sign-in', 'Trips', 'Family members', 'Joined'],
    ...filteredUsers.value.map((user) => [
      nameOf(user),
      user.username,
      user.email,
      user.role,
      user.isActive ? 'Active' : 'Inactive',
      user.provider || 'Password',
      user._count?.trips ?? '',
      user._count?.travellers ?? '',
      user.createdAt.slice(0, 10)
    ])
  ]
  const blob = new Blob([rows.map((row) => row.map(escape).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `gotravelnha-users-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  if (userToDelete.value) userToDelete.value = null
  else if (formOpen.value) closeForm()
}

watch([searchQuery, filterRole, filterStatus, filterNew, sortBy, itemsPerPage], () => {
  currentPage.value = 1
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  loadUsers()
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>
