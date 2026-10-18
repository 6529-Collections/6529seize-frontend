/**
 * The worked examples' network: how it stood on the 2026-10-11 cycle (P26
 * §5.2, replay). The rule values themselves come from the engine's registry
 * (`components/explained/engine/tdh.ts`).
 */
export const EXAMPLE_NETWORK = {
  largestEdition: 3_941,
  eligibleMemes: 559,
  gradients: 101,
  nextgenCollectionSize: 1_000,
} as const;

/**
 * Unix time of the snapshot block of cycle 20,742, block 26,201,364
 * (2026-10-15 23:59:59 UTC).
 */
export const EXAMPLE_SNAPSHOT_TIME = 1_792_108_799;
