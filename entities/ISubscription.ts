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
