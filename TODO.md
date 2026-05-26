# TODO

- [ ] Update `src/lib/supabase-server.ts` to avoid creating a Supabase client at module-evaluation time when `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing.
- [ ] Update admin API routes (start with `src/app/api/admin/promotions/route.ts`) to return a clean JSON error (503) when service-role env vars are missing, instead of throwing.
- [x] Update remaining admin home-deals routes to match the same behavior.
- [ ] Re-test the failing endpoint `/admin/home` and POST `/api/admin/promotions` to confirm the 500/module-evaluation crash is gone.



