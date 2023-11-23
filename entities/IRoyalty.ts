export interface Royalty {
  token_id: number;
  contract: string;
  name: string;
  artist: string;
  thumbnail: string;
  primary_volume: number;
  primary_proceeds: number;
  secondary_volume: number;
  royalties: number;
  primary_royalty_split: number;
  secondary_royalty_split: number;
  primary_artist_take: number;
  secondary_artist_take: number;
}
