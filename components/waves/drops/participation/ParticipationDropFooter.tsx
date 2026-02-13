"use client";

import { MobileVotingModal, VotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { format } from "date-fns";
import { useState } from "react";
import DropCurationButton from "../DropCurationButton";
import WaveDropReactions from "../WaveDropReactions";
import { ParticipationDropRatings } from "./ParticipationDropRatings";

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
          className="tw-mt-4 tw-@container sm:tw-ml-[3.25rem]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="tw-flex tw-flex-col tw-gap-x-4 tw-gap-y-3 @[700px]:tw-flex-row @[700px]:tw-items-center @[700px]:tw-justify-between">
            <div className="tw-px-4">
              {!!drop.raters_count && (
                <ParticipationDropRatings drop={drop} rank={drop.rank} />
              )}
            </div>

            <div
              className="tw-flex tw-items-center tw-gap-1.5 tw-w-full tw-justify-center tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-6 tw-pt-4 @[700px]:tw-ml-auto @[700px]:tw-w-auto @[700px]:tw-border-none @[700px]:tw-px-4 @[700px]:tw-pt-0"
            >
              <DropCurationButton
                dropId={drop.id}
                waveId={drop.wave.id}
                isCuratable={drop.context_profile_context?.curatable ?? false}
                isCurated={drop.context_profile_context?.curated ?? false}
              />
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
        <div className="tw-ml-[3.25rem] tw-mt-4 tw-px-4">
          <ParticipationDropRatings drop={drop} rank={drop.rank} />
        </div>
      )}

      <div className="tw-ml-[3.25rem] tw-mt-4 tw-flex tw-w-[calc(100%-3.25rem)] tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-px-4">
        {!canShowVote && (
          <DropCurationButton
            dropId={drop.id}
            waveId={drop.wave.id}
            isCuratable={drop.context_profile_context?.curatable ?? false}
            isCurated={drop.context_profile_context?.curated ?? false}
          />
        )}
        <WaveDropReactions drop={drop} />
      </div>

      <div className="tw-mt-4 tw-border-t tw-border-iron-800/30 tw-px-4 tw-pb-3 tw-text-[11px] tw-text-iron-500 sm:tw-ml-[3.25rem]">
        {format(new Date(drop.created_at), "h:mm a · MMM d, yyyy")}
      </div>
    </>
  );
}
