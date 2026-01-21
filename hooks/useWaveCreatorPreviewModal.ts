import { useCallback, useState } from "react";

export function useWaveCreatorPreviewModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBadgeClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    isModalOpen,
    handleBadgeClick,
    handleModalClose,
  };
}
