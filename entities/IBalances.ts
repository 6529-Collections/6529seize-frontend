export interface OwnerBalance {
  consolidation_key: string;
  total_balance: number;
  memes_balance: number;
  unique_memes: number;
  memes_cards_sets: number;
  gradients_balance: number;
  nextgen_balance: number;
  memelab_balance: number;
  unique_memelab: number;
  boosted_tdh: number;
  boost: number;
  boosted_memes_tdh: number;
  boosted_gradients_tdh: number;
  boosted_nextgen_tdh: number;
  total_balance_rank: number;
  memes_balance_rank: number;
  unique_memes_rank: number;
  gradients_balance_rank: number;
  nextgen_balance_rank: number;
  memelab_balance_rank: number;
  unique_memelab_rank: number;
  boosted_tdh_rank: number;
  boosted_memes_tdh_rank: number;
  boosted_gradients_tdh_rank: number;
  boosted_nextgen_tdh_rank: number;
}

export interface OwnerBalanceMemes {
  consolidation_key: string;
  season: number;
  balance: number;
  unique: number;
  sets: number;
  rank: number;
  boosted_tdh: number;
  tdh_rank: number;
}
