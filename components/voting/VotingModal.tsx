"use client";

import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";

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
  const { isApp } = useDeviceInfo();

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    modalRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    if (!isApp) {
      document.body.style.overflow = "hidden";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      if (!isApp) {
        document.body.style.overflow = originalOverflow;
      }
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose, isApp]);

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
      className="tailwind-scope tw-fixed tw-inset-0 tw-bg-iron-600/60 tw-z-50 tw-flex tw-items-center tw-justify-center tw-outline-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="tw-fixed tw-inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      <div
        className="tw-w-full tw-max-w-xl tw-z-10 tw-px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalLayout title="Vote for this artwork" onCancel={onClose} titleId={titleId}>
          <SingleWaveDropVote drop={drop} onVoteSuccess={onClose} />
        </ModalLayout>
      </div>
    </div>
  );

  // In app, render inline without portal
  if (isApp) {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};

export default VotingModal;
