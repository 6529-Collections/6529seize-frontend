export const CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS = Date.parse(
  "2026-10-15T00:00:00Z"
);
export const FOURTH_SLOT_SIGNING_OPENS_MS = Date.parse("2026-10-15T00:10:00Z");
export const limits = { maxWallets: 4, ungatedMaxWallets: 3 };
export const policy = {
  ...limits,
  activationMs: CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS,
  signingOpensMs: FOURTH_SLOT_SIGNING_OPENS_MS,
};
