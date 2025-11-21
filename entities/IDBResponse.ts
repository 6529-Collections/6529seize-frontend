export interface DBResponse<T = any> {
  count: number;
  page: number;
  next: any;
  data: T[];
}

interface LeaderboardDBResponse<T = any> extends DBResponse<T> {
  memes_collection_count: number;
}
