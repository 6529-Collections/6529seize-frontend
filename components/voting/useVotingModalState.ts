"use client";

import { useCallback, useState } from "react";

interface VotingModalInternalState {
  readonly isOpen: boolean;
  readonly lastIsVotingClosed: boolean;
}

interface VotingModalState {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
}

export function useVotingModalState(isVotingClosed: boolean): VotingModalState {
  const [state, setState] = useState<VotingModalInternalState>(() => ({
    isOpen: false,
    lastIsVotingClosed: isVotingClosed,
  }));

  // Reset stale modal state when voting closes during render, not in an effect.
  if (state.lastIsVotingClosed !== isVotingClosed) {
    setState({
      isOpen: isVotingClosed ? false : state.isOpen,
      lastIsVotingClosed: isVotingClosed,
    });
  }

  const open = useCallback(() => {
    if (isVotingClosed) {
      return;
    }

    setState((current) => {
      if (current.isOpen && current.lastIsVotingClosed === isVotingClosed) {
        return current;
      }

      return {
        isOpen: true,
        lastIsVotingClosed: isVotingClosed,
      };
    });
  }, [isVotingClosed]);

  const close = useCallback(() => {
    setState((current) => {
      if (!current.isOpen) {
        return current;
      }

      return {
        ...current,
        isOpen: false,
      };
    });
  }, []);

  return {
    isOpen: state.isOpen && !isVotingClosed,
    open,
    close,
  };
}
