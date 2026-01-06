import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getThemeColors } from "./ParticipationDropRatingsTheme";
import type { RatingsData } from "./types";
import ParticipationDropRatingsTotalSection from "./ParticipationDropRatingsTotalSection";
import ParticipationDropRatingsVoterSection from "./ParticipationDropRatingsVoterSection";
import ParticipationDropRatingsUserSection from "./ParticipationDropRatingsUserSection";

interface ParticipationDropRatingsContainerProps {
  readonly drop: ApiDrop;
  readonly rank?: number | null | undefined;
}

export default function ParticipationDropRatingsContainer({
  drop,
  rank = null,
}: ParticipationDropRatingsContainerProps) {
  // Calculate all ratings data upfront
  const ratingsData: RatingsData = {
    hasRaters: drop.top_raters && drop.top_raters.length > 0,
    userRating: drop.context_profile_context?.rating ?? 0,
    currentRating: drop.rating ?? 0,
  };

  // Generate themes
  const theme = getThemeColors(rank, ratingsData.currentRating < 0);
  const userTheme = getThemeColors(rank, ratingsData.userRating < 0);

  return (
    <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-y-2 tw-gap-x-6">
      <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-x-6 tw-gap-y-2">
        <ParticipationDropRatingsTotalSection
          drop={drop}
          rank={rank}
          theme={theme}
          ratingsData={ratingsData}
        />

        <ParticipationDropRatingsVoterSection
          drop={drop}
          rank={rank}
          theme={theme}
          ratingsData={ratingsData}
        />
      </div>
      <ParticipationDropRatingsUserSection
        drop={drop}
        rank={rank}
        theme={theme}
        userTheme={userTheme}
        ratingsData={ratingsData}
      />
    </div>
  );
}
