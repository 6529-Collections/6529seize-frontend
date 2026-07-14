"use client";

import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { getTrophyArtworkCount } from "@/helpers/artist-activity.helpers";
import type { ArtistPreviewTab } from "@/hooks/useArtistPreviewModal";
import { ArtistPreviewModalContent } from "./ArtistPreviewModalContent";
import { PreviewModalShell } from "./PreviewModalShell";

export type { ArtistPreviewTab as ModalTab };

interface ArtistPreviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly user: ApiProfileMin;
  readonly activeTab: ArtistPreviewTab;
  readonly onTabChange: (tab: ArtistPreviewTab) => void;
}

export const ArtistPreviewModal = ({
  isOpen,
  onClose,
  user,
  activeTab,
  onTabChange,
}: ArtistPreviewModalProps) => {
  const hasTrophyArtworks = getTrophyArtworkCount(user) > 0;

  return (
    <PreviewModalShell isOpen={isOpen} onClose={onClose} maxWidth="5xl">
      {(isApp) => (
        <ArtistPreviewModalContent
          user={user}
          isOpen={isOpen}
          onClose={onClose}
          isApp={isApp}
          activeTab={activeTab}
          onTabChange={onTabChange}
          hasTrophyArtworks={hasTrophyArtworks}
        />
      )}
    </PreviewModalShell>
  );
};
