import { NftRank, NftTDH } from "./INFT";

export interface TDH {
  date: Date;
  wallet: `0x${string}`;
  wallet_display: string | null;
  block: number;
  tdh: number;
  boost: number;
  boosted_tdh: number;
  tdh__raw: number;
  tdh_rank: number;
  tdh_rank_memes: number;
  tdh_rank_memes_szn1: number;
  tdh_rank_memes_szn2: number;
  tdh_rank_gradients: number;
  balance: number;
  genesis: number;
  memes_cards_sets: number;
  unique_memes: number;
  unique_memes_szn1: number;
  unique_memes_szn2: number;
  boosted_memes_tdh: number;
  memes_tdh: number;
  memes_tdh__raw: number;
  memes_balance: number;
  boosted_memes_tdh_season1: number;
  memes_tdh_season1: number;
  memes_balance_season1: number;
  memes_tdh_season1__raw: number;
  boosted_memes_tdh_season2: number;
  memes_tdh_season2: number;
  memes_balance_season2: number;
  memes_tdh_season2__raw: number;
  memes: NftTDH[];
  memes_ranks: NftRank[];
  gradients_balance: number;
  boosted_gradients_tdh: number;
  gradients_tdh: number;
  gradients_tdh__raw: number;
  gradients: NftTDH[];
  gradients_ranks: NftRank[];
  memes_cards_sets_minus1: number;
  memes_cards_sets_minus2: number;
  memes_cards_sets_szn1: number;
  memes_cards_sets_szn2: number;
}

export interface TDHMetrics extends TDH {
  purchases_value: number;
  purchases_count: number;
  purchases_value_memes: number;
  purchases_count_memes: number;
  purchases_value_memes_season1: number;
  purchases_count_memes_season1: number;
  purchases_value_memes_season2: number;
  purchases_count_memes_season2: number;
  purchases_value_gradients: number;
  purchases_count_gradients: number;
  purchases_value_primary: number;
  purchases_count_primary: number;
  purchases_value_primary_memes: number;
  purchases_count_primary_memes: number;
  purchases_value_primary_memes_season1: number;
  purchases_count_primary_memes_season1: number;
  purchases_value_primary_memes_season2: number;
  purchases_count_primary_memes_season2: number;
  purchases_value_primary_gradients: number;
  purchases_count_primary_gradients: number;
  purchases_value_secondary: number;
  purchases_count_secondary: number;
  purchases_value_secondary_memes: number;
  purchases_count_secondary_memes: number;
  purchases_value_secondary_memes_season1: number;
  purchases_count_secondary_memes_season1: number;
  purchases_value_secondary_memes_season2: number;
  purchases_count_secondary_memes_season2: number;
  purchases_value_secondary_gradients: number;
  purchases_count_secondary_gradients: number;
  sales_value: number;
  sales_count: number;
  sales_value_memes: number;
  sales_count_memes: number;
  sales_value_memes_season1: number;
  sales_count_memes_season1: number;
  sales_value_memes_season2: number;
  sales_count_memes_season2: number;
  sales_value_gradients: number;
  sales_count_gradients: number;
  transfers_in: number;
  transfers_in_memes: number;
  transfers_in_memes_season1: number;
  transfers_in_memes_season2: number;
  transfers_in_gradients: number;
  transfers_out: number;
  transfers_out_memes: number;
  transfers_out_memes_season1: number;
  transfers_out_memes_season2: number;
  transfers_out_gradients: number;
  dense_rank_balance: number;
  dense_rank_balance_memes: number;
  dense_rank_balance_memes_season1: number;
  dense_rank_balance_memes_season2: number;
  dense_rank_balance_gradients: number;
}

export interface RankedTDH extends TDH {
  rank: number;
}

export interface TagsTDH extends TDH {
  memes_total: number;
  gradients_total: number;
}

export interface TDHCalc {
  date: Date;
  block: number;
}
