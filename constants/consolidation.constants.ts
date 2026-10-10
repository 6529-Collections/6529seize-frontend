// Wallet consolidation rules. These mirror the backend's CONSOLIDATIONS_LIMIT
// and CONSOLIDATION_FOURTH_WALLET_ACTIVATION_TIMESTAMP.
export const CONSOLIDATION_WALLET_LIMIT = 4;

// 2026-10-15T00:00:00Z. A fourth wallet counts only when its links were
// registered in both directions at or after this time.
export const CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS = Date.UTC(2026, 9, 15);
