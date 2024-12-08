import { ApiDrop } from "../../../../../../generated/models/ApiDrop";
import { getThemeColors } from "./ParticipationDropRatingsTheme";
import { RatingsData } from "./types";
import ParticipationDropRatingsTotalSection from "./ParticipationDropRatingsTotalSection";
import ParticipationDropRatingsVoterSection from "./ParticipationDropRatingsVoterSection";
import ParticipationDropRatingsUserSection from "./ParticipationDropRatingsUserSection";
import { useDropInteractionRules } from "../../../../../../hooks/drops/useDropInteractionRules";

interface ParticipationDropRatingsContainerProps {
  readonly drop: ApiDrop;
  readonly rank?: number | null;
}

export default function ParticipationDropRatingsContainer({
  drop,
  rank = null,
}: ParticipationDropRatingsContainerProps) {
  // Calculate all ratings data upfront
  const ratingsData: RatingsData = {
    hasRaters: drop.top_raters && drop.top_raters.length > 0,
    userRating: drop.context_profile_context?.rating ?? 0,
    totalRating: drop.rating ?? 0,
  };

  // Generate themes
  const theme = getThemeColors(rank, ratingsData.totalRating < 0);
  const userTheme = getThemeColors(rank, ratingsData.userRating < 0);

  const { isAuthor } = useDropInteractionRules(drop);

  return (
    <div className="tw-flex tw-items-center tw-justify-between">
      <div className="tw-flex tw-items-start tw-gap-8">
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

      {!isAuthor && (
        <ParticipationDropRatingsUserSection
          drop={drop}
          rank={rank}
          theme={theme}
          userTheme={userTheme}
          ratingsData={ratingsData}
        />
      )}
    </div>
  );
}
