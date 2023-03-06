export interface IDistribution {
  created_at: Date;
  updated_at: Date;
  card_id: number;
  contract: string;
  phase: string;
  wallet: string;
  display: string;
  count: number;
}

export interface IDistributionPhoto {
  created_at: Date;
  updated_at: Date;
  id: number;
  card_id: number;
  contract: string;
  link: string;
}
