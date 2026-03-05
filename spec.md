# Sniper Trade Journal

## Current State

- Full-stack trading journal app with Motoko backend + React frontend
- Authentication via Internet Identity (ICP)
- Authorization component already integrated (`authorization/access-control`, `MixinAuthorization`)
- Backend already has `isCallerAdmin()` and `assignCallerUserRole()` methods
- Data: `trades` and `drills` maps stored in stable memory, keyed by generated UUID
- `getUserProfile()` already allows admin to read any user's profile
- `getTradeById()` already allows admin to read individual trades
- No admin-specific aggregate query endpoints exist yet
- Frontend pages: Dashboard, Journal, New Trade, Calendar, Brutal Review, Mastery, Drill Journal, New Drill, Sign In
- `AppPage` type and `NAV_ITEMS` are defined in `AppLayout.tsx`
- Nav is visible to all authenticated users with no role-based filtering

## Requested Changes (Diff)

### Add

**Backend:**
- `adminGetAllUsers()` — returns list of all principals who have trades, with aggregate stats per user (totalTrades, wins, losses, winRate, avgRR, avgRMultiple, totalNetR, mostRecentTradeDate)
- `adminGetUserTrades(user: Principal)` — returns all trades for a specific user, admin-only
- `adminGetUserStats(user: Principal)` — returns analytics object for a specific user, admin-only
- `adminGetPlatformStats()` — returns platform-wide overview: totalUsers, totalTrades, avgWinRate, mostActiveUser

**Frontend pages:**
- `AdminPage.tsx` — admin panel root with sub-view state (overview | leaderboard | user-detail)
  - Overview tab: stat cards (total users, total trades, avg win rate, most active trader) + recent activity list
  - Leaderboard tab: sortable table with Rank, Username (truncated Principal), Total Trades, Win Rate, Avg R-Multiple, Net R, Most Recent Trade — sorted by Net R desc by default
  - User detail view: profile header (principal, join date, total trades, avg RR, win rate, net R) + read-only trade table with screenshot thumbnails + trade detail modal

**Frontend routing:**
- Add `"admin"` to `AppPage` type
- Admin nav item visible only when `isAdmin === true` (use `isCallerAdmin()` result stored in context)
- Route guard in App.tsx: if `currentPage === "admin"` and user is not admin, redirect to `"dashboard"`

### Modify

- `AppLayout.tsx` — conditionally show "Admin" nav item with Shield icon only when `isAdmin` prop is true; pass `isAdmin` from App.tsx
- `App.tsx` — fetch `isCallerAdmin()` after auth, store as state; pass to AppLayout and guard admin route
- `AppPage` type — add `"admin"` variant

### Remove

- Nothing removed

## Implementation Plan

1. Add `adminGetAllUsers`, `adminGetUserTrades`, `adminGetUserStats`, `adminGetPlatformStats` to `main.mo` — all guarded with `AccessControl.isAdmin` check
2. Regenerate `backend.d.ts` via `generate_motoko_code`
3. In `App.tsx`: fetch `isCallerAdmin()` on mount after auth, store in `isAdmin` state; pass to AppLayout; add admin route guard
4. In `AppLayout.tsx`: add `isAdmin` prop; add Shield nav item to NAV_ITEMS conditionally; update AppPage type
5. Create `AdminPage.tsx` with:
   - Sub-view state: `overview | leaderboard | user-detail`
   - Overview: platform stat cards + recent activity feed
   - Leaderboard: sortable table with performance ranking
   - User detail: read-only profile + trade list with screenshot thumbnails + full trade detail modal
6. Wire admin page into App.tsx render tree
7. All admin calls are read-only — no edit/delete actions exposed in admin UI
