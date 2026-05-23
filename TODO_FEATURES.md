# Drape Feature Build Plan (1-by-1)

## Phase 1 — Multilingual Search with Real-Time Suggestions (Supabase-backed)
- [ ] Align debounce to 300ms (currently 200ms).
- [ ] Replace local STATIC `DEFAULT_PRODUCTS` suggestions with Supabase full-text search (multilingual-friendly).
- [ ] Implement query expansion for Shona→English using `shona_dictionary` (already exists in DB) plus fallback.
- [ ] Add a DB function or view to power suggestions (names, images, prices) efficiently.
- [ ] Ensure mobile-first suggestion dropdown (tap targets, max height, accessibility).
- [ ] Add Realtime: suggestions refresh as products update (optional if using db search; still ensure clients stay consistent).

## Phase 2 — EcoCash Payment Integration (fully functional)
- [ ] Add Supabase `payments` + `payment_events` tables + RLS.
- [ ] Create Edge Function /api/ecocash/initiate to send push request.
- [ ] Create webhook endpoint to confirm payment and update order status to `Confirmed`.
- [ ] Add payment status screen + polling/Realtime updates + timeout handling.
- [ ] Implement PCI best practices: never store secrets or full credentials.

## Phase 3 — Uber-Style Delivery System (end-to-end)
- [ ] Create delivery stages enum mapping and enforce state transitions.
- [ ] Add proof-of-delivery fields + storage bucket rules.
- [ ] Admin/Agent panel: accept/assign deliveries, update stages, upload proof.
- [ ] Customer tracking page: map + ETA + realtime status + notifications.
- [ ] Add agent GPS push loop and secure RLS policies.

## Phase 4 — Customer Reviews (ratings, images, moderation)
- [ ] After order delivered, show review form tied to order+product.
- [ ] Store images in Supabase Storage; keep only Storage paths.
- [ ] Display average rating + reviews with images on product detail.
- [ ] Moderation flow: admin report/hide review.

## Phase 5 — Real-Time Database Updates After Purchase (atomic)
- [ ] Create Postgres function/trigger to decrement stock + mark order confirmed in one transaction.
- [ ] Add atomic inventory logic + sales reporting updates.
- [ ] Ensure triggers emit Realtime changes.

## Phase 6 — In-App Chat (real-time, authorized, image upload)
- [ ] Define chat room model keyed by order_id/product_id.
- [ ] Enforce RLS: only customer + supplier can read/write.
- [ ] Implement message statuses (sent/delivered/read) in DB.
- [ ] Implement typing indicators with presence/broadcast.
- [ ] Upload attachments to Supabase Storage; store URLs; never base64 in DB.
- [ ] Supplier inbox: filter by unread, order context, conversation search.

