import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDropVote } from "../waves/drop/SingleWaveDropVote";
import MobileWrapperDialog from "../mobile-wrapper-dialog/MobileWrapperDialog";

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
  const handleClose = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  return (
    <MobileWrapperDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Vote for this artwork"
    >
      <div className="tw-pt-2 tw-pb-2 tw-px-4">
        <SingleWaveDropVote drop={drop} onVoteSuccess={onClose} />
      </div>
    </MobileWrapperDialog>
  );
};

export default MobileVotingModal;
