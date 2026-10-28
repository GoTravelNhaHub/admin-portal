// admin.gotravelnha.com: the back office. Client-rendered; every call goes to the API
// (api.gotravelnha.com) with the shared session cookie, and sign-in is Keycloak (auth.gotravelnha.com).
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  // Nothing here is public or indexable, and the data is per-admin, so skip SSR
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],
  css: ['@/assets/css/tailwind.css'],
  app: {
    head: {
      title: 'GoTravelNha Admin',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex, nofollow' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      /** Backend origin (api.gotravelnha.com), no trailing slash */
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://api.gotravelnha.com',
      /** Public site (www), for "View site", profile links and previews */
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.gotravelnha.com',
      TRIP_ALLIANCE_ID: process.env.TRIP_ALLIANCE_ID || '3883416',
      TRIP_SID: process.env.TRIP_SID || '22874365',
      KLOOK_AD_ID: process.env.KLOOK_AD_ID || '1041352'
    }
  }
})
