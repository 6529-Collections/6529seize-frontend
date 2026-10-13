# Delegation Routes and Actions Troubleshooting

## Overview

Use this page when `/safe-collecting/*` routes fail to open, writes do not submit,
collection actions stay blocked, or Wallet Checker output looks wrong.

## Location in the Site

- Route handler: `/safe-collecting/[...section]`
- Section routes: `/safe-collecting`, `/safe-collecting/tap-guide`,
  `/safe-collecting/faq`, `/safe-collecting/consolidation-use-cases`, `/safe-collecting/wallet-checker`
- Write routes: `/safe-collecting/register-delegation`,
  `/safe-collecting/register-consolidation`, `/safe-collecting/register-sub-delegation`,
  `/safe-collecting/assign-primary-address`
- Collection routes: `/safe-collecting/any-collection`, `/safe-collecting/the-memes`,
  `/safe-collecting/meme-lab`, `/safe-collecting/6529-gradient`
- Bare `/delegation` has no page route (not-found)

## Quick Triage

1. Start from `/safe-collecting`, then reopen the route you need.
2. Confirm wallet prerequisites: connected wallet, expected account, expected chain.
3. For manager-driven actions, open incoming `Delegation Managers` and select one row.
4. Retry once and read the latest inline `Errors` or toast text.
5. Verify outcome in `/safe-collecting/wallet-checker` when needed.

## Symptom -> Fix

- `/delegation` opens not-found:
  use `/safe-collecting`. Bare `/delegation` is not a valid page.
- HTML-backed sections (`FAQ`, `Consolidation Use Cases`) show
  `404 | PAGE NOT FOUND`: fallback HTML could not load. Reopen from menu and
  retry later. The `TAP Guide` (`/safe-collecting/tap-guide`) is a native
  page and does not load article HTML.
- A registration or primary-address page asks to connect a wallet:
  a signed-in profile does not supply a live wallet connection. Use
  `Connect Wallet` to continue, or `Back to Safe Collecting` to leave. The
  return link is also available while the wallet connection is restoring.
- Collection tables stay on `Fetching incoming ...` / `Fetching outgoing ...`:
  wallet is disconnected, so collection reads do not run.
- Manager actions do not open a form:
  no incoming `Delegation Managers` row is selected (button click is a no-op
  until one row is selected).
- `Assign Primary Address` stays blocked:
  `Connect Wallet to continue` or
  `You must have a consolidation to assign a Primary Address`.
- Submit stays blocked with inline `Errors`: required fields are missing or
  invalid (collection, use case, address, expiry, or token).
- Batch revoke stays disabled: fewer than two rows selected; maximum selectable
  rows is five.
- Lock/unlock controls show `*` notes on a scoped route: global `Any Collection`
  lock state blocks local lock actions.
- Toast shows `Switch to Ethereum Mainnet` or `Switch to Sepolia Network`:
  wallet chain does not match the delegation contract chain.
- Wallet Checker shows `Enter a valid Ethereum address or ENS name.`, empty
  results, or blocked next run:
  enter a valid `0x...` or `.eth` (non-`.eth` names are invalid), then use
  `Clear` before the next check.

## Edge Cases

- `address` query state is intentionally cleared when leaving checker/assign
  routes.
- `collection` and `use_case` query state is intentionally cleared when leaving
  register-delegation route.
- `assign-primary-address?address=<wallet>` preselects only when that wallet is
  inside the resolved consolidation key.
- Wallet Checker accepts `.eth` input, resolves to `0x...`, and then stores the
  resolved address in query state.
- Unknown or nested delegation paths use HTML fallback by final URL segment.
  Missing HTML content renders `404 | PAGE NOT FOUND`.
- Some checker/API failures surface as `No delegations found`,
  `No delegation managers found`, or `No consolidations found`.

## Limitations / Notes

- HTML-backed delegation sections depend on external content availability.
- Collection reads refresh on a polling cycle (about every 10 seconds), so
  recent writes may appear stale between polls.
- Wallet Checker may show empty-result fallback text instead of a dedicated
  API-error panel.

## Related Pages

- [Delegation Index](README.md)
- [Delegation Center to Onchain Actions](flow-delegation-center-to-onchain-actions.md)
- [Delegation Write Action Routes](feature-delegation-action-flows.md)
- [Delegation Collection Management](feature-delegation-collection-management.md)
- [Wallet Checker](feature-wallet-checker.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
