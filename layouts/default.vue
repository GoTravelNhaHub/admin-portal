<template>
  <div class="min-h-dvh bg-[#F7F9FD] font-brand text-[#334155]">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0A1024] text-white transition-[width,transform] duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'w-64 lg:w-[72px]' : 'w-64'
      ]"
      aria-label="Admin navigation"
    >
      <div class="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-4" :class="collapsed ? 'lg:justify-center lg:px-0' : ''">
        <NuxtLink to="/" class="flex min-w-0 items-center gap-2.5" @click="closeSidebar">
          <Logo :size="'32'" light />
          <span v-show="!collapsed || !isDesktop" class="min-w-0">
            <span class="block truncate text-[15px] font-bold leading-5 tracking-[-0.025em]">GoTravelNha</span>
            <span class="block text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] text-white/50">Admin</span>
          </span>
        </NuxtLink>
      </div>

      <nav class="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        <div v-for="group in navGroups" :key="group.label" class="mb-5 last:mb-0">
          <p
            v-show="!collapsed || !isDesktop"
            class="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40"
          >
            {{ group.label }}
          </p>
          <div v-show="collapsed && isDesktop" class="mx-auto mb-2 h-px w-6 bg-white/10" aria-hidden="true"></div>
          <ul class="space-y-0.5">
            <li v-for="item in group.items" :key="item.to">
              <NuxtLink
                :to="item.to"
                :target="item.external ? '_blank' : undefined"
                :title="collapsed && isDesktop ? item.label : undefined"
                :aria-current="isActive(item) ? 'page' : undefined"
                class="group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7DB4FF]"
                :class="[
                  isActive(item) ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white',
                  collapsed && isDesktop ? 'lg:justify-center lg:px-0' : ''
                ]"
                @click="closeSidebar"
              >
                <span v-if="isActive(item)" class="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#7DB4FF]" aria-hidden="true"></span>
                <svg class="h-5 w-5 shrink-0" :class="isActive(item) ? 'text-[#7DB4FF]' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="item.icon" />
                </svg>
                <span v-show="!collapsed || !isDesktop" class="min-w-0 flex-1 truncate">{{ item.label }}</span>
                <span
                  v-if="item.badge && counts[item.badge]"
                  class="inline-flex min-w-5 items-center justify-center rounded-full bg-[#F97316] px-1.5 text-[11px] font-bold leading-5 text-white"
                  :class="collapsed && isDesktop ? 'absolute right-1.5 top-1 min-w-4 px-1 text-[10px] leading-4' : ''"
                  :aria-label="`${counts[item.badge]} waiting`"
                >
                  {{ counts[item.badge] > 99 ? '99+' : counts[item.badge] }}
                </span>
                <svg v-if="item.external && (!collapsed || !isDesktop)" class="h-3.5 w-3.5 shrink-0 text-white/40" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5v8A1.5 1.5 0 0 0 5.5 16h8a1.5 1.5 0 0 0 1.5-1.5V12M11 4h5m0 0v5m0-5L9 11" />
                </svg>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>

      <div class="hidden shrink-0 border-t border-white/10 p-3 lg:block">
        <button
          type="button"
          class="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-white/60 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7DB4FF]"
          :class="collapsed ? 'justify-center px-0' : ''"
          :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="toggleCollapsed"
        >
          <svg class="h-5 w-5 shrink-0 transition-transform" :class="collapsed ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          <span v-show="!collapsed">Collapse</span>
        </button>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="fixed inset-0 z-30 bg-[#0A1024]/50 backdrop-blur-sm lg:hidden" aria-hidden="true" @click="sidebarOpen = false"></div>

    <!-- Top bar -->
    <header
      class="fixed inset-x-0 top-0 z-20 h-16 border-b border-[#E2E8F0] bg-white/95 backdrop-blur transition-[padding] duration-200"
      :class="collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'"
    >
      <div class="flex h-full items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#334155] hover:bg-[#F1F5F9] lg:hidden"
          aria-label="Open navigation"
          @click="sidebarOpen = true"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div class="min-w-0 flex-1">
          <p v-if="current.group" class="hidden text-[12px] font-medium leading-4 text-[#94A3B8] sm:block">{{ current.group }}</p>
          <h1 class="truncate text-[17px] font-bold leading-6 tracking-[-0.02em] text-[#0A1024]">{{ current.title }}</h1>
        </div>

        <NuxtLink
          :to="siteUrl('/')"
          target="_blank"
          class="hidden min-h-10 items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 text-[13px] font-semibold text-[#0A1024] hover:bg-[#F8FAFC] sm:inline-flex"
        >
          View site
          <svg class="h-3.5 w-3.5 text-[#64748B]" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5v8A1.5 1.5 0 0 0 5.5 16h8a1.5 1.5 0 0 0 1.5-1.5V12M11 4h5m0 0v5m0-5L9 11" />
          </svg>
        </NuxtLink>

        <div ref="menuEl" class="relative">
          <button
            type="button"
            class="flex h-10 items-center gap-2 rounded-lg px-1.5 hover:bg-[#F1F5F9] sm:px-2"
            :aria-expanded="userMenuOpen"
            aria-haspopup="menu"
            @click="userMenuOpen = !userMenuOpen"
          >
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#0066E4] text-[13px] font-bold text-white">{{ initial }}</span>
            <span class="hidden text-left sm:block">
              <span class="block max-w-[10rem] truncate text-[13px] font-semibold leading-4 text-[#0A1024]">{{ displayName }}</span>
              <span class="block text-[11px] leading-4 text-[#64748B]">Administrator</span>
            </span>
            <svg class="hidden h-4 w-4 text-[#94A3B8] sm:block" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m6 8 4 4 4-4" />
            </svg>
          </button>
          <div
            v-if="userMenuOpen"
            role="menu"
            class="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white py-1 shadow-[0_16px_40px_-16px_rgba(10,16,36,0.35)]"
          >
            <p v-if="user?.email" class="truncate border-b border-[#F1F5F9] px-4 py-2.5 text-[12px] text-[#64748B]">{{ user.email }}</p>
            <NuxtLink :to="siteUrl('/user')" role="menuitem" class="block px-4 py-2.5 text-[14px] text-[#334155] hover:bg-[#F8FAFC]" @click="userMenuOpen = false">My profile</NuxtLink>
            <NuxtLink :to="siteUrl('/')" target="_blank" role="menuitem" class="block px-4 py-2.5 text-[14px] text-[#334155] hover:bg-[#F8FAFC] sm:hidden" @click="userMenuOpen = false">View site</NuxtLink>
            <button type="button" role="menuitem" class="block w-full px-4 py-2.5 text-left text-[14px] text-[#B91C1C] hover:bg-[#FEF2F2]" @click="logout">Log out</button>
          </div>
        </div>
      </div>
    </header>

    <!-- Page -->
    <div class="pt-16 transition-[padding] duration-200" :class="collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'">
      <main class="min-h-[calc(100dvh-4rem)]">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthState } from '~/composables/useAuthState'
