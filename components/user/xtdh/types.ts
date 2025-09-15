export type Summary = {
  baseRatePerDay: number | null;
  multiplier: number | null; // xTDH global multiplier
  xtdhRatePerDay: number | null;
  totalRatePerDay: number | null;
  allocatedRatePerDay: number | null;
  incomingRatePerDay: number | null;
};

export enum XtdhInnerTab {
  OVERVIEW = "OVERVIEW",
  GIVE = "GIVE",
  RECEIVE = "RECEIVE",
  HISTORY = "HISTORY",
}

export type ReceiveFilter = "ALL" | "ACTIVE" | "PENDING";

export type XtdhTargetScope = "COLLECTION" | "TOKENS";
export type XtdhStandard = "ERC721" | "ERC1155" | "UNKNOWN";

export type XtdhSelectedTarget = {
  chain: string; // e.g., "eth-mainnet"
  contractAddress: string;
  standard: XtdhStandard;
  scope: XtdhTargetScope;
  tokenIds: string[]; // empty when scope=COLLECTION (for now)
};

