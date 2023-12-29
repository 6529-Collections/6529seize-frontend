import { NftRank, NftTDH } from "./INFT";

export interface BaseTDH {
  block: number;
  tdh: number;
  boost: number;
  boosted_tdh: number;
  tdh__raw: number;
  tdh_rank: number;
  tdh_rank_memes: number;
  tdh_rank_memes_szn1: number;
  tdh_rank_memes_szn2: number;
  tdh_rank_memes_szn3: number;
  tdh_rank_memes_szn4: number;
  tdh_rank_memes_szn5: number;
  tdh_rank_memes_szn6: number;
  tdh_rank_gradients: number;
  balance: number;
  genesis: number;
  memes_cards_sets: number;
  unique_memes: number;
  unique_memes_szn1: number;
  unique_memes_szn2: number;
  unique_memes_szn3: number;
  unique_memes_szn4: number;
  unique_memes_szn5: number;
  unique_memes_szn6: number;
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
  boosted_memes_tdh_season3: number;
  memes_tdh_season3: number;
  memes_balance_season3: number;
  memes_tdh_season3__raw: number;
  boosted_memes_tdh_season4: number;
  memes_tdh_season4: number;
  memes_balance_season4: number;
  memes_tdh_season4__raw: number;
  boosted_memes_tdh_season5: number;
  memes_tdh_season5: number;
  memes_balance_season5: number;
  memes_tdh_season5__raw: number;
  boosted_memes_tdh_season6: number;
  memes_tdh_season6: number;
  memes_balance_season6: number;
  memes_tdh_season6__raw: number;
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
  memes_cards_sets_szn3: number;
  memes_cards_sets_szn4: number;
  memes_cards_sets_szn5: number;
  memes_cards_sets_szn6: number;
  day_change: number;
}

export interface TDH extends BaseTDH {
  wallet: `0x${string}`;
  wallet_display: string | undefined;
}

export interface ConsolidatedTDH extends BaseTDH {
  wallets: `0x${string}`[];
  consolidation_display: string;
}

