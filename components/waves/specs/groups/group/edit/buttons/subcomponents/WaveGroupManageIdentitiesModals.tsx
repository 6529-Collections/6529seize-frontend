"use client";

import WaveGroupManageIdentitiesModal, {
  WaveGroupManageIdentitiesMode,
  WaveGroupManageIdentitiesConfirmEvent,
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
  return (
    <>
      {activeModal === WaveGroupIdentitiesModal.INCLUDE ? (
        <WaveGroupManageIdentitiesModal
          mode={WaveGroupManageIdentitiesMode.INCLUDE}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      ) : null}
      {activeModal === WaveGroupIdentitiesModal.EXCLUDE ? (
        <WaveGroupManageIdentitiesModal
          mode={WaveGroupManageIdentitiesMode.EXCLUDE}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      ) : null}
    </>
  );
}