import Logo from '~/components/Logo.vue'

type BadgeKey = 'support'

interface NavItem {
  to: string
  label: string
  icon: string
  /** Also active on child routes */
  prefix?: boolean
  badge?: BadgeKey
  external?: boolean
}

const ICONS = {
  dashboard: 'M4 5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm9 0a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V5Zm0 8a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-6Zm-9 3a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3Z',
  support: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5l-4 3v-3H6a2 2 0 0 1-2-2V6Z',
  users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13 9v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
  analytics: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  affiliate: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  economics: 'M12 3v18M16.5 7.5c-.6-1.2-2.2-2-4.5-2-2.8 0-4.5 1.3-4.5 3s1.7 2.6 4.5 3 4.5 1.3 4.5 3-1.7 3-4.5 3c-2.3 0-3.9-.8-4.5-2',
  templates: 'M4 5h16v4H4V5Zm0 8h7v6H4v-6Zm11 0h5v6h-5v-6Z',
  site: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z',
  planner: 'M12 3l1.9 4.8L19 9.5l-4.4 2.9L15.6 18 12 15l-3.6 3 1-5.6L5 9.5l5.1-1.7L12 3Z',
  videos: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm6 3v6l5-3-5-3Z'
}

/** Page on the public site (www) */
function siteUrl(path: string) {
  return `${String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')}${path}`
}

