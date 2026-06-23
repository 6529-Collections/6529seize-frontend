export enum DistributionCollection {
  MEMES = "MEMES",
  GRADIENTS = "GRADIENTS",
  MEMELAB = "MEMELAB",
}

export interface DistributionTableItem {
  readonly collection: DistributionCollection;
  readonly tokenId: number;
  readonly name: string;
  readonly wallet: string;
  readonly phases: DistributionTableItemPhase[];
  readonly amountMinted: number;
  readonly amountTotal: number;
  readonly date: string;
}

export interface DistributionTableItemPhase {
  readonly phase: string;
  readonly amount: number;
}
