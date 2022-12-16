export interface Transaction {
  id: number;
  created_at: Date;
  transaction: string;
  block: number;
  transaction_date: Date;
  from_address: `0x${string}`;
  from_display: string | null;
  to_address: `0x${string}`;
  to_display: string | null;
  contract: string;
  token_id: number;
  token_count: number;
  value: number;
}
