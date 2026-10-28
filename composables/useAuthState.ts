import { ref, computed } from 'vue'

// Global auth state. The source of truth is the API session (cookie on .gotravelnha.com, set
// after a Keycloak login at auth.gotravelnha.com). localStorage `gotravelnha_user` is a cache so
// the header renders signed-in straight away; plugins/auth-sync.client.ts re-checks it with
// /api/auth/me on every page load.
const user = ref<any>(null)

// Load user from localStorage on module init
if (process.client) {
  const storedUser = localStorage.getItem('gotravelnha_user')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch (e) {
      console.error('Failed to parse stored user:', e)
      localStorage.removeItem('gotravelnha_user')
    }
  }
}

export const useAuthState = () => {
  const setUser = (userData: any) => {
    user.value = userData
    // Persist to localStorage
    if (process.client) {
      localStorage.setItem('gotravelnha_user', JSON.stringify(userData))
    }
  }

  const forgetUser = () => {
    user.value = null
    if (process.client) localStorage.removeItem('gotravelnha_user')
  }

  /** Re-reads the signed-in user from the API. Returns it, or null when signed out. */
  const refreshUser = async () => {
    try {
      const response = await $api<{ user: any }>('/api/auth/me')
      setUser(response.user)
      return response.user
    } catch (error: any) {
      // Only a definite "not signed in" clears the cache; a network blip keeps it
      if (error?.statusCode === 401 || error?.status === 401) forgetUser()
      return null
    }
  }

  /** Signs out of GoTravelNha and Keycloak, then returns to `returnTo` (default: home). */
  const clearUser = (returnTo = '/') => {
    forgetUser()
    if (process.client) window.location.href = logoutUrl(returnTo)
  }

  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isUser = computed(() => user.value?.role === 'USER')

  return {
    user,
    setUser,
    refreshUser,
    clearUser,
    isAuthenticated,
    isAdmin,
    isUser
  }
}
