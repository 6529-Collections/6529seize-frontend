export interface IDistribution {
  created_at: Date;
  updated_at: Date;
  card_id: number;
  card_name?: string;
  card_mint_date?: Date;
  contract: string;
  phase: string;
  wallet: string;
  display: string;
  count: number;
  mint_count: number;
  wallet_tdh?: number;
  wallet_balance?: number;
  wallet_unique_balance?: number;
}

export interface IDistributionPhoto {
  created_at: Date;
  updated_at: Date;
  id: number;
  card_id: number;
  contract: string;
  link: string;
}
