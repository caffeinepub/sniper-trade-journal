# Sniper Trade Journal

## Current State
Full trading journal app with Dashboard, Journal, New Trade, Calendar, Brutal Review, Mastery, and Admin Panel sections. Admin access currently requires entering a secret token via a hidden `#admin-setup` URL hash modal. The backend `_initializeAccessControlWithSecret` function requires a CAFFEINE_ADMIN_TOKEN environment variable to be matched.

## Requested Changes (Diff)

### Add
- New backend function `_initializeAccessControl` (no token/secret required) — first caller becomes admin permanently, all subsequent callers become regular users
- Auto-call `_initializeAccessControl` on sign-in (in frontend, immediately after actor is ready)

### Modify
- `access-control.mo`: Remove token comparison from `initialize()`. First non-anonymous caller who has not yet registered becomes admin. After admin is assigned, all future callers become regular users. Admin is locked forever — no reassignment possible.
- `MixinAuthorization.mo`: Replace `_initializeAccessControlWithSecret(userSecret)` with `_initializeAccessControl()` (no argument, no env var lookup). Expose it as a public shared function.
- `AppLayout.tsx`: Remove `HiddenAdminSetupModal` component entirely. Remove `#admin-setup` hash logic. Remove `onAdminGranted` prop and related admin token UI. Admin panel nav link remains but is only shown when `isAdmin === true`.
- `App.tsx`: On actor ready + authenticated, auto-call `actor._initializeAccessControl()` instead of waiting for manual token entry. Check `isCallerAdmin()` right after to set `isAdmin` state.

### Remove
- `HiddenAdminSetupModal` component and all its associated state
- Admin token input, "Activate" button, and error/success states for token flow
- `_initializeAccessControlWithSecret` backend function
- Any reference to `CAFFEINE_ADMIN_TOKEN` environment variable in authorization logic

## Implementation Plan
1. Regenerate backend: `_initializeAccessControl()` public shared — no args, no token. First caller becomes admin, locked forever.
2. Update `MixinAuthorization.mo` accordingly (via code generator).
3. Update `App.tsx`: after actor is ready, call `_initializeAccessControl()` then `isCallerAdmin()` to set admin state.
4. Update `AppLayout.tsx`: remove `HiddenAdminSetupModal`, remove `onAdminGranted` prop, remove token UI. Admin nav link only shown when `isAdmin === true`.
5. Validate and deploy.
