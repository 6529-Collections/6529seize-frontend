"use client";

import { useCallback, useContext } from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WaveGroupType } from "../WaveGroup.types";
import {
  useWaveGroupEditButtonsController,
  WaveGroupIdentitiesModal,
} from "./buttons/hooks/useWaveGroupEditButtonsController";
import WaveGroupEditMenu from "./buttons/subcomponents/WaveGroupEditMenu";
import WaveGroupManageIdentitiesModals from "./buttons/subcomponents/WaveGroupManageIdentitiesModals";
import {
  WaveGroupManageIdentitiesMode,
  type WaveGroupManageIdentitiesConfirmEvent,
} from "./WaveGroupManageIdentitiesModal";

export interface WaveGroupEditButtonsProps {
  readonly haveGroup: boolean;
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
}

export default function WaveGroupEditButtons({
  haveGroup,
  wave,
  type,
}: WaveGroupEditButtonsProps) {
  const { setToast, requestAuth, connectedProfile } =
    useContext(AuthContext);
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);

  const {
    mutating,
    updateWave,
    canIncludeIdentity,
    canExcludeIdentity,
    canRemoveGroup,
    activeIdentitiesModal,
    openIdentitiesModal,
    closeIdentitiesModal,
    onIdentityConfirm,
  } = useWaveGroupEditButtonsController({
    haveGroup,
    wave,
    type,
    connectedProfile,
    requestAuth,
    setToast,
    onWaveCreated,
  });

  const handleIdentityConfirm = useCallback(
    ({ identity, mode }: WaveGroupManageIdentitiesConfirmEvent) => {
      const normalizedMode =
        mode === WaveGroupManageIdentitiesMode.INCLUDE
          ? WaveGroupIdentitiesModal.INCLUDE
          : WaveGroupIdentitiesModal.EXCLUDE;
      onIdentityConfirm({ identity, mode: normalizedMode });
    },
    [onIdentityConfirm],
  );

  const handleIncludeIdentity = useCallback(
    () => openIdentitiesModal(WaveGroupIdentitiesModal.INCLUDE),
    [openIdentitiesModal],
  );

  const handleExcludeIdentity = useCallback(
    () => openIdentitiesModal(WaveGroupIdentitiesModal.EXCLUDE),
    [openIdentitiesModal],
  );

  if (mutating) {
    return (
      <output
        aria-live="polite"
        className="tw-inline-flex tw-items-center tw-gap-2">
        <CircleLoader />
        <span className="tw-sr-only">Updating wave group identities</span>
      </output>
    );
  }

  return (
    <>
      <WaveGroupEditMenu
        wave={wave}
        type={type}
        onWaveUpdate={updateWave}
        hasGroup={haveGroup}
        canIncludeIdentity={canIncludeIdentity}
        canExcludeIdentity={canExcludeIdentity}
        canRemoveGroup={canRemoveGroup}
        onIncludeIdentity={handleIncludeIdentity}
        onExcludeIdentity={handleExcludeIdentity}
      />
      <WaveGroupManageIdentitiesModals
        activeModal={activeIdentitiesModal}
        onClose={closeIdentitiesModal}
        onConfirm={handleIdentityConfirm}
      />
    </>
  );
}
