# Sniper Trade Journal

## Current State

The app has 5 sections: Dashboard, Journal, New Trade, Calendar, and Brutal Review. The backend (main.mo) handles trade CRUD with stable storage, screenshot uploads via blob-storage, and authorization. The frontend uses AppLayout.tsx with a typed `AppPage` union and NAV_ITEMS array for navigation.

## Requested Changes (Diff)

### Add
- New `AppPage` type values: `"mastery"`, `"mastery-new-drill"`, `"mastery-journal"`
- New nav item: "Mastery" with Sword/Dumbbell icon in NAV_ITEMS
- Backend: `Drill` and `DrillInput` types and stable storage map
- Backend functions: `createDrill`, `updateDrill`, `deleteDrill`, `getDrills`, `getDrillById`
- Frontend pages:
  - `MasteryPage.tsx` — dashboard showing total drills, most practiced skill, recent drills, screenshot gallery, skill-type breakdown chart
  - `NewDrillPage.tsx` — form with Date, Symbol, Timeframe, Drill Type dropdown (6 options), five analysis text areas (Structure Notes, Liquidity Observations, Inducement Notes, Market Shift Observations, Entry Analysis), screenshot upload; Save Drill + Save & Add Another buttons with validation
  - `DrillJournalPage.tsx` — list of all drills with Date, Symbol, Drill Type, screenshot thumbnail, short notes; click to open full detail modal; edit and delete actions
- Screenshot stored via ExternalBlob (existing blob-storage), URL saved with drill entry; renders as `<img>` preview with lightbox modal in journal

### Modify
- `AppLayout.tsx`: add "mastery" to `AppPage` type and NAV_ITEMS
- `App.tsx`: import and render the three new pages based on `currentPage`
- `backend.d.ts`: add `Drill`, `DrillInput` types and the five drill backend methods

### Remove
- Nothing removed

## Implementation Plan

1. Extend `main.mo` with `Drill` type, `DrillInput` type, stable `drills` map, and CRUD functions (`createDrill`, `updateDrill`, `deleteDrill`, `getDrills`, `getDrillById`)
2. Update `AppLayout.tsx`: add `"mastery"` to the `AppPage` type union and add the Mastery nav item (use `Sword` icon from lucide-react)
3. Create `MasteryPage.tsx` with stat cards, skill breakdown, recent drills list, and screenshot gallery
4. Create `NewDrillPage.tsx` with the full drill form, validation, and ExternalBlob screenshot upload
5. Create `DrillJournalPage.tsx` with drill cards (thumbnail, type, date, notes), detail modal, edit navigation, delete with confirm
6. Update `App.tsx` to import and route to the three new pages
7. Validate with typecheck and build
