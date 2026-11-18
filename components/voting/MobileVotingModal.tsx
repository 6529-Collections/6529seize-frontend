"use client";

import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDropVote } from "../waves/drop/SingleWaveDropVote";
import { SingleWaveDropVoteSubmissionMode } from "../waves/drop/SingleWaveDropVote.types";
import MobileWrapperDialog from "../mobile-wrapper-dialog/MobileWrapperDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import useCapacitor from "@/hooks/useCapacitor";
import { useLayoutViewportLock } from "@/components/brain/my-stream/layout/LayoutContext";

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
  const locale = useBrowserLocale();
  const { isCapacitor, isIos } = useCapacitor();
  const followsIosKeyboard = isCapacitor && isIos;
  useLayoutViewportLock(isOpen && followsIosKeyboard);

  const handleClose = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <MobileWrapperDialog
      isOpen
      onClose={handleClose}
      title={t(locale, "waves.vote.modalTitle")}
      keyboardTransitionEasing={
        followsIosKeyboard
          ? "var(--native-keyboard-layout-transition-easing, ease-out)"
          : undefined
      }
      surfaceClassName={`tw-group/voting-dialog tw-bg-iron-950 ${followsIosKeyboard ? "[--vote-reply-easing:var(--native-keyboard-layout-transition-easing,ease-out)]" : ""}`}
    >
      <div className="tw-px-4 tw-pb-2 tw-pt-2">
        <SingleWaveDropVote
          drop={drop}
          onVoteRequestStarted={handleClose}
          submissionMode={
            SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH
          }
        />
      </div>
    </MobileWrapperDialog>
  );
};

export default MobileVotingModal;
