import { useState } from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ParticipationDropRatings } from "./ParticipationDropRatings";
import { format } from "date-fns";
import { useDropInteractionRules } from "../../../../hooks/drops/useDropInteractionRules";
import { VotingModal, MobileVotingModal } from "../../../../components/voting";
import VotingModalButton from "../../../../components/voting/VotingModalButton";
import useIsMobileScreen from "../../../../hooks/isMobileScreen";
import WaveDropReactions from "../WaveDropReactions";

interface ParticipationDropFooterProps {
  readonly drop: ExtendedDrop;
}

export default function ParticipationDropFooter({
  drop,
}: ParticipationDropFooterProps) {
  const { canShowVote } = useDropInteractionRules(drop);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const isMobileScreen = useIsMobileScreen();

  return (
    <>
      {canShowVote && (
        <div
          className="tw-@container sm:tw-ml-[3.25rem] tw-mt-4"
          onClick={(e) => e.stopPropagation()}>
          <div className="tw-flex @[700px]:tw-justify-between tw-flex-col @[700px]:tw-flex-row @[700px]:tw-items-center tw-gap-x-4 tw-gap-y-3">
            <div className="tw-px-4">
              {!!drop.raters_count && (
                <ParticipationDropRatings drop={drop} rank={drop.rank} />
              )}
            </div>

            <div className="@[700px]:tw-ml-auto tw-pt-4 tw-px-6 @[700px]:tw-px-4 tw-flex tw-justify-center @[700px]:tw-pt-0 tw-w-full @[700px]:tw-w-auto tw-border-t tw-border-solid tw-border-iron-800 @[700px]:tw-border-none tw-border-x-0 tw-border-b-0">
              <VotingModalButton
                drop={drop}
                onClick={() => setIsVotingModalOpen(true)}
              />
            </div>
          </div>
          {/* Voting modal */}
          {isMobileScreen ? (
            <MobileVotingModal
              drop={drop}
              isOpen={isVotingModalOpen}
              onClose={() => setIsVotingModalOpen(false)}
            />
          ) : (
            <VotingModal
              drop={drop}
              isOpen={isVotingModalOpen}
              onClose={() => setIsVotingModalOpen(false)}
            />
          )}
        </div>
      )}

      {/* Show ratings if no vote button */}
      {!canShowVote && !!drop.raters_count && (
        <div className="tw-mt-4 tw-px-4 tw-ml-[3.25rem]">
          <ParticipationDropRatings drop={drop} rank={drop.rank} />
        </div>
      )}

      <div className="tw-mt-4 tw-px-4 tw-flex tw-w-[calc(100%-3.25rem)] tw-ml-[3.25rem] tw-items-center tw-gap-x-2 tw-gap-y-1 tw-flex-wrap">
        <WaveDropReactions drop={drop} />
      </div>

      <div className="tw-mt-4 tw-px-4 sm:tw-ml-[3.25rem] tw-pb-3 tw-text-[11px] tw-text-iron-500 tw-border-t tw-border-iron-800/30">
        {format(new Date(drop.created_at), "h:mm a · MMM d, yyyy")}
      </div>
    </>
  );
}
