# Sniper Trade Journal

## Current State
The app has a New Trade form that uses `useActor()` which returns `{ actor, isFetching }`. The `isFetching` flag is `true` while the actor query is running, which includes an async `_initializeAccessControlWithSecret` call. The Save Trade button is disabled and shows "Connecting..." while `isActorLoading` (`isFetching`) is true. If the init call takes too long, the button is permanently stuck in "Connecting..." state and the user cannot save trades.

## Requested Changes (Diff)

### Add
- A separate `isActorReady` flag in `useActor` that becomes `true` once the actor object exists (query has data), independently of whether the background init call is still pending.

### Modify
- `useActor.ts`: The `isFetching` value should reflect only whether the actor itself (the object) has been fetched — not background tasks. Split: the actor query resolves as soon as the actor is constructed; `_initializeAccessControlWithSecret` is fired off as a side-effect after the actor is available, not inside the `queryFn`. This way `isFetching` becomes `false` and `actor` is set as soon as connection is established, not after the init RPC finishes.
- `TradeFormPage.tsx`: Remove the `isActorLoading` dependency that prevents form submission. The button should only be disabled while the mutation is pending (`isPending`). If the actor is not yet available when Save is clicked, show a brief toast and let the user try again — but don't lock the button indefinitely.

### Remove
- Nothing removed structurally.

## Implementation Plan
1. Refactor `useActor.ts`: Move `_initializeAccessControlWithSecret` out of `queryFn` into a `useEffect` that fires once `actorQuery.data` is first set. The `queryFn` just constructs and returns the actor. This makes the actor immediately available and `isFetching` drops to `false` quickly.
2. Update `TradeFormPage.tsx`: Remove `isActorLoading` from the button's `disabled` prop and the "Connecting..." label. Keep a soft check in `handleSaveTrade` — if actor is somehow null, show a toast. The button label and disabled state only depend on `isPending`.
