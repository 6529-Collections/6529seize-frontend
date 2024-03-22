export interface SubscriptionBalance {
  created_at: Date;
  updated_at: Date;
  consolidation_key: string;
  balance: number;
}

export interface SubscriptionTopUp {
  hash: string;
  block: number;
  from_wallet: string;
  amount: number;
}
