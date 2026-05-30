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

# WhatsApp Checkout MVP
- [ ] Step W1: Add SQL migration for vendors + products.vendor_id + orders fields needed for WhatsApp (no vendor phone in frontend)
- [ ] Step W2: Add `src/lib/whatsapp.ts` helper to sanitize vendor phone and build wa.me URL
- [ ] Step W3: Add `src/app/api/orders/route.ts` (rate-limited) to:
  - [ ] validate cart payload
  - [ ] fetch product->vendor_id
  - [ ] reject multi-vendor with “Your cart contains items from different boutiques. Please place separate orders.”
  - [ ] create order server-side and return order-confirmation redirect url (no WhatsApp number exposed)
- [ ] Step W4: Add `src/app/order-confirmation/page.tsx` to show message + auto-redirect with fallback link
- [ ] Step W5: Update `src/components/CheckoutModal.tsx` UI:
  - [ ] WhatsApp payment option card (green styling)
  - [ ] hide/disable WhatsApp when vendor_id/whatsapp missing (via server eligibility error)
  - [ ] loading spinner on “Place Order” button while creating order
  - [ ] handle multi-vendor error
- [ ] Step W6: Run `npm run lint` and `npm run build`

