export interface Season {
  season: number;
  count: number;
  token_ids: number[];
}

export interface MemeSeason {
  id: number;
  start_index: number;
  end_index: number;
  count: number;
  name: string;
  display: string;
}
