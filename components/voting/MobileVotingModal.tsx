import React from "react";
import { ExtendedDrop } from "../../helpers/waves/drop.helpers";
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
  const handleClose = (e?: React.MouseEvent) => {
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
      <div className="tw-py-4 tw-px-4">
        <SingleWaveDropVote drop={drop} />
      </div>
    </MobileWrapperDialog>
  );
};

export default MobileVotingModal;
