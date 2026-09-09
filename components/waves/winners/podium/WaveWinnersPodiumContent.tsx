import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { WavePodiumItem } from "./WavePodiumItem";
import ContentModerationDropGate from "@/components/content-moderation/ContentModerationDropGate";

function ModeratedPodiumItem({
  winner,
  ...props
}: React.ComponentProps<typeof WavePodiumItem>) {
  if (!winner) {
    return <WavePodiumItem winner={winner} {...props} />;
  }
  return (
    <ContentModerationDropGate drop={winner.drop} compact>
      <WavePodiumItem winner={winner} {...props} />
    </ContentModerationDropGate>
  );
}

interface WaveWinnersPodiumContentProps {
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly firstPlaceWinner?: ApiWaveDecisionWinner | undefined;
  readonly secondPlaceWinner?: ApiWaveDecisionWinner | undefined;
  readonly thirdPlaceWinner?: ApiWaveDecisionWinner | undefined;
  readonly showVoteDetails?: boolean | undefined;
  readonly outcomesVisible?: boolean | undefined;
}

export const WaveWinnersPodiumContent: React.FC<
  WaveWinnersPodiumContentProps
> = ({
  onDropClick,
  firstPlaceWinner,
  secondPlaceWinner,
  thirdPlaceWinner,
  showVoteDetails = true,
  outcomesVisible = true,
}) => {
  return (
    <div className="tw-relative tw-mx-auto tw-overflow-hidden tw-rounded-xl tw-bg-iron-950/60 tw-pt-6 lg:tw-px-4">
      <div className="tw-mx-auto md:tw-max-w-3xl">
        <div className="tw-grid tw-grid-cols-3 tw-items-end tw-gap-x-2 lg:tw-gap-x-4">
          <div>
            <ModeratedPodiumItem
              winner={secondPlaceWinner}
              onDropClick={onDropClick}
              position="second"
              customAnimationIndex={1}
              showVoteDetails={showVoteDetails}
              outcomesVisible={outcomesVisible}
            />
          </div>
          <div>
            <ModeratedPodiumItem
              winner={firstPlaceWinner}
              onDropClick={onDropClick}
              position="first"
              customAnimationIndex={0}
              showVoteDetails={showVoteDetails}
              outcomesVisible={outcomesVisible}
            />
          </div>
          <div>
            <ModeratedPodiumItem
              winner={thirdPlaceWinner}
              onDropClick={onDropClick}
              position="third"
              customAnimationIndex={2}
              showVoteDetails={showVoteDetails}
              outcomesVisible={outcomesVisible}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
