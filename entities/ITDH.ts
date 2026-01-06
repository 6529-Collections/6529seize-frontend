import type { NftRank, NftTDH } from "./INFT";

export interface TDHBoostBreakdown {
  available: number;
  available_info: string[];
  acquired: number;
  acquired_info: string[];
}

interface BaseTDH {
  block: number;
  tdh: number;
  boost: number;
  boost_breakdown: {
    memes_card_sets: TDHBoostBreakdown;
    [key: `memes_szn${number}`]: TDHBoostBreakdown;
    memes_genesis: TDHBoostBreakdown;
    memes_nakamoto: TDHBoostBreakdown;
    gradients: TDHBoostBreakdown;
  };
  boosted_tdh: number;
  tdh__raw: number;
  tdh_rank: number;
  tdh_rank_memes: number;
  tdh_rank_gradients: number;
  balance: number;
  genesis: number;
  memes_cards_sets: number;
  unique_memes: number;
  boosted_memes_tdh: number;
  memes_tdh: number;
  memes_tdh__raw: number;
  memes_balance: number;
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
  nextgen_balance: number;
}

export interface TDH extends BaseTDH {
  wallet: `0x${string}`;
  wallet_display: string | undefined;
}

export interface ConsolidatedTDH extends BaseTDH {
  wallets: `0x${string}`[];
  consolidation_display: string;
}

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