// Grouped by the job the admin is doing, most frequent first
const navGroups: Array<{ label: string; items: NavItem[] }> = [
  { label: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: ICONS.dashboard }] },
  {
    label: 'Operations',
    items: [
      { to: '/support', label: 'Support inbox', icon: ICONS.support, badge: 'support' },
      { to: '/users', label: 'Users', icon: ICONS.users }
    ]
  },
  {
    label: 'Growth',
    items: [
      { to: '/analytics', label: 'Analytics', icon: ICONS.analytics },
      { to: '/affiliate-performance', label: 'Affiliate performance', icon: ICONS.affiliate },
      { to: '/unit-economics', label: 'Unit economics', icon: ICONS.economics }
    ]
  },
  {
    label: 'Content',
    items: [
      { to: '/deal-template-generator', label: 'Deal templates', icon: ICONS.templates },
      { to: '/deal-slots', label: 'Deal slots', icon: ICONS.templates },
      { to: '/klook-offers', label: 'Klook offers', icon: ICONS.affiliate },
      { to: '/videos', label: 'Videos', icon: ICONS.videos },
      { to: '/community', label: 'Community moderation', icon: ICONS.support }
    ]
  },
  {
    label: 'Site',
    items: [
      { to: siteUrl('/explore'), label: 'Explore', icon: ICONS.site, external: true },
      { to: siteUrl('/planner'), label: 'AI Travel Agent', icon: ICONS.planner, external: true }
    ]
  }
]

const route = useRoute()
const { user, clearUser } = useAuthState()

const sidebarOpen = ref(false)
const collapsed = ref(false)
const isDesktop = ref(false)
const userMenuOpen = ref(false)
const menuEl = ref<HTMLElement | null>(null)
const counts = ref<Record<BadgeKey, number>>({ support: 0 })

const normalisedPath = computed(() => route.path.replace(/\/+$/, '') || '/')

const isActive = (item: NavItem) => {
  const path = normalisedPath.value
  if (item.to === '/') return path === '/'
  return path === item.to || path.startsWith(`${item.to}/`)
}

const current = computed(() => {
  for (const group of navGroups) {
    const item = group.items.find(isActive)
    if (item) return { title: item.label, group: group.label === 'Overview' ? '' : group.label }
  }
  return { title: 'Admin', group: '' }
})

const displayName = computed(() => {
  const value = user.value as { firstName?: string; lastName?: string; username?: string } | null
  if (!value) return 'Admin'
  return [value.firstName, value.lastName].filter(Boolean).join(' ') || value.username || 'Admin'
})
const initial = computed(() => displayName.value.charAt(0).toUpperCase())

const closeSidebar = () => {
  if (!isDesktop.value) sidebarOpen.value = false
}

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
  localStorage.setItem('adminSidebarCollapsed', String(collapsed.value))
}

const logout = () => {
  userMenuOpen.value = false
  // Ends the API and Keycloak sessions, then lands on the public site
  clearUser(siteUrl('/'))
}

// Badge counts come from the dashboard stats; refreshed on navigation so they stay current
const loadCounts = async () => {
  try {
    const res = await $api<{ data?: { attention?: { support?: number } } }>('/api/admin/dashboard/stats')
    counts.value = {
      support: Number(res?.data?.attention?.support || 0)
    }
  } catch {
    // Badges are a convenience; the pages show the real lists
  }
}

const checkScreen = () => {
  isDesktop.value = window.innerWidth >= 1024
  if (isDesktop.value) sidebarOpen.value = false
}

const onDocumentClick = (event: MouseEvent) => {
  if (userMenuOpen.value && menuEl.value && !menuEl.value.contains(event.target as Node)) userMenuOpen.value = false
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    userMenuOpen.value = false
    sidebarOpen.value = false
  }
}

onMounted(() => {
  checkScreen()
  collapsed.value = localStorage.getItem('adminSidebarCollapsed') === 'true'
  window.addEventListener('resize', checkScreen)
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
  loadCounts()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScreen)
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})

watch(
  () => route.path,
  () => {
    sidebarOpen.value = false
    userMenuOpen.value = false
    loadCounts()
  }
)
</script>
