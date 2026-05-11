"use client";

import { useCallback, useMemo, useState } from "react";

type VotingModalOpenToken = Readonly<{
  readonly isVotingClosed: boolean;
}>;

interface VotingModalState {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
}

export function useVotingModalState(isVotingClosed: boolean): VotingModalState {
  // Lock/unlock changes invalidate older open requests without copying prop state.
  const currentOpenToken = useMemo<VotingModalOpenToken>(
    () => ({ isVotingClosed }),
    [isVotingClosed]
  );
  const [openToken, setOpenToken] = useState<VotingModalOpenToken | null>(null);

  const open = useCallback(() => {
    if (isVotingClosed) {
      return;
    }

    setOpenToken(currentOpenToken);
  }, [currentOpenToken, isVotingClosed]);

  const close = useCallback(() => {
    setOpenToken(null);
  }, []);

  return {
    isOpen: openToken === currentOpenToken && !isVotingClosed,
    open,
    close,
  };
}
