"use client";

import WaveGroupManageIdentitiesModal, {
  WaveGroupManageIdentitiesMode,
} from "../../WaveGroupManageIdentitiesModal";

interface WaveGroupManageIdentitiesModalsProps {
  readonly showIncludeModal: boolean;
  readonly showExcludeModal: boolean;
  readonly onCloseInclude: () => void;
  readonly onCloseExclude: () => void;
}

export default function WaveGroupManageIdentitiesModals({
  showIncludeModal,
  showExcludeModal,
  onCloseInclude,
  onCloseExclude,
}: WaveGroupManageIdentitiesModalsProps) {
  return (
    <>
      {showIncludeModal ? (
        <WaveGroupManageIdentitiesModal
          mode={WaveGroupManageIdentitiesMode.INCLUDE}
          onClose={onCloseInclude}
        />
      ) : null}
      {showExcludeModal ? (
        <WaveGroupManageIdentitiesModal
          mode={WaveGroupManageIdentitiesMode.EXCLUDE}
          onClose={onCloseExclude}
        />
      ) : null}
    </>
  );
}
