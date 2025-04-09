import { useState } from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ParticipationDropRatings } from "./ParticipationDropRatings";
import { format } from "date-fns";
import { useDropInteractionRules } from "../../../../hooks/drops/useDropInteractionRules";
import { VotingModal, MobileVotingModal } from "../../../../components/voting";
import VotingModalButton from "../../../../components/voting/VotingModalButton";
import useIsMobileScreen from "../../../../hooks/isMobileScreen";

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
          className="tw-px-4 sm:tw-ml-[3.25rem] tw-pt-4 tw-pb-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="tw-flex sm:tw-justify-between tw-flex-wrap sm:tw-flex-nowrap tw-items-center">
            {!!drop.raters_count && (
              <ParticipationDropRatings drop={drop} rank={drop.rank} />
            )}

            <div className="sm:tw-ml-auto tw-pt-4">
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
        <div className="tw-px-4 sm:tw-ml-[3.25rem] tw-pb-4">
          <ParticipationDropRatings drop={drop} rank={drop.rank} />
        </div>
      )}

      <div className="tw-px-4 sm:tw-ml-[3.25rem] tw-pb-3 tw-text-[11px] tw-text-iron-500 tw-border-t tw-border-iron-800/30">
        {format(new Date(drop.created_at), "h:mm a · MMM d, yyyy")}
      </div>
    </>
  );
}
