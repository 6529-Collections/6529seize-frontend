export interface ENS {
  created_at?: Date;
  wallet: string;
  display: string;
  consolidation_key: string | null;
  pfp?: string;
  banner_1?: string;
  banner_2?: string;
  website?: string;
  balance?: number;
  boosted_tdh?: number;
}
