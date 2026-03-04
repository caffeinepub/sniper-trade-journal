# Sniper Trade Journal

## Current State

The app is a full-stack ICT/SMC trade journal with a Motoko backend and React frontend. Users can sign in via Internet Identity, log trades, view them in the Journal, and see analytics on the Dashboard.

The critical bug: `trades` and `userProfiles` in `main.mo` are declared as plain `let` (heap memory), not `stable var`. This means all data is wiped every time the canister is upgraded or restarted — trades do not persist across sessions.

## Requested Changes (Diff)

### Add
- `stable` keyword to `trades` and `userProfiles` map declarations so data survives canister upgrades and restarts

### Modify
- Regenerate the backend with stable storage declarations

### Remove
- Nothing

## Implementation Plan

1. Regenerate Motoko backend with `stable let trades` and `stable let userProfiles` so all trade data and user profiles persist across upgrades
2. Keep all existing API signatures identical — no frontend changes needed
