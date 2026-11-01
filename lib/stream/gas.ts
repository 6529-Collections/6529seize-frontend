/**
 * Gas figures the UI shows. Every figure carries its source label (owner
 * decision: Sepolia gas is shown with a label). Operations with no measured or
 * estimated figure (1/1 credit claims, edition withdrawals, split releases) have none; the UI shows nothing
 * rather than a guess. The chain data source replaces these with
 * `eth_estimateGas` results and the same label scheme.
 */

/** Where a figure comes from; each has a message under `stream.gas.source.*`. */
export type GasSource =
  /** Measured on Sepolia r2 under Glamsterdam, 11 October 2026 (6529-works flows.md). */
  | "sepoliaR2"
  /** Estimated from the D138 gas prototype and reference model, Glamsterdam pricing. */
  | "d138Estimate"
  /** ADR 0001 section 16: "about 4-5M gas per contract". */
  | "adrFederated"
  /** Estimated by the node for this transaction. */
  | "node";

/** When the Sepolia r2 figures were measured (a calendar date). */
export const SEPOLIA_R2_MEASURED_ON = "2026-10-11";

export type GasOperation =
  | "auctionStart"
  | "auctionBid"
  | "auctionSettle"
  | "editionOpen"
  | "editionBid"
  | "editionRaise"
  | "editionSettle"
  | "editionClaimWin"
  | "editionClaimRefund"
  | "createEdition"
  | "federatedDeploySingle"
  | "federatedDeployPair";

export interface GasEstimate {
  readonly low: number;
  readonly high: number;
  readonly source: GasSource;
}

export const GAS_ESTIMATES: Readonly<Record<GasOperation, GasEstimate>> = {
  auctionStart: { low: 846_963, high: 982_312, source: "sepoliaR2" },
  auctionBid: { low: 169_060, high: 169_410, source: "sepoliaR2" },
  auctionSettle: { low: 160_000, high: 440_000, source: "sepoliaR2" },
  editionOpen: { low: 300_000, high: 330_000, source: "d138Estimate" },
  editionBid: { low: 170_000, high: 280_000, source: "d138Estimate" },
  editionRaise: { low: 60_000, high: 165_000, source: "d138Estimate" },
  editionSettle: { low: 240_000, high: 290_000, source: "d138Estimate" },
  editionClaimWin: { low: 170_000, high: 185_000, source: "d138Estimate" },
  editionClaimRefund: { low: 40_000, high: 50_000, source: "d138Estimate" },
  createEdition: { low: 1_118_699, high: 1_118_699, source: "sepoliaR2" },
  federatedDeploySingle: {
    low: 4_000_000,
    high: 5_000_000,
    source: "adrFederated",
  },
  federatedDeployPair: {
    low: 8_000_000,
    high: 10_000_000,
    source: "adrFederated",
  },
};
