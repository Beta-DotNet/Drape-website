# TODO - Convert Tracking demo to production realtime

## Plan summary
- Remove remaining client-side mock/simulated driver motion from `src/app/tracking/page.tsx`.
- Replace with robust Supabase-backed realtime flow:
  - Initial fetch: order + existing delivery location.
  - Realtime subscriptions: driver_location + status_changed broadcasts.
  - Connection state + retry/backoff if subscription fails.
  - Keep UI/UX unchanged.

## Steps
1. Inspect `src/app/tracking/page.tsx` and `src/components/DeliveryMap.tsx` for mock/sim usage.
2. Update `src/app/tracking/page.tsx` to:
   - Keep same UI and state variables.
   - Delete `MOCK_DRIVER_START`, customer fallback simulation interval, and 'Demo simulation' logic.
   - Add initial fetch for `deliveries` row (current_lat/current_lng/last_updated/eta if available).
   - Add connection handling based on channel subscription lifecycle.
3. Ensure realtime subscription payload typings match actual broadcast sends in rider console (`src/app/admin/delivery/page.tsx`).
4. Add network/timeout safeguards around initial fetch.
5. Add stale-data handling:
   - If last_updated older than threshold, show last known location but mark connected state accordingly.
6. Run `npm run lint` and `npm run build` to ensure no TS/ESLint errors.

