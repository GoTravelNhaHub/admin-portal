import type { FetchOptions } from 'ofetch'

/**
 * `$fetch` for the backend at api.gotravelnha.com (`runtimeConfig.public.apiBase`). Paths stay `/api/...`.
 * Sends the shared `.gotravelnha.com` session cookie, and during SSR forwards the visitor's cookie.
 * Returns `any` unless typed: the site no longer sees the API's route types.
 */
export function $api<T = any>(request: string, options: FetchOptions<any> = {}): Promise<T> {
  const nuxtApp = tryUseNuxtApp()
  const apiBase = (nuxtApp?.$config ?? useRuntimeConfig()).public.apiBase as string
  const headers = new Headers(options.headers as HeadersInit | undefined)
  if (import.meta.server) {
    const cookie = nuxtApp?.ssrContext?.event.node.req.headers.cookie
    if (cookie && !headers.has('cookie')) headers.set('cookie', cookie)
  }
  return $fetch<T>(request, { ...options, headers, baseURL: apiBase, credentials: 'include' } as any) as Promise<T>
}

/** Absolute API URL, for sendBeacon, keepalive fetch and links. */
export function apiUrl(path: string) {
  const apiBase = String(useRuntimeConfig().public.apiBase).replace(/\/$/, '')
  return `${apiBase}${path}`
}

/** Keycloak sign-in through the API. `returnTo` is a path on this site or a full www/admin URL. */
export function loginUrl(returnTo = '/', extra: { register?: boolean; ref?: string } = {}) {
  const config = useRuntimeConfig().public
  const siteOrigin = import.meta.client ? window.location.origin : String(config.siteUrl).replace(/\/$/, '')
  const params = new URLSearchParams({ redirect: returnTo.startsWith('http') ? returnTo : `${siteOrigin}${returnTo}` })
  if (extra.register) params.set('register', '1')
  if (extra.ref) params.set('ref', extra.ref)
  if (import.meta.client) {
    try {
      const lang = localStorage.getItem('gotravelnha_lang')
      if (lang) params.set('locale', lang)
    } catch {
      // storage blocked: Keycloak falls back to the browser language
    }
  }
  return apiUrl(`/auth/login?${params}`)
}

/** Ends the API session and the Keycloak SSO session, then comes back to `returnTo`. */
export function logoutUrl(returnTo = '/') {
  const siteOrigin = import.meta.client ? window.location.origin : String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
  return apiUrl(`/auth/logout?${new URLSearchParams({ redirect: returnTo.startsWith('http') ? returnTo : `${siteOrigin}${returnTo}` })}`)
}
