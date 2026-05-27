# Task Tracking

- [x] Step 1: Locate any raw frontend `/rest/v1/...` fetches causing 404s
- [x] Step 2: Confirm schema mismatch vs required columns (promotions + home_deals)
- [x] Step 3: Update `database_schema.sql` to exactly match required schemas + RLS public SELECT and admin INSERT policies
- [ ] Step 4: Harden admin API routes with try/catch + server-side logging; avoid leaking secrets
- [ ] Step 5: Refactor `src/components/PromoCarousel.tsx` to load slides from both `home_deals` and `promotions` ordered by priority; add fallback slide on empty/error
- [ ] Step 6: Ensure carousel frosted text panel extends existing drape overlay (layering/z-index) and CTA always stands out
- [ ] Step 7: Strengthen auth dropdown: sync with Supabase auth state (`onAuthStateChange`), ensure username fallback works, ARIA + outside click/escape
- [ ] Step 8: Remove any standalone “Profile” link from navbar entirely (keep only dropdown)
- [ ] Step 9: Verify manually:

  - [ ] GET promotions returns 200 (empty array ok)
  - [ ] POST admin promotion inserts correctly
  - [ ] Homepage carousel loads or fallback shows
  - [ ] Login shows “Hi {username}”, dropdown works, Logout clears session and reverts
  - [ ] Admin submission appears in carousel after refresh
- [ ] Step 10: Run `npm run lint` and `npm run build`

