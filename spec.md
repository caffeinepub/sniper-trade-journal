# Sniper Trade Journal – Advanced Macro Intelligence Dashboard

## Current State

The InstitutionalPage already has:
- RSS feed fetching with strict financial keyword filtering
- Category tabs: All, Currencies, Commodities, Crypto, Archive
- 72-hour All tab window with auto-archive logic
- Balanced coverage (min 3 per category)
- Sentiment engine strip (USD, EUR, GBP, JPY, Gold, Oil, Bitcoin, Ethereum)
- Manual "Add Report" admin modal
- Refresh button with live/auto fetch every 10 min
- Seed articles as fallback

DashboardPage has:
- InstitutionalSentimentWidget showing grouped sentiment by category
- Latest institutional headline

## Requested Changes (Diff)

### Add
- **Economic Calendar panel** on InstitutionalPage: static/curated upcoming macro events (NFP, FOMC, CPI, Central Bank speeches) shown in a timeline format grouped by Today / This Week / Next Week
- **Currency Pair Impact Mapping**: when USD/EUR/GBP/JPY sentiment is shown, display affected pairs with directional arrows (e.g. USD Bullish → EUR/USD ↓, GBP/USD ↓, USD/JPY ↑)
- **Market Narrative Detection panel**: compute dominant macro narrative from article categories + sentiment (e.g. Dollar Strength Cycle, Energy Shock Inflation, Risk-Off Environment, Crypto Risk Rally) with listed drivers
- **Institutional Source Tier badges**: Tier 1 (Goldman Sachs, JPMorgan, Morgan Stanley, Fed, ECB) get "Institutional Signal" badge; Tier 2 (Reuters, Bloomberg, FT) get "Tier 2" badge; all others unlabeled
- **News Clustering**: group articles that share similar keywords/topics into clusters shown as one expandable card listing all sources
- **Institutional Forecast Detection**: detect headlines containing forecast language ("target", "forecast", "price target", "expects", "projects") from Tier 1 sources and tag them with a "Forecast" badge
- **Macro Summary panel** at top of InstitutionalPage: compact strip showing all 8 asset sentiments + dynamically detected key drivers (top recurring themes from recent headlines)

### Modify
- **Sentiment strip** on InstitutionalPage: expand each asset to also show currency pair impact arrows on click/hover
- **DashboardPage sentiment widget**: add Market Narrative label below asset list
- **News cards**: add Tier badge, Forecast badge where applicable, cluster grouping

### Remove
- Nothing removed

## Implementation Plan

1. Create `src/frontend/src/utils/macroIntelligence.ts` — utilities for:
   - Tier classification of sources/institutions
   - Forecast keyword detection
   - News clustering by topic similarity (keyword overlap)
   - Market narrative detection (scoring narratives based on category/sentiment distribution)
   - Currency pair impact mapping per asset sentiment
   - Key driver extraction from recent article headlines

2. Create `src/frontend/src/components/EconomicCalendar.tsx` — static curated calendar with events for the next 30 days, displayed as Today / This Week / Next Week sections with event name, time, and importance badge

3. Create `src/frontend/src/components/MacroSummaryStrip.tsx` — top-of-page panel showing all 8 asset sentiments + key drivers list computed from recent articles

4. Create `src/frontend/src/components/MarketNarrativePanel.tsx` — shows dominant narrative title + driver bullet points

5. Create `src/frontend/src/components/CurrencyPairImpact.tsx` — given a list of asset sentiments, renders affected pair rows with directional arrows

6. Update `InstitutionalPage.tsx`:
   - Add MacroSummaryStrip at top
   - Add MarketNarrativePanel below sentiment strip
   - Add EconomicCalendar as a collapsible sidebar or tab section
   - Apply news clustering to feed display
   - Apply Tier badges and Forecast badges to cards
   - Add CurrencyPairImpact expandable section per currency asset in sentiment strip

7. Update `DashboardPage.tsx`:
   - Add Market Narrative label to InstitutionalSentimentWidget
   - Add currency pair impact rows under each currency asset
