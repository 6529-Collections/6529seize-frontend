"use client";

import { useContext } from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WaveGroupType } from "../WaveGroup";
import {
  useWaveGroupEditButtonsController,
  WaveGroupIdentitiesModal,
} from "./buttons/hooks/useWaveGroupEditButtonsController";
import WaveGroupEditMenu from "./buttons/subcomponents/WaveGroupEditMenu";
import WaveGroupManageIdentitiesModals from "./buttons/subcomponents/WaveGroupManageIdentitiesModals";

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
    onEdit,
    canIncludeIdentity,
    canExcludeIdentity,
    canRemoveGroup,
    activeIdentitiesModal,
    openIdentitiesModal,
    closeIdentitiesModal,
  } = useWaveGroupEditButtonsController({
    haveGroup,
    wave,
    type,
    connectedProfile,
    requestAuth,
    setToast,
    onWaveCreated,
  });

  if (mutating) {
    return <CircleLoader />;
  }

  return (
    <>
      <WaveGroupEditMenu
        wave={wave}
        type={type}
        onEdit={onEdit}
        canIncludeIdentity={canIncludeIdentity}
        canExcludeIdentity={canExcludeIdentity}
        canRemoveGroup={canRemoveGroup}
        onIncludeIdentity={() =>
          openIdentitiesModal(WaveGroupIdentitiesModal.INCLUDE)
        }
        onExcludeIdentity={() =>
          openIdentitiesModal(WaveGroupIdentitiesModal.EXCLUDE)
        }
      />
      <WaveGroupManageIdentitiesModals
        activeModal={activeIdentitiesModal}
        onClose={closeIdentitiesModal}
      />
    </>
  );
}
