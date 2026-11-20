"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SingleWaveDropVote } from "../waves/drop/SingleWaveDropVote";
import { SingleWaveDropVoteSubmissionMode } from "../waves/drop/SingleWaveDropVote.types";
import ModalLayout from "../waves/memes/submission/layout/ModalLayout";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import useCapacitor from "@/hooks/useCapacitor";
import { useLayoutViewportLock } from "@/components/brain/my-stream/layout/LayoutContext";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import MobileVotingModal from "./MobileVotingModal";

interface VotingModalProps {
  readonly drop: ExtendedDrop;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly preferMobile?: boolean | undefined;
}

const CenteredVotingModal: React.FC<VotingModalProps> = ({
  drop,
  isOpen,
  onClose,
}) => {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const { isApp } = useDeviceInfo();
  const { isCapacitor, isIos } = useCapacitor();
  useLayoutViewportLock(isOpen && isCapacitor && isIos);
  const locale = useBrowserLocale();
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

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
        handleClose();
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
  }, [isOpen, handleClose, isApp]);

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
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1020] tw-flex tw-items-center tw-justify-center tw-bg-gray-700/75 tw-outline-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="tw-fixed tw-inset-0"
        onClick={handleClose}
        aria-hidden="true"
      ></div>

      <div
        className="tw-z-10 tw-w-full tw-max-w-[456px] tw-px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalLayout
          title={t(locale, "waves.vote.modalTitle")}
          onCancel={handleClose}
          titleId={titleId}
          showAmbientBackground={false}
          surfaceClassName="tw-relative tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-shadow-2xl"
          headerClassName="tw-relative tw-z-10 tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-3"
          titleClassName="tw-m-0 tw-text-lg tw-font-semibold tw-text-white"
          closeButtonClassName="-tw-mr-2 tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-600 tw-transition-colors desktop-hover:hover:tw-bg-white/[0.06] desktop-hover:hover:tw-text-iron-300"
          closeIconClassName="tw-size-5 tw-flex-shrink-0"
          wrapperClassName="tw-px-0"
          contentClassName="tw-group/voting-dialog tw-relative tw-z-10 tw-px-6 tw-pt-0 tw-pb-6"
        >
          <SingleWaveDropVote
            drop={drop}
            onVoteRequestStarted={handleClose}
            submissionMode={
              SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH
            }
          />
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

const OpenVotingModal: React.FC<
  VotingModalProps & { readonly useMobileSheet: boolean }
> = ({ useMobileSheet, ...props }) => {
  // Keep the adapter mounted while open so resizing cannot discard its draft.
  const [isMobileSheet] = useState(useMobileSheet);
  return isMobileSheet ? (
    <MobileVotingModal {...props} />
  ) : (
    <CenteredVotingModal {...props} />
  );
};

const VotingModal: React.FC<VotingModalProps> = (props) => {
  const isCompactLayout = useIsMobileLayoutViewport();

  if (!props.isOpen) return null;

  return (
    <OpenVotingModal
      {...props}
      useMobileSheet={props.preferMobile === true || isCompactLayout}
    />
  );
};

export default VotingModal;
