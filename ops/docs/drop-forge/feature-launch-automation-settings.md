# Launch Automation and Wallet Funding

The `/drop-forge` hub shows Launch Automation to everyone with Drop Forge access.
Both switches start Off. The contract owner and configured claims administrators
can change them; ordinary on-chain admins and distribution administrators can
view the settings and fund the operational wallet.

Automatic launch controls new initialization, claim updates and airdrops for
tracked launches. Turning it Off retains the scheduled reports: due actions are
reported as skipped because automation is disabled, without marking them completed.
Submitted transactions continue confirmation tracking. Turning it back On resumes
eligible work within its window; missed phases are not replayed automatically.
The environment must be configured for execution before this switch can be enabled.
EMMA's Process and Finalize remains a separate operator-triggered workflow.

Automatic artist payment is a separate opt-in. Research and optional artist payment
become eligible at 18:00 Europe/Athens the day after minting, one hour after Public
closes. Artist payment uses the final paid-mint and redeemed-subscription accounting,
the 50% artist share and the recorded payment address/designated payee. Missing or
incomplete accounting defers payment. The payment limit must be configured first.
The wallet needs both payout funds and gas; mint proceeds still go to the configured
payment receiver. Manual Pay Artist remains available and records its transaction
hash so automation can verify completion instead of sending another payment.

The wallet panel shows the configured address, a verified ENS name when available,
an explorer link and ETH balance. Refresh updates those details. ENS is informational;
the underlying configured address is always the destination.

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

All new labels are message-backed; untranslated locales use en-US fallback.
These are internal operator controls and are not added to the public Help Bot corpus.

Related: [Drop Forge](README.md), [Launch Claims](feature-launch-claims-list-and-detail.md),
[backend setup](https://github.com/6529-Collections/6529seize-backend/blob/agent-prxt/drop-forge-auto-launch-requirements/docs/drop-forge-auto-launch-setup.md).
