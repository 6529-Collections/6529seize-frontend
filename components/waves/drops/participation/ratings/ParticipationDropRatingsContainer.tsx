import type { ApiDrop } from "@/generated/models/ApiDrop";
import ApprovalDropVoteSummary from "@/components/waves/drops/ApprovalDropVoteSummary";
import { getThemeColors } from "./ParticipationDropRatingsTheme";
import type { RatingsData } from "./types";
import ParticipationDropRatingsTotalSection from "./ParticipationDropRatingsTotalSection";
import ParticipationDropRatingsVoterSection from "./ParticipationDropRatingsVoterSection";
import ParticipationDropRatingsUserSection from "./ParticipationDropRatingsUserSection";

interface ParticipationDropRatingsContainerProps {
  readonly drop: ApiDrop;
  readonly rank?: number | null | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
}

export default function ParticipationDropRatingsContainer({
  drop,
  rank = null,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
}: ParticipationDropRatingsContainerProps) {
  const isApprovalSummary =
    typeof winningThreshold === "number" &&
    Number.isFinite(winningThreshold) &&
    winningThreshold > 0;

  if (isApprovalSummary) {
    return (
      <ApprovalDropVoteSummary
        drop={drop}
        winningThreshold={winningThreshold}
        winningThresholdMinDurationMs={winningThresholdMinDurationMs}
        isVotingClosed={isVotingClosed}
        variant="chat"
      />
    );
  }

  const ratingsData: RatingsData = {
    hasRaters: drop.top_raters.length > 0,
    userRating: drop.context_profile_context?.rating ?? 0,
    currentRating: drop.rating,
  };
  const theme = getThemeColors(rank, ratingsData.currentRating < 0);

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
        <ParticipationDropRatingsTotalSection
          drop={drop}
          rank={rank}
          theme={theme}
          ratingsData={ratingsData}
          winningThreshold={winningThreshold}
          winningThresholdMinDurationMs={winningThresholdMinDurationMs}
          isVotingClosed={isVotingClosed}
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
        ratingsData={ratingsData}
      />
    </div>
  );
}
