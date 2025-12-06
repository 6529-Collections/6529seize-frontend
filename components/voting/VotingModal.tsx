"use client";

import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import React, { useEffect, useId, useRef } from "react";
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
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      dialog.showModal();
    } else {
      dialog.close();
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const modalContent = (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      className="tw-fixed tw-inset-0 tw-m-0 tw-h-full tw-w-full tw-max-h-full tw-max-w-full tw-bg-gray-600/50 tw-backdrop-blur-[1px] tw-flex tw-items-center tw-justify-center tw-border-none tw-outline-none tw-p-0"
    >
      <div
        className="tw-w-full tw-max-w-2xl tw-px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalLayout title="Vote for this artwork" onCancel={onClose} titleId={titleId}>
          <div className="tw-pb-6 tw-pt-1">
            <SingleWaveDropVote drop={drop} onVoteSuccess={onClose} />

            <div className="tw-mt-4 tw-flex tw-justify-end">
              <SecondaryButton onClicked={onClose}>Cancel</SecondaryButton>
            </div>
          </div>
        </ModalLayout>
      </div>
    </dialog>
  );

  return createPortal(modalContent, document.body);
};

export default VotingModal;
