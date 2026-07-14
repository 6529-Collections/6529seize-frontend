"use client";

import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import type { WaveCompetitionPreviewTab } from "./WaveCompetitionBadges";
import { WaveCompetitionPreviewModalContent } from "./WaveCompetitionPreviewModalContent";
import { PreviewModalShell } from "./PreviewModalShell";

interface WaveCompetitionPreviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly user: ApiProfileMin;
  readonly wave: ApiWaveMin;
  readonly hasActiveEntries: boolean;
  readonly hasWinningEntries: boolean;
  readonly activeTab: WaveCompetitionPreviewTab;
  readonly onTabChange: (tab: WaveCompetitionPreviewTab) => void;
}

export const WaveCompetitionPreviewModal = ({
  isOpen,
  onClose,
  user,
  wave,
  hasActiveEntries,
  hasWinningEntries,
  activeTab,
  onTabChange,
}: WaveCompetitionPreviewModalProps) => (
  <PreviewModalShell isOpen={isOpen} onClose={onClose} maxWidth="5xl">
    {(isApp) => (
      <WaveCompetitionPreviewModalContent
        user={user}
        wave={wave}
        hasActiveEntries={hasActiveEntries}
        hasWinningEntries={hasWinningEntries}
        isOpen={isOpen}
        onClose={onClose}
        isApp={isApp}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    )}
  </PreviewModalShell>
);
