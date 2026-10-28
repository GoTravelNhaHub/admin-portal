# admin/ — GoTravelNha back office (admin.gotravelnha.com)

Nuxt `^3.17`, client-rendered (`ssr: false`), Tailwind. Split out of `../web` (`pages/admin/`) on 2026-10-27. Routes dropped the `/admin` prefix: `/users`, `/support`, `/deal-slots`, `/klook-offers`, ... (AttractionsSG, bookings and scraper pages were removed on 2026-10-27).

```bash
npm run dev          # :3001; needs ../backend on :3002
npm run build
npm run typecheck
```

- Data: `$api('/api/admin/...')` (`composables/useApi.ts`) → `NUXT_PUBLIC_API_BASE` with the shared session cookie. There is no server code here.
- Access: `middleware/admin.ts` asks `/api/auth/me`; signed out → Keycloak login through the API, non-admin → the public site's `/user`. The API enforces admin on every `/api/admin` call.
- Links to the public site use `runtimeConfig.public.siteUrl`.
- `components/Logo.vue`, `composables/useAuthState.ts`, `composables/useApi.ts`, `utils/*` (affiliate-links, partner-url), `types/*`, `tailwind.config.js` and `assets/css/tailwind.css` are copies from `../web`. Keep them in sync by hand.
