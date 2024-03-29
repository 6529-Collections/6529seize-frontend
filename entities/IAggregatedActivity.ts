export interface AggregatedActivity {
  consolidation_key: string;
  primary_purchases_value: number;
  primary_purchases_count: number;
  secondary_purchases_value: number;
  secondary_purchases_count: number;
  burns: number;
  sales_value: number;
  sales_count: number;
  airdrops: number;
  transfers_in: number;
  transfers_out: number;
  primary_purchases_value_memes: number;
  primary_purchases_count_memes: number;
  secondary_purchases_value_memes: number;
  secondary_purchases_count_memes: number;
  burns_memes: number;
  sales_value_memes: number;
  sales_count_memes: number;
  airdrops_memes: number;
  transfers_in_memes: number;
  transfers_out_memes: number;
  primary_purchases_value_memelab: number;
  primary_purchases_count_memelab: number;
  secondary_purchases_value_memelab: number;
  secondary_purchases_count_memelab: number;
  burns_memelab: number;
  sales_value_memelab: number;
  sales_count_memelab: number;
  airdrops_memelab: number;
  transfers_in_memelab: number;
  transfers_out_memelab: number;
  primary_purchases_value_gradients: number;
  primary_purchases_count_gradients: number;
  secondary_purchases_value_gradients: number;
  secondary_purchases_count_gradients: number;
  burns_gradients: number;
  sales_value_gradients: number;
  sales_count_gradients: number;
  airdrops_gradients: number;
  transfers_in_gradients: number;
  transfers_out_gradients: number;
  primary_purchases_value_nextgen: number;
  primary_purchases_count_nextgen: number;
  secondary_purchases_value_nextgen: number;
  secondary_purchases_count_nextgen: number;
  burns_nextgen: number;
  sales_value_nextgen: number;
  sales_count_nextgen: number;
  airdrops_nextgen: number;
  transfers_in_nextgen: number;
  transfers_out_nextgen: number;
}

export interface AggregatedActivityMemes {
  consolidation_key: string;
  season: number;
  primary_purchases_value: number;
  primary_purchases_count: number;
  secondary_purchases_value: number;
  secondary_purchases_count: number;
  burns: number;
  sales_value: number;
  sales_count: number;
  airdrops: number;
  transfers_in: number;
  transfers_out: number;
}
