# Delegation Write Action Routes

## Overview

Write action routes under `/delegation/*` register delegation state onchain.
Use this page for required inputs, query prefills, manager-launched variants,
and submit/recovery behavior.

## Location in the Site

- `/delegation/register-delegation`
- `/delegation/register-consolidation`
- `/delegation/build-consolidation` (guided consolidation setup)
- `/delegation/register-sub-delegation`
- `/delegation/assign-primary-address`

## Entry Points

- From `/delegation/delegation-center` action cards:
  - `Register Delegation` -> `/delegation/register-delegation`
  - `Register Consolidation` -> `/delegation/register-consolidation`
  - `Guided Setup` on the `Consolidations` card ->
    `/delegation/build-consolidation`
  - `Register Delegation Manager` -> `/delegation/register-sub-delegation`
- Open write routes directly by URL.
- Profile owners can select `Add another wallet` beside `Wallet Checker` in
  `ID Statements` → `Consolidated Addresses` to open
  `/delegation/build-consolidation`. This entry is hidden while a proxy
  profile is active and once the profile has 4 wallets.
- The normal `register-consolidation` form links to the guided setup.
- Open prefilled links such as
  `/delegation/register-delegation?collection=<contract>&use_case=<id>`.
- From collection routes (`/delegation/any-collection`, `/delegation/the-memes`,
  `/delegation/meme-lab`, `/delegation/6529-gradient`), open incoming
  `Delegation Managers`, select one delegator, then launch manager actions.
- `assign-primary-address` has no Delegation Center action card. Open it by URL
  or from manager actions on supported collection routes.

## Route Requirements

- `register-delegation`
  - Required: `Collection`, `Use Case`, `Delegate Address`
  - Optional: `Expiry Date` (`Never` or `Select Date`)
  - Optional: `Tokens` (`All` or `Select Token ID`)
- `register-consolidation`
  - Required: `Collection`, `Consolidating With`
- `build-consolidation`
  - Required: 2 to 4 wallet addresses (`0x` followed by 40 hexadecimal
    characters); ENS names are not accepted
  - Each step's own wallet must be connected to sign it
- `register-sub-delegation`
  - Required: `Collection`, `Manager Address`
- `assign-primary-address`
  - Required: connected profile
  - Required: consolidation key with more than one wallet
  - Required: choose `Primary Address` from consolidation wallets
  - If profile is missing, route shows `Connect Wallet to continue`
  - If consolidation is missing, route shows
    `You must have a consolidation to assign a Primary Address`

## Input and Validation Rules

- Address fields on write forms accept `0x...` or `.eth`.
- If address resolution does not produce a valid `0x...` wallet, submit shows
  `Missing or invalid Address`.
- Write forms reject self-targeting and show
  `Invalid Address - cannot delegate to your own wallet`.
- `register-delegation` supports all listed use cases in the selector, but the
  UI note calls out current 6529.io support for `#1`, `#2`, and `#3`.
- `register-consolidation` shows an on-page note that TDH consolidation should
  use `Any Collection` or `The Memes`.
- The normal consolidation form explains that a consolidation holds up to 4
  wallets and that every pair of wallets registers a link in both directions,
  so every wallet signs and needs ETH for gas. The ownership link is public,
  existing profile data may be combined, and NFTs stay in their wallets. The
  block links to the guided setup.
- Opening the form leaves `Collection` unselected and `Consolidating With`
  empty. The instruction block is omitted from manager-launched forms, which
  use the delegation-manager signing path.

## Guided Consolidation Setup

`/delegation/build-consolidation` (`Build a Consolidation`) plans the fewest
transactions for building or extending a consolidation: one transaction per
wallet, in a safe order.

- `Before you start` states that every consolidated wallet can sign in as the
  profile and act for it, that profiles merge permanently with the
  highest-CIC profile keeping its handle, that signing out of order
  temporarily splits the consolidation and can reduce TDH-wave votes, and that
  a wallet already in another consolidation leaves it. It links to the TDH
  consolidation explainer and the consolidation FAQ article.
- The connected wallet is prefilled, followed by the rest of its current
  consolidation from the 6529 API. Up to 4 rows are allowed. Invalid and
  duplicate addresses are flagged per row. Rows can be removed down to two.
- The route does not require a connected wallet to plan. The wallet list stays
  in place when the connected wallet changes, so each signer can connect in
  turn.
- If a listed wallet's current consolidation includes wallets that are not
  listed, the page names the wallets that will leave it.
- The page reads every direction on-chain. A direction counts when it is
  registered with use case `999` on `Any Collection` or `The Memes`.
