import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import React from "react";
import { createPortal } from "react-dom";
import SecondaryButton from "../utils/button/SecondaryButton";
import { SingleWaveDropVote } from "../waves/drop/SingleWaveDropVote";
import ModalLayout from "../waves/memes/submission/layout/ModalLayout";

interface VotingModalProps {
  readonly drop: ExtendedDrop;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const VotingModal: React.FC<VotingModalProps> = ({
  drop,
  isOpen,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px] tw-z-[1000] tw-flex tw-items-center tw-justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="tw-fixed tw-inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      <div
        className="tw-w-full tw-max-w-2xl tw-z-10 tw-px-4"
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

  return createPortal(modalContent, document.body);
};

export default VotingModal;
