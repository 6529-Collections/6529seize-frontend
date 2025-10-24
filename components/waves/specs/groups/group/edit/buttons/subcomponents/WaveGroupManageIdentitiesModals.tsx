"use client";

import WaveGroupManageIdentitiesModal, {
  WaveGroupManageIdentitiesMode,
  WaveGroupManageIdentitiesConfirmEvent,
} from "../../WaveGroupManageIdentitiesModal";
import { WaveGroupIdentitiesModal } from "../hooks/useWaveGroupEditButtonsController";

const modalModeMap: Record<
  WaveGroupIdentitiesModal,
  WaveGroupManageIdentitiesMode
> = {
  [WaveGroupIdentitiesModal.INCLUDE]: WaveGroupManageIdentitiesMode.INCLUDE,
  [WaveGroupIdentitiesModal.EXCLUDE]: WaveGroupManageIdentitiesMode.EXCLUDE,
};

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
  const mode =
    activeModal !== null ? modalModeMap[activeModal] : null;

  if (mode === null) {
    return null;
  }

  return (
    <WaveGroupManageIdentitiesModal
      mode={mode}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
