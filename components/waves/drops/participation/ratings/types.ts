import type { ApiDrop } from "@/generated/models/ApiDrop";

export interface RatingsSectionProps {
  readonly drop: ApiDrop;
  readonly rank: number | null;
  readonly theme: ThemeColors;
}

export interface ThemeColors {
  text: string;
  ring: string;
  indicator?: string | undefined;
}

export interface RatingsData {
  hasRaters: boolean;
  userRating: number;
  currentRating: number;
} 
