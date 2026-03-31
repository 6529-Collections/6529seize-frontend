import { useState, useCallback } from "react";

export type ArtistPreviewTab = "active" | "winners";

export function useArtistPreviewModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ArtistPreviewTab>("active");

  const handleBadgeClick = useCallback((tab: ArtistPreviewTab) => {
    setActiveTab(tab);
    setIsModalOpen(true);
  }, []);

  const handleTabChange = useCallback((tab: ArtistPreviewTab) => {
    setActiveTab(tab);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    isModalOpen,
    activeTab,
    handleBadgeClick,
    handleTabChange,
    handleModalClose,
  };
}
