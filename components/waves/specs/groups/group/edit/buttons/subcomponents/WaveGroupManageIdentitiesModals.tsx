"use client";

import WaveGroupManageIdentitiesModal, {
  WaveGroupManageIdentitiesMode,
} from "../../WaveGroupManageIdentitiesModal";
import { WaveGroupIdentitiesModal } from "../hooks/useWaveGroupEditButtonsController";

interface WaveGroupManageIdentitiesModalsProps {
  readonly activeModal: WaveGroupIdentitiesModal | null;
  readonly onClose: () => void;
}

export default function WaveGroupManageIdentitiesModals({
  activeModal,
  onClose,
}: WaveGroupManageIdentitiesModalsProps) {
  return (
    <>
      {activeModal === WaveGroupIdentitiesModal.INCLUDE ? (
        <WaveGroupManageIdentitiesModal
          mode={WaveGroupManageIdentitiesMode.INCLUDE}
          onClose={onClose}
        />
      ) : null}
      {activeModal === WaveGroupIdentitiesModal.EXCLUDE ? (
        <WaveGroupManageIdentitiesModal
          mode={WaveGroupManageIdentitiesMode.EXCLUDE}
          onClose={onClose}
        />
      ) : null}
    </>
  );
}
