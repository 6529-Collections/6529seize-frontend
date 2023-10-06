export interface VoteCategoryMedia {
  media_type: string;
  media_url: string;
}

export interface VoteCategoryInfo {
  category_tag: string;
  tally: number;
  category_display_name: string;
  category_media: VoteCategoryMedia;
  category_enabled: boolean;
  authenticated_wallet_votes: number;
}

export interface WalletStateOnMattersVoting {
  votes_left: number;
  categories: VoteCategoryInfo[];
}
