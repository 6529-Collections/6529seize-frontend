import { ApiWavesOverviewType } from "../../../generated/models/ApiWavesOverviewType";

export const WAVE_SORT_LABELS: Record<ApiWavesOverviewType, string> = {
  [ApiWavesOverviewType.Latest]: "Recently Created",
  [ApiWavesOverviewType.MostSubscribed]: "Most Subscribed",
  [ApiWavesOverviewType.HighLevelAuthor]: "High Level Author",
  [ApiWavesOverviewType.AuthorYouHaveRepped]: "Author You Have Repped",
  [ApiWavesOverviewType.MostDropped]: "Most Active",
  [ApiWavesOverviewType.MostDroppedByYou]: "Most Active By You",
  [ApiWavesOverviewType.RecentlyDroppedTo]: "Recent Activity",
  [ApiWavesOverviewType.RecentlyDroppedToByYou]: "Your Recent Activity",
};

export const WAVE_SORT_ORDER: ApiWavesOverviewType[] = [
  ApiWavesOverviewType.RecentlyDroppedTo,
  ApiWavesOverviewType.RecentlyDroppedToByYou,
  ApiWavesOverviewType.MostDropped,
  ApiWavesOverviewType.MostDroppedByYou,
  ApiWavesOverviewType.MostSubscribed,
  ApiWavesOverviewType.HighLevelAuthor,
  ApiWavesOverviewType.AuthorYouHaveRepped,
  ApiWavesOverviewType.Latest,
];