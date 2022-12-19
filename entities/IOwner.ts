export interface Owner {
  created_at: Date;
  wallet: `0x${string}`;
  wallet_display: string | null;
  token_id: number;
  contract: string;
  balance: number;
}

export interface OwnerRank extends Owner {
  tdh: number;
  tdh__raw: number;
  tdh_rank: number;
}

export interface OwnerTags {
  created_at: Date;
  wallet: string;
  wallet_display: string | null;
  memes_balance: number;
  unique_memes: number;
  gradients_balance: number;
  genesis: boolean;
  memes_cards_sets: number;
}
