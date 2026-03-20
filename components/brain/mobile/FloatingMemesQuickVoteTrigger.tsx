"use client";

import MemesWaveQuickVoteTrigger from "../left-sidebar/waves/MemesWaveQuickVoteTrigger";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";

interface FloatingMemesQuickVoteTriggerProps {
  readonly onOpenQuickVote: () => void;
}

export default function FloatingMemesQuickVoteTrigger({
  onOpenQuickVote,
}: FloatingMemesQuickVoteTriggerProps) {
  const { isReady, uncastPower, unratedCount } = useMemesWaveFooterStats();

  if (!isReady || typeof uncastPower !== "number" || unratedCount <= 0) {
    return null;
  }

  return (
    <div className="tw-absolute tw-right-2 tw-top-2 tw-z-20 sm:tw-right-4 sm:tw-top-3">
      <MemesWaveQuickVoteTrigger
        onOpenQuickVote={onOpenQuickVote}
        unratedCount={unratedCount}
      />
    </div>
  );
}
