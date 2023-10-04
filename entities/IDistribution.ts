export enum DistributionPhase {
  AIRDROP = "airdrop",
  ALLOWLIST = "allowlist",
  PHASE_1 = "phase_1",
  PHASE_2 = "phase_2",
  PHASE_3 = "phase_3",
}

export interface IDistribution {
  wallet: string;
  display: string;
  contract: string;
  card_id: number;
  total_minted: number;
  card_name: string;
  card_mint_date: string;
  airdrop: number;
  allowlist: number;
  phase_1: number;
  phase_2: number;
  phase_3: number;
}

export interface IDistributionPhoto {
  created_at: Date;
  updated_at: Date;
  id: number;
  card_id: number;
  contract: string;
  link: string;
}
