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
  /** Computed from Sepolia's Glamsterdam prices (ADR 0004): code bytes, new slots, creation. */
  | "glamsterdamEstimate"
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
  | "federatedDeploy721"
  | "federatedDeploy1155"
  | "federatedDeployPair";

export interface GasEstimate {
  readonly low: number;
  readonly high: number;
  readonly source: GasSource;
}

/**
 * Glamsterdam prices on Sepolia, measured on the r2 rehearsal (6529-works
 * ADR 0004). State creation dominates a contract deployment.
 */
export const GLAMSTERDAM_PRICES = {
  /** Gas per byte of deployed code (Prague: 200). */
  codeByte: 1_542,
  /** Gas per new storage slot, `SSTORE` from zero (Prague: 22,100). */
  newSlot: 111_000,
  /** An empty `CREATE` (Prague: about 53,000). */
  create: 210_000,
} as const;

/**
 * The federated templates as the v1.1 design sizes them: the rc.1 `Stream`
 * (20,762 bytes) and `Editions` (18,649 bytes) runtime code, with curation
 * switched off (6529-works docs/audit/scope.md). A deployment writes about 12
 * new slots: 6 for the template's own state, 4 for the registry entry and 2
 * for the artist listing. The chain source reads `extcodesize` of the
 * factory's templates instead.
 */
export const FEDERATED_TEMPLATE_SIZES = {
  ERC721: { codeBytes: 20_762, newSlots: 12 },
  ERC1155: { codeBytes: 18_649, newSlots: 12 },
} as const;

/** One contract's deploy gas under Glamsterdam pricing. */
export interface DeployGas {
  readonly code: number;
  readonly slots: number;
  readonly create: number;
  readonly total: number;
}

export function deployGas(codeBytes: number, newSlots: number): DeployGas {
  const code = codeBytes * GLAMSTERDAM_PRICES.codeByte;
  const slots = newSlots * GLAMSTERDAM_PRICES.newSlot;
  const create = GLAMSTERDAM_PRICES.create;
  return { code, slots, create, total: code + slots + create };
}

/**
 * The labelled estimate for one deployment (one contract, or both halves of a
 * pair). A pair at these prices is about 64M gas, above the largest Sepolia
 * transaction observed so far (38.4M, ADR 0004): the factory design must
 * still say whether a pair deploys in one transaction or two.
 */
export function deployGasEstimate(
  contracts: readonly DeployGas[]
): GasEstimate {
  const total = contracts.reduce((sum, contract) => sum + contract.total, 0);
  return { low: total, high: total, source: "glamsterdamEstimate" };
}

const DEPLOY_721 = deployGas(
  FEDERATED_TEMPLATE_SIZES.ERC721.codeBytes,
  FEDERATED_TEMPLATE_SIZES.ERC721.newSlots
);
const DEPLOY_1155 = deployGas(
  FEDERATED_TEMPLATE_SIZES.ERC1155.codeBytes,
  FEDERATED_TEMPLATE_SIZES.ERC1155.newSlots
);

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
  federatedDeploy721: deployGasEstimate([DEPLOY_721]),
  federatedDeploy1155: deployGasEstimate([DEPLOY_1155]),
  federatedDeployPair: deployGasEstimate([DEPLOY_721, DEPLOY_1155]),
};
