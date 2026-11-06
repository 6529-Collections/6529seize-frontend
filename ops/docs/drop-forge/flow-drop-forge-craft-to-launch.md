# Drop Forge Craft-to-Launch Flow

Actor 1 confirms the EMMA token, uploads allocation inputs and clicks **Process
and Finalize**. The loader tracks one durable operation through ordered phase
processing and finalization. Refresh restores progress. After completion, phase
subscription lists are read-only downloads.

Actor 2 saves assets, metadata and traits at `/drop-forge/craft/{id}`, then
publishes to Arweave. **Launch** queues initialization immediately and shows
progress. The fixed mint calendar supplies the phase schedule; no separate
per-drop time handoff is needed. Preparation, reporting access and sufficient
remaining confirmation time must pass backend checks before launch is accepted.

The worker replaces Actor 3's routine initialization and phase operations.
Phase 0 allocations precede its 17:40 Europe/Athens window; Phase 1 subscriber
airdrops run between 18:20 and 18:30, Phase 2 plus public subscribers between
18:50 and 19:00. Public configuration updates after Phase 2 closes at 19:20.
Transactions can be delayed, so scheduled windows do not guarantee exact-second
configuration activation. Errors remain visible and need operator review.

After saving and republishing Craft metadata, **Update Claim** synchronizes the
published version while preserving mint settings and completed allocations.
Changing edition size or distribution after launching is outside this metadata
operation and requires review.

Contract admins retain manual controls at `/drop-forge/launch/{id}`. A backend
lease pauses new automated submissions before the wallet prompt. After submission
the hash is registered for canonical confirmation and exact allocation credit.
Refresh retries a persisted hash. Compatible initialization/update already on
chain is observed without another transaction; automation's completed airdrop
flags appear in the existing manual controls. Transactions sent elsewhere need
their hashes supplied for reconciliation; supply alone cannot identify recipients.

The Launch page shows automation state, action progress, transaction links and
recovery controls. Pausing cannot revoke signed/submitted transactions. A lost
wallet outcome remains paused until its hash or safe cancellation is reconciled.
The dedicated operations wave records actions and errors; errors tag the
configured `@drops6529` group.

Craft and contract-admin access remain distinct. Admin grants/revocations remain owner-only on chain. Automatic artist payment is
separately opt-in and defaults Off. The hub's Automatic launch switch defaults Off; accepted plans keep their timed
reports while execution is disabled. Environment configuration must enable tracking
before Launch requests can be accepted. Coordinated manual controls remain available.

Related: [Craft](feature-craft-claims-list-and-detail.md),
[Launch](feature-launch-claims-list-and-detail.md),
[EMMA](../emma/feature-subscriptions-distribution-review.md).
