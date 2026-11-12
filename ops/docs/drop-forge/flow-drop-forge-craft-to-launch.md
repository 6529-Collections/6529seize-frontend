# Drop Forge Craft-to-Launch Flow

Actor 1 confirms the EMMA token, uploads allocation inputs and clicks **Process
and Finalize**. The loader tracks one durable operation through ordered phase
processing and finalization. Refresh restores progress. After completion, phase
subscription lists are read-only downloads.

Actor 2 saves assets, metadata and traits at `/drop-forge/craft/{id}`, then
publishes to Arweave. With **Automatic launch** on, **Launch** queues
initialization immediately. The card shows **Initializing…** until the claim
confirms, then **Claim initialized**. The **Auto Launch** pill identifies a
saved plan in Craft and in the Launch list and detail. The fixed mint calendar supplies the phase schedule; no separate
per-drop time handoff is needed. Preparation, reporting access and sufficient
remaining confirmation time must pass backend checks before launch is accepted.

The worker replaces Actor 3's routine initialization and phase operations.
Phase 0 allocations precede its 17:40 Europe/Athens window; Phase 1 subscriber
airdrops run between 18:20 and 18:30. Between 18:50 and 19:00, Phase 2
subscriber airdrops run first, then Public subscriber airdrops run in separate
transactions. Each row is marked **Completed** when all its own batches confirm. Public configuration updates after Phase 2 closes at 19:20.
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
On staging, `@drops6529` reports actions and errors in **Drop Forge Ops**.
Reports link to the Launch card and to the transaction when available. Mined
transactions show the gas fee. Airdrop reports show wallet and token counts,
and artist payment reports show the amount in ETH.

Drop Forge checks mint readiness at 17:30, 18:28, 18:58 and 19:22 Athens time
on scheduled mint days, including manual launches. The first three checks
verify the next mint window and the required airdrops. The last verifies
that public minting is active. Problems alert the configured `@dropforgeops`
group. Passing checks stay quiet.

Craft and contract-admin access remain distinct. Admin grants/revocations remain owner-only on chain. Automatic artist payment is
separately opt-in and defaults Off. The hub's **Automatic launch** switch also
defaults Off. Accepted plans keep their timed reports while execution is disabled.
**EMMA preparation** controls whether Process and Finalize can start or advance
through its checkpoints. Coordinated manual controls remain available.

Related: [Craft](feature-craft-claims-list-and-detail.md),
[Launch](feature-launch-claims-list-and-detail.md),
[EMMA](../emma/feature-subscriptions-distribution-review.md).
