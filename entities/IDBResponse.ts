export interface DBResponse {
  count: number;
  page: number;
  next: any;
  data: any[];
}

interface LeaderboardDBResponse {
  count: number;
  page: number;
  next: any;
  data: any[];
  memes_collection_count: number;
}
