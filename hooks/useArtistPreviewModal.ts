import { useState, useCallback } from "react";

export type ArtistPreviewTab = "active" | "winners";

export function useArtistPreviewModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<ArtistPreviewTab>("active");

  const handleBadgeClick = useCallback((tab: ArtistPreviewTab) => {
    setModalInitialTab(tab);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    isModalOpen,
    modalInitialTab,
    handleBadgeClick,
    handleModalClose,
  };
}