- `Signing steps` lists one numbered step per wallet that still has links to
  register. Wallets already in the current consolidation sign first and
  joining wallets sign last; joining wallets with fewer links left sign
  earlier. A step with one link sends `registerDelegationAddress`; a step with
  several sends one `batchDelegations` transaction. Both use
  `Any Collection`, no expiry, and all tokens.
- Only the first step with links left to send is actionable, and only while
  its own wallet is connected. Later steps show
  `Available once the earlier steps are confirmed.`; the next step asks the
  user to connect or switch to the named wallet, or shows the fourth-slot
  hold. Confirmed steps stay numbered and show `Confirmed`.
- Groups of 2 or 3 wallets use the on-chain status only.
- A group of 4 counts only when one member has all three of its links
  registered in both directions from 15 October 2026, 00:00 UTC. For 4-wallet
  plans the page also reads each wallet's stored pairs
  (`/api/consolidations/{wallet}?show_incomplete=true`) for the time each
  direction was registered. Every direction between a joining wallet and
  another listed wallet must be registered from that date; an older
  registration is registered again in its signer's step, and a note explains
  that older links are registered again so they count for the fourth wallet.
  Joining wallets are those outside the current consolidation; with fewer than
  three current members listed, every wallet is joining.
- Before 15 October 2026, 00:00 UTC every step of a 4-wallet plan waits and
  shows `Available from <date>.`, with a note that four-wallet consolidations
  count only for links registered from then.
- After a step confirms in the session, a link that 6529 has not recorded yet
  shows `Recording` and
  `Waiting for 6529 to record this link (usually about a minute).` instead of
  asking for another signature. The next step can proceed meanwhile.
- If a joining wallet already registered toward an existing member whose step
  registers back, a note warns that the consolidation may be split until the
  last step confirms.
- Transaction progress uses the shared transaction dialog
  (`Consolidation Step N`), and gas-estimation or network errors appear inside
  the affected step. On-chain status and stored registration times refresh
  every 15 seconds and after each confirmed transaction, together with the
  current consolidation.
- When every step is confirmed, the page notes that the consolidation updates
  within minutes and TDH fully updates at the next 00:00 UTC snapshot.

## Query Parameter Behavior

- `register-delegation` accepts:
  - `collection=<contract>` to preselect `Collection`
  - `use_case=<id>` to preselect `Use Case`
- `assign-primary-address` accepts:
  - `address=<wallet>` to preselect `Primary Address` only when the wallet is
    inside the resolved consolidation key
  - If missing or not found in that key, no address is preselected

## Delegation Manager Variants

- Manager-launched actions are available from incoming `Delegation Managers`
  rows after selecting one original delegator.
- Forms launched this way show `Original Delegator` as fixed read-only input.
- On scoped collection routes (`the-memes`, `meme-lab`, `6529-gradient`),
  `Collection` is restricted to that route collection.
- `Assign Primary Address` manager action is shown only on
  `Any Collection` and `The Memes`.
- Manager `Revoke` opens a dedicated revoke form that requires `Collection`,
  `Revoke Address`, and `Use Case`.

## Feedback and Transaction States

- Action-specific submit buttons start with `Confirm in your wallet...`.
- After wallet approval, toast shows `Transaction submitted...` with a `view`
  explorer link.
- After confirmation, toast updates to `Transaction Successful!`.
- Missing or invalid form inputs show inline under `Errors`.
- Chain mismatch can surface as `Switch to Ethereum Mainnet` or
  `Switch to Sepolia Network`.

## Failure and Recovery

- If submit does not proceed, fix every item under `Errors` and resubmit.
- If chain mismatch appears, switch wallet chain and submit again.
- If the wallet can submit but simulation fails due lock state, unlock the
  affected collection or use case from collection management and retry.
- If `assign-primary-address` is blocked by consolidation requirements,
  register consolidation first, then reopen the route.

## Limitations / Notes

- These routes submit onchain writes and need wallet confirmation.
- Final success state depends on transaction confirmation timing.
- The consolidation instructions and the guided setup use canonical `en-US`
  messages. Other supported locales currently use English fallback copy; the
  remaining form labels and validation messages are not fully localized.
- Collection tables, lock controls, edit, and revoke flows are documented in
  [Delegation Collection Management](feature-delegation-collection-management.md).

## Related Pages

- [Delegation Index](README.md)
- [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md)
- [Delegation Collection Management](feature-delegation-collection-management.md)
- [Delegation Center to Onchain Actions](flow-delegation-center-to-onchain-actions.md)
- [Delegation Routes and Actions Troubleshooting](troubleshooting-delegation-routes-and-actions.md)
- [Wallet Checker](feature-wallet-checker.md)
