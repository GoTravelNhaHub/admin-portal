// Every admin page. The API decides: /api/auth/me reads the shared session cookie (set after a
// Keycloak login at auth.gotravelnha.com). Not signed in → Keycloak, then back to this page.
// Signed in without the admin role → the profile page on the public site.
// The API checks admin access again on every /api/admin call; this only gates the UI.
let adminSessionVerified = false

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server || adminSessionVerified) return

  const { refreshUser } = useAuthState()
  const user = await refreshUser()

  if (!user) {
    return navigateTo(loginUrl(`${window.location.origin}${to.fullPath}`), { external: true })
  }
  if (user.role !== 'ADMIN') {
    return navigateTo(`${String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')}/user`, { external: true })
  }
  adminSessionVerified = true
})
