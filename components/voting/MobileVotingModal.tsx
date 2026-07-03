"use client";

import React, { useState } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDropVote } from "../waves/drop/SingleWaveDropVote";
import {
  type SingleWaveDropVoteMode,
  SingleWaveDropVoteSubmissionMode,
} from "../waves/drop/SingleWaveDropVote.types";
import MobileWrapperDialog from "../mobile-wrapper-dialog/MobileWrapperDialog";
import { VoteModeControl } from "./VoteModeControl";

interface MobileVotingModalProps {
  readonly drop: ExtendedDrop;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const MobileVotingModal: React.FC<MobileVotingModalProps> = ({
  drop,
  isOpen,
  onClose,
}) => {
  const [voteInputMode, setVoteInputMode] =
    useState<SingleWaveDropVoteMode>("slider");

  const handleClose = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setVoteInputMode("slider");
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <MobileWrapperDialog
      isOpen
      onClose={handleClose}
      title="Vote for this artwork"
      headerActions={
        <VoteModeControl value={voteInputMode} onChange={setVoteInputMode} />
      }
    >
      <div className="tw-px-4 tw-pb-2 tw-pt-2">
        <SingleWaveDropVote
          drop={drop}
          onVoteRequestStarted={handleClose}
          voteMode={voteInputMode}
          onVoteModeChange={setVoteInputMode}
          submissionMode={
            SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH
          }
        />
      </div>
    </MobileWrapperDialog>
  );
};

export default MobileVotingModal;
