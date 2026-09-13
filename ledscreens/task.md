# Task Checklist: Date Range (Weekly/Monthly) Campaign Bookings

- [x] Modify `frontend/src/components/PremiumCalendar.tsx` to accept and render date ranges in purple.
- [x] Modify `frontend/src/services/campaignService.ts` to allow optional `endDate` parameters.
- [x] Modify `frontend/src/hooks/useCorridorPricing.ts` to support scaling pricing by `daysCount`.
- [x] Modify `frontend/src/pages/LaunchCampaign.tsx` to handle:
  - Date preset button handlers (opening modal for Next Week/Next Month presets).
  - Custom Time preset selector and time validations.
  - Pricing visibility rules (hide when `step < 3`).
  - Maximized Full Screen Live Preview overlay.
  - Date range math and payload passing.
- [x] Modify `backend/routes/schedules.js` to handle:
  - `getDatesInRange` utility.
  - Multi-day check availability.
  - Multi-day total cost calculations.
  - Multi-day scheduling loop inserts.
- [x] Modify `frontend/src/pages/admin/Approvals.tsx` to aggregate dates and display ranges.
- [x] Verify frontend build cleanly with `npx tsc --noEmit` and confirm functionality.
