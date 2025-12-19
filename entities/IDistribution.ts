interface DistributionPhaseEntry {
  phase: string;
  spots: number;
  spots_airdrop: number;
  spots_allowlist: number;
}

export interface Distribution {
  card_id: number;
  contract: string;
  wallet: string;
  wallet_display: string;
  card_name: string;
  mint_date: string;
  airdrops: number;
  total_spots: number;
  minted: number;
  allowlist: DistributionPhaseEntry[];
  total_count: number;
  phases: string[];
}

export interface DistributionPhoto {
  created_at: Date;
  updated_at: Date;
  id: number;
  card_id: number;
  contract: string;
  link: string;
}
