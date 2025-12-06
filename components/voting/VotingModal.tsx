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
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    modalRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px] tw-z-50 tw-flex tw-items-center tw-justify-center tw-outline-none"
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
        <ModalLayout title="Vote for this artwork" onCancel={onClose} titleId={titleId}>
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
