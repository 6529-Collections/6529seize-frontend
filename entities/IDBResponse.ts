export interface DBResponse<T = any> {
  count: number;
  page: number;
  next: any;
  data: T[];
}

interface LeaderboardDBResponse {
  count: number;
  page: number;
  next: any;
  data: any[];
  memes_collection_count: number;
}
