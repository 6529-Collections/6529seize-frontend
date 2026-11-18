# Launch Automation and Wallet Funding

The `/drop-forge` hub shows Launch Automation to everyone with Drop Forge access.
The section starts collapsed, with a help dialog beside Refresh. Automatic launch
and automatic artist payment default Off. The creator contract owner and configured
claims administrators can change these settings and the payout limit. Every
authorized Drop Forge user can view the current values.

Automatic launch controls new initialization, claim updates and airdrops for
tracked launches. Turning it Off retains the scheduled reports: due actions are
reported as skipped because automation is disabled, without marking them completed.
Submitted transactions continue confirmation tracking. Turning it back On resumes
eligible work within its window; missed phases are not replayed automatically.
Distribution administrators choose how to prepare each claim in
[EMMA Review](../emma/feature-subscriptions-distribution-review.md). Automatic
launch can use a finalized distribution from either mode.

Automatic artist payment is a separate opt-in. Research and optional artist payment
become eligible at 18:00 Europe/Athens the day after minting, one hour after Public
closes. Artist payment uses the final paid-mint and redeemed-subscription accounting,
the 50% artist share and the recorded payment address/designated payee. Missing or
incomplete accounting defers payment. Choose **Set limit**, enter a positive
ETH amount, and select **Save & Enable**. The worker checks that saved limit
before submitting each payout. **Disable** keeps the saved limit, and
**Enable** uses it again in one click.
The wallet needs both payout funds and gas; mint proceeds still go to the configured
payment receiver. Manual Pay Artist remains available and records its transaction
hash so automation can verify completion instead of sending another payment.

The wallet panel shows the network beside its title, followed by an optional verified
ENS name and a shortened address. Hover the address to see it in full. The copy icon
copies the full address and confirms success; the explorer icon opens the wallet on
the displayed network’s Etherscan. ETH balance and **Top Up ETH** share a row.
Refresh updates those details. ENS is informational; the underlying configured
address is always the destination.

**Last changed by** shows the linked profile handle when available. Otherwise it
shows a verified ENS name with a shortened address, or the full wallet address when
neither a profile handle nor verified ENS is available.

Top Up ETH is available to all Drop Forge administrators even while automation is
Off. Open it, enter the amount, switch to the displayed network if needed and review
the recipient and estimated fee. Confirm through the connected wallet. The transfer
uses that wallet's ETH and gas, not KMS. Progress and a transaction link appear in the
standard transaction dialog. Confirmed outcomes are reported in the operations wave.
Unacknowledged transaction hashes survive refresh for reporting retries; these retries
do not submit another ETH transfer. Wallet replacements/cancellations are tracked.

If a settings save conflicts with another administrator's change, refresh before
trying again. A missing wallet balance or ENS name does not mean the address changed.
If a top-up result is uncertain, inspect its transaction before making another
transfer. Funding does not grant access to edit settings or manage contract admins.

## Post-mint evidence and preview

At 17:15 Europe/Athens, a one-time preview reports the calculated Research remainder
and optional artist payment in the dedicated operations wave. It shows Off settings
and payment-limit blocks rather than promising a transfer. Normal previews have no
tags; verification warnings tag `@dropforgeops` once. A failed preview is not recalculated.
The preexisting mint-announcement waves are unchanged and receive no new posts.

At 18:00, fresh checks compare the configured RPC's finalized minted total with
cumulative DB mints through the same block. Completed indexing coverage is required.
Launch displays both counts, the comparison block, indexed-through block and retry
eligibility; missing evidence remains Unavailable rather than becoming zero.
Disagreement retries after one minute, then five, then fifteen minutes within the
action window. Successful receipts still wait for verified delivery and indexed
finality. A retained signed transaction is reconciled, never blindly sent again
with a new amount or nonce. Unexpected delivery requires operator recovery.

Related: [Drop Forge](README.md), [Launch Claims](feature-launch-claims-list-and-detail.md),
[backend setup](https://github.com/6529-Collections/6529seize-backend/blob/agent-prxt/drop-forge-auto-launch-requirements/docs/drop-forge-auto-launch-setup.md).
