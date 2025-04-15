import React from "react";
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

  return (
    <div
      className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75 tw-backdrop-blur-[1px] tw-z-50 tw-flex tw-items-center tw-justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="tw-fixed tw-inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      <div
        className="tw-w-full tw-max-w-2xl tw-z-10"
        onClick={(e) => e.stopPropagation()}
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