export interface BaseTDHMetrics extends TDH {
  purchases_value: number;
  purchases_count: number;
  purchases_value_memes: number;
  purchases_count_memes: number;
  purchases_value_memes_season1: number;
  purchases_count_memes_season1: number;
  purchases_value_memes_season2: number;
  purchases_count_memes_season2: number;
  purchases_value_memes_season3: number;
  purchases_count_memes_season3: number;
  purchases_value_memes_season4: number;
  purchases_count_memes_season4: number;
  purchases_value_memes_season5: number;
  purchases_count_memes_season5: number;
  purchases_value_memes_season6: number;
  purchases_count_memes_season6: number;
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
  purchases_value_primary_memes_season3: number;
  purchases_count_primary_memes_season3: number;
  purchases_value_primary_memes_season4: number;
  purchases_count_primary_memes_season4: number;
  purchases_value_primary_memes_season5: number;
  purchases_count_primary_memes_season5: number;
  purchases_value_primary_memes_season6: number;
  purchases_count_primary_memes_season6: number;
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
  purchases_value_secondary_memes_season3: number;
  purchases_count_secondary_memes_season3: number;
  purchases_value_secondary_memes_season4: number;
  purchases_count_secondary_memes_season4: number;
  purchases_value_secondary_memes_season5: number;
  purchases_count_secondary_memes_season5: number;
  purchases_value_secondary_memes_season6: number;
  purchases_count_secondary_memes_season6: number;
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
  sales_value_memes_season3: number;
  sales_count_memes_season3: number;
  sales_value_memes_season4: number;
  sales_count_memes_season4: number;
  sales_value_memes_season5: number;
  sales_count_memes_season5: number;
  sales_value_memes_season6: number;
  sales_count_memes_season6: number;
  sales_value_gradients: number;
  sales_count_gradients: number;
  transfers_in: number;
  transfers_in_memes: number;
  transfers_in_memes_season1: number;
  transfers_in_memes_season2: number;
  transfers_in_memes_season3: number;
  transfers_in_memes_season4: number;
  transfers_in_memes_season5: number;
  transfers_in_memes_season6: number;
  transfers_in_gradients: number;
  transfers_out: number;
  transfers_out_memes: number;
  transfers_out_memes_season1: number;
  transfers_out_memes_season2: number;
  transfers_out_memes_season3: number;
  transfers_out_memes_season4: number;
  transfers_out_memes_season5: number;
  transfers_out_memes_season6: number;
  transfers_out_gradients: number;
  dense_rank_balance: number;
  dense_rank_balance_memes: number;
  dense_rank_balance_memes_season1: number;
  dense_rank_balance_memes_season2: number;
  dense_rank_balance_memes_season3: number;
  dense_rank_balance_memes_season4: number;
  dense_rank_balance_memes_season5: number;
  dense_rank_balance_memes_season6: number;
  dense_rank_balance_gradients: number;
  dense_rank_balance__ties: number;
  dense_rank_balance_memes__ties: number;
  dense_rank_balance_memes_season1__ties: number;
  dense_rank_balance_memes_season2__ties: number;
  dense_rank_balance_memes_season3__ties: number;
  dense_rank_balance_memes_season4__ties: number;
  dense_rank_balance_memes_season5__ties: number;
  dense_rank_balance_memes_season6__ties: number;
  dense_rank_balance_gradients__ties: number;
  dense_rank_sort: number;
  dense_rank_unique: number;
  dense_rank_unique__ties: number;
  dense_rank_unique_memes: number;
  dense_rank_unique_memes__ties: number;
  dense_rank_unique_memes_season1: number;
  dense_rank_unique_memes_season1__ties: number;
  dense_rank_unique_memes_season2: number;
  dense_rank_unique_memes_season2__ties: number;
  dense_rank_unique_memes_season3: number;
  dense_rank_unique_memes_season3__ties: number;
  dense_rank_unique_memes_season4: number;
  dense_rank_unique_memes_season4__ties: number;
  dense_rank_unique_memes_season5: number;
  dense_rank_unique_memes_season5__ties: number;
  dense_rank_unique_memes_season6: number;
  dense_rank_unique_memes_season6__ties: number;
}

export interface TDHMetrics extends TDH, BaseTDHMetrics {}
export interface ConsolidatedTDHMetrics
  extends ConsolidatedTDH,
    BaseTDHMetrics {}

export interface TDHCalc {
  date: Date;
  block: number;
}

export interface GlobalTDHHistory extends TDHCalc {
  created_tdh: number;
  destroyed_tdh: number;
  net_tdh: number;
  created_boosted_tdh: number;
  destroyed_boosted_tdh: number;
  net_boosted_tdh: number;
  created_tdh__raw: number;
  destroyed_tdh__raw: number;
  net_tdh__raw: number;
  memes_balance: number;
  gradients_balance: number;
  total_boosted_tdh: number;
  total_tdh: number;
  total_tdh__raw: number;
  gradients_boosted_tdh: number;
  gradients_tdh: number;
  gradients_tdh__raw: number;
  memes_boosted_tdh: number;
  memes_tdh: number;
  memes_tdh__raw: number;
  total_consolidated_wallets: number;
  total_wallets: number;
}

export interface TDHHistory extends TDHCalc {
  consolidation_display: string;
  wallets: `0x${string}`[];
  boosted_tdh: number;
  tdh: number;
  tdh__raw: number;
  created_tdh: number;
  destroyed_tdh: number;
  net_tdh: number;
  created_boosted_tdh: number;
  destroyed_boosted_tdh: number;
  net_boosted_tdh: number;
  created_tdh__raw: number;
  destroyed_tdh__raw: number;
  net_tdh__raw: number;
  created_balance: number;
  destroyed_balance: number;
  net_balance: number;
}
