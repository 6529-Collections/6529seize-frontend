"use client";

import { MobileVotingModal, VotingModal } from "@/components/voting";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import type { FC, RefObject } from "react";
import { useCallback, useMemo, useRef, useState } from "react";

interface ActiveVotingDrop {
  readonly id: string;
  readonly snapshot: ExtendedDrop;
}

export function useWaveLeaderboardVotingModal(
  drops: readonly ExtendedDrop[],
  fallbackFocusRef?: RefObject<HTMLElement | null>
) {
  const [activeVotingDrop, setActiveVotingDrop] =
    useState<ActiveVotingDrop | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openVotingModal = useCallback((drop: ExtendedDrop) => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setActiveVotingDrop({ id: drop.id, snapshot: drop });
  }, []);

  const closeVotingModal = useCallback(() => {
    const trigger = triggerRef.current;
    triggerRef.current = null;
    setActiveVotingDrop(null);

    const restoreFocus = () => {
      if (trigger?.isConnected) {
        trigger.focus();
        return;
      }
      fallbackFocusRef?.current?.focus({ preventScroll: true });
    };

    if (typeof globalThis.requestAnimationFrame === "function") {
      globalThis.requestAnimationFrame(restoreFocus);
    } else {
      restoreFocus();
    }
  }, [fallbackFocusRef]);

  const votingDrop = useMemo(() => {
    if (!activeVotingDrop) {
      return null;
    }

    return (
      drops.find((drop) => drop.id === activeVotingDrop.id) ??
      activeVotingDrop.snapshot
    );
  }, [activeVotingDrop, drops]);

  return {
    votingDrop,
    openVotingModal,
    closeVotingModal,
  };
}

interface WaveLeaderboardVotingModalProps {
  readonly drop: ExtendedDrop | null;
  readonly onClose: () => void;
}

export const WaveLeaderboardVotingModal: FC<WaveLeaderboardVotingModalProps> = ({
  drop,
  onClose,
}) => {
  const isMobileScreen = useIsMobileScreen();

  if (!drop) {
    return null;
  }

  return isMobileScreen ? (
    <MobileVotingModal drop={drop} isOpen onClose={onClose} />
  ) : (
    <VotingModal drop={drop} isOpen onClose={onClose} />
  );
};
