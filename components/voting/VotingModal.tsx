import React, { KeyboardEvent } from "react";
import { ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { SingleWaveDropVote } from "../waves/drop/SingleWaveDropVote";
import ModalLayout from "../waves/memes/submission/layout/ModalLayout";
import SecondaryButton from "../utils/button/SecondaryButton";

interface VotingModalProps {
  readonly drop: ExtendedDrop;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const VotingModal: React.FC<VotingModalProps> = ({
  drop,
  isOpen,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <div
      className="tw-fixed tw-inset-0 tw-bg-iron-700/60 tw-backdrop-blur-sm tw-z-50 tw-flex tw-items-center tw-justify-center"
      role="presentation"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className="tw-fixed tw-inset-0"
        role="presentation"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        aria-hidden="true"
      ></div>

      <div
        className="tw-w-full tw-max-w-2xl tw-z-10"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <ModalLayout title="Vote for this artwork" onCancel={onClose}>
          <div className="tw-pb-6 tw-pt-1">
            <SingleWaveDropVote drop={drop} onVoteSuccess={onClose} />

            <div className="tw-mt-4 tw-flex tw-justify-end">
              <SecondaryButton onClicked={onClose}>Cancel</SecondaryButton>
            </div>
          </div>
        </ModalLayout>
      </div>
    </div>
  );
};

export default VotingModal;
