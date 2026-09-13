# Implementation Plan: Date Range (Weekly/Monthly) Campaign Bookings

Support booking campaign slots across a range of days (a week or a month) starting from a selected calendar date. The system will calculate correct end dates, adjust pricing multipliers, and spawn individual daily schedule entries on the database to fit the player's day-by-day polling model.

## Proposed Changes

### Frontend Components

#### [MODIFY] [LaunchCampaign.tsx](file:///Users/sharmilakonapala/Desktop/projects/led/ledscreens/frontend/src/pages/LaunchCampaign.tsx)
- Add state `bookingDuration: 'day' | 'week' | 'month'`, defaulting to `'day'`.
- Add state `isFullScreenPreviewOpen: boolean = false` for the full-screen simulation modal.
- Calculate `endDate` and `daysCount` reactively using `useMemo` based on `startDate` and `bookingDuration` using timezone-safe local date math:
  - `'day'`: `endDate = startDate`, `daysCount = 1`.
  - `'week'`: `endDate = startDate + 6 days` (e.g., June 15 Monday to June 21 Sunday), `daysCount = 7`.
  - `'month'`: `endDate = startDate + 1 month` (e.g., June 14 to July 14), `daysCount = 30` or `31` depending on calendar month length.
- Update the **Campaign Date** quick presets row in Step 3 to include:
  - `TODAY`: sets `startDate = today`, `bookingDuration = 'day'`.
  - `TOMORROW`: sets `startDate = tomorrow`, `bookingDuration = 'day'`.
  - `THIS WEEKEND`: sets `startDate = weekend`, `bookingDuration = 'day'`.
  - `NEXT WEEK`: sets `bookingDuration = 'week'`, opens calendar modal to select custom start date.
  - `NEXT MONTH`: sets `bookingDuration = 'month'`, opens calendar modal to select custom start date.
  - `CUSTOM...`: sets `bookingDuration = 'day'`, opens calendar modal to select custom start date.
- Update **Target Traffic Time Range** presets to include a new **Custom Time** preset button:
  - When selected, shows input fields for **Start Time** and **End Time**.
  - Add validation checking that `startTime < endTime` in the custom selection.
- Update the **isDurationValid** check to ensure start and end times are chronologically valid.
- Update the sticky campaign preview column:
  - Pass the date range (`startDate` to `endDate` or `startDate` if single day) and time slot inside the **Scope Summary Details** block.
  - Display the watermark pricing choices scaled by `daysCount`.
  - **CRITICAL AESTHETICS/VISIBILITY**: Hide the "Total Budget" and "Watermark Selector" pricing components in the sticky column when `step < 3`. Only show them in Step 3, 4, and 5 once the loop duration (seconds) and booking period are selected.
  - Add a **Maximize/Fullscreen** button to the Live Campaign Preview panel.
- Implement the **Full Screen Preview Modal**:
  - Centers a high-fidelity, scaled-up billboard mockup.
  - Provides controls for theme toggle (Day/Night), rotation, close action, and filter applications in a modern layout.
- Pass `endDate` to the `checkAvailability` loop in `handleContinueToStep4`.
- Pass `endDate` to the `createCampaignBooking` API payload.

#### [MODIFY] [PremiumCalendar.tsx](file:///Users/sharmilakonapala/Desktop/projects/led/ledscreens/frontend/src/components/PremiumCalendar.tsx)
- Accept optional `endDate?: string` prop.
- Render all date cells between `selectedDate` and `endDate` (inclusive) in a light-purple range style (`bg-indigo-50 border border-indigo-200 text-indigo-900`) while styling the starting selection in solid purple (`bg-[#6C47FF] text-white`).

#### [MODIFY] [useCorridorPricing.ts](file:///Users/sharmilakonapala/Desktop/projects/led/ledscreens/frontend/src/hooks/useCorridorPricing.ts)
- Add optional `daysCount: number = 1` parameter.
- Scale `localQuote.totalAmount` and breakdown subtotals by `daysCount`.
- Pass `daysCount` in the POST request body of `/schedule/calculate-total` in `refreshQuote`.

#### [MODIFY] [campaignService.ts](file:///Users/sharmilakonapala/Desktop/projects/led/ledscreens/frontend/src/services/campaignService.ts)
- Allow optional `endDate?: string` parameter in `checkAvailability` and `createCampaignBooking` API wrappers.

---

### Backend Endpoints

#### [MODIFY] [schedules.js](file:///Users/sharmilakonapala/Desktop/projects/led/ledscreens/backend/routes/schedules.js)
- Define `getDatesInRange(startDateStr, endDateStr)` helper to get all intermediate date strings (inclusive, timezone-safe).
- Update `/check-availability` route:
  - Accept optional `endDate`.
  - Check availability for *every day* in the range.
  - Return a conflict response indicating the specific date if an overlap occurs on any day.
- Update `/calculate-total` route:
  - Accept optional `daysCount` in request body.
  - Scale total amount and breakdown subtotals by `daysCount`.
- Update `/campaign` route:
  - Accept optional `endDate` in request body.
  - Run availability checks for all dates in the range.
  - Loop through each date and insert separate `Schedule` documents, all sharing the same `bookingGroupId` and using total budget pricing.

---

### Admin UI Components

#### [MODIFY] [Approvals.tsx](file:///Users/sharmilakonapala/Desktop/projects/led/ledscreens/frontend/src/pages/admin/Approvals.tsx)
- Update `groupSchedules`:
  - Initialize `groups[key].dates = []`.
  - Collect unique dates in each group.
  - Filter `groups[key].screens` to keep only unique screens.
- In `RequestCard`:
  - Calculate `dateDisplay`: if `dates.length > 1`, show range `dates[0] to dates[dates.length - 1]`, else show single `date`.
  - Pass the first date to `CountdownTimer` for upcoming, and the last date for active remaining time calculations.

## Verification Plan

### Automated Tests
- Build verification: `npx tsc --noEmit` inside frontend folder to ensure TypeScript compilations succeed.

### Manual Verification
- Click `NEXT WEEK` preset button:
  - Verify that the calendar modal opens.
  - Select June 23 (Tuesday) and check that June 23 to June 29 are highlighted in purple.
  - Confirm date, and verify that the UI displays range: "June 23 to June 29" (7 days).
- Select the `Custom Time` preset under target traffic time:
  - Select start/end times manually (e.g. 10:00 to 15:00) and verify that the booking works.
- Click the Maximize button on the Live Preview:
  - Verify that a gorgeous full-screen modal opens with a centered, scaled-up street mockup.
