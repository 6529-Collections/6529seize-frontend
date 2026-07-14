"use client";

import { PreviewModalShell } from "./PreviewModalShell";
import { WaveCreatorPreviewModalContent } from "./WaveCreatorPreviewModalContent";
import type { WaveCreatorPreviewUser } from "./waveCreatorPreview.types";

interface WaveCreatorPreviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly user: WaveCreatorPreviewUser;
}

export const WaveCreatorPreviewModal = ({
  isOpen,
  onClose,
  user,
}: WaveCreatorPreviewModalProps) => (
  <PreviewModalShell isOpen={isOpen} onClose={onClose} maxWidth="3xl">
    {(isApp) => (
      <WaveCreatorPreviewModalContent
        user={user}
        isOpen={isOpen}
        onClose={onClose}
        isApp={isApp}
      />
    )}
  </PreviewModalShell>
);
