# Sniper Trade Journal

## Current State
Full-stack trading journal app with: Dashboard, Journal, New Trade, Calendar, Brutal Review, Mastery (drills), Risk Calculator, Monte Carlo, Admin Panel. Backend in Motoko with trades, drills, analytics, admin CRUD. Frontend in React/TypeScript with dark/white themes.

## Requested Changes (Diff)

### Add
- **InstitutionalIntelligencePage** — new full page under nav item "Institutional"
- Backend type `InstitutionalNews` with fields: id, title, institution, headline, summary, currencyImpact (currency + direction Bullish/Bearish/Neutral), date, createdAt
- Backend functions: `getInstitutionalNews()` (all users), `createInstitutionalNews(input)` (admin only), `deleteInstitutionalNews(id)` (admin only)
- Seed realistic static data for 7 institutions (Goldman Sachs, JPMorgan Chase, Morgan Stanley, Citigroup, Bank of America, ECB, Federal Reserve)
- Filter bar: by Currency (USD/EUR/GBP/JPY/AUD/CHF/NZD), by Institution dropdown, by Sentiment (Bullish/Bearish/Neutral)
- News cards showing: Institution badge, Headline, Summary, Currency Impact badge (color-coded), Date, Archive indicator for older items
- Search bar for keyword search across headlines/summaries
- **Dashboard widget** "Institutional Sentiment" — compact preview card showing aggregated sentiment per major currency (USD/EUR/GBP/JPY), color-coded Bullish/Neutral/Bearish
- Admin: "Add News" button visible only to admin to manually add new institutional intelligence items

### Modify
- `AppLayout.tsx` — add "Institutional" nav item with a Building2 icon
- `App.tsx` — add `institutional` page routing
- `DashboardPage.tsx` — add Institutional Sentiment preview widget
- `AppPage` type — add `"institutional"` variant

### Remove
- Nothing removed

## Implementation Plan
1. Add `InstitutionalNews` type + CRUD backend functions to `main.mo`
2. Regenerate `backend.d.ts` bindings
3. Add `institutional` to `AppPage` type and routing in `App.tsx` and `AppLayout.tsx`
4. Build `InstitutionalIntelligencePage.tsx` with news cards, filter bar, search, admin add form
5. Add `InstitutionalSentimentWidget` to `DashboardPage.tsx`
