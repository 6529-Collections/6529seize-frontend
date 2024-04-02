export interface OwnerLite {
  readonly token_id: number;
  readonly contract: string;
  balance: number;
}

export interface Owner {
  created_at: Date;
  wallet: `0x${string}`;
  wallet_display: string | undefined;
  token_id: number;
  contract: string;
  balance: number;
}

export interface OwnerRank extends Owner {
  tdh: number;
  tdh__raw: number;
  tdh_rank: number;
}
