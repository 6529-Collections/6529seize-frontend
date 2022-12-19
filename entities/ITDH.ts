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
  balance: number;
  genesis: boolean;
  memes_cards_sets: number;
  unique_memes: number;
  memes_tdh: number;
  memes_tdh__raw: number;
  memes_balance: number;
  memes_tdh_season1: number;
  memes_balance_season1: number;
  memes_tdh_season1__raw: number;
  memes_tdh_season2: number;
  memes_balance_season2: number;
  memes_tdh_season2__raw: number;
  memes: NftTDH[];
  memes_ranks: NftRank[];
  gradients_balance: number;
  gradients_tdh: number;
  gradients_tdh__raw: number;
  gradients: NftTDH[];
  gradients_ranks: NftRank[];
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
