export interface SubscriptionDetails {
  consolidation_key: string;
  last_update: number;
  balance: number;
  automatic: boolean;
}

export interface SubscriptionTopUp {
  hash: string;
  block: number;
  transaction_date: string;
  from_wallet: string;
  amount: number;
}

export interface NFTSubscription {
  consolidation_key: string;
  contract: string;
  token_id: number;
  subscribed: boolean;
}

export interface SubscriptionLog {
  created_at: string;
  id: number;
  consolidation_key: string;
  log: string;
}
