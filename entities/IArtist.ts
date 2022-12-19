export interface ArtistMemesNfts {
  id: number;
  collboration_with: string[];
}

export interface ArtistWork {
  title: string;
  link: string;
}

export interface Artist {
  name: string;
  memes: ArtistMemesNfts[];
  gradients: number[];
  bio?: string;
  pfp?: string;
  work?: ArtistWork;
  social_links?: any[];
}
