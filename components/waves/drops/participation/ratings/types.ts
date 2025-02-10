import { ApiDrop } from "../../../../../generated/models/ApiDrop";

export interface RatingsSectionProps {
  readonly drop: ApiDrop;
  readonly rank: number | null;
  readonly theme: ThemeColors;
}

export interface ThemeColors {
  gradient: string;
  text: string;
  ring: string;
  indicator?: string;
}

export interface RatingsData {
  hasRaters: boolean;
  userRating: number;
  totalRating: number;
} 
