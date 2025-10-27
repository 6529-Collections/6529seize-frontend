"use client";

import WaveGroupManageIdentitiesModal, {
  WaveGroupManageIdentitiesConfirmEvent,
  WaveGroupManageIdentitiesMode,
} from "../../WaveGroupManageIdentitiesModal";
import { WaveGroupIdentitiesModal } from "../hooks/useWaveGroupEditButtonsController";

interface WaveGroupManageIdentitiesModalsProps {
  readonly activeModal: WaveGroupIdentitiesModal | null;
  readonly onClose: () => void;
  readonly onConfirm: (event: WaveGroupManageIdentitiesConfirmEvent) => void;
}

export default function WaveGroupManageIdentitiesModals({
  activeModal,
  onClose,
  onConfirm,
}: WaveGroupManageIdentitiesModalsProps) {
  if (activeModal === null) {
    return null;
  }

  const modalMode =
    activeModal === WaveGroupIdentitiesModal.INCLUDE
      ? WaveGroupManageIdentitiesMode.INCLUDE
      : WaveGroupManageIdentitiesMode.EXCLUDE;

  return (
    <WaveGroupManageIdentitiesModal
      mode={modalMode}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
