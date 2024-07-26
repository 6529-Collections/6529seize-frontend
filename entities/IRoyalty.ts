export interface Royalty {
  token_id: number;
  contract: string;
  name: string;
  artist: string;
  thumbnail: string;
  volume: number;
  proceeds: number;
  artist_split: number;
  artist_take: number;
}
