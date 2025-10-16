"use client";

import { useContext } from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WaveGroupType } from "../WaveGroup";
import { useWaveGroupEditButtonsController } from "./buttons/hooks/useWaveGroupEditButtonsController";
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
    shouldAllowRemove,
    showIncludeModal,
    showExcludeModal,
    openIncludeModal,
    openExcludeModal,
    closeIncludeModal,
    closeExcludeModal,
    registerEditTrigger,
    registerRemoveTrigger,
    triggerEdit,
    triggerRemove,
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
        shouldAllowRemove={shouldAllowRemove}
        onIncludeIdentity={openIncludeModal}
        onExcludeIdentity={openExcludeModal}
        onChangeGroup={triggerEdit}
        onRemoveGroup={triggerRemove}
        registerEditTrigger={registerEditTrigger}
        registerRemoveTrigger={registerRemoveTrigger}
      />
      <WaveGroupManageIdentitiesModals
        showIncludeModal={showIncludeModal}
        showExcludeModal={showExcludeModal}
        onCloseInclude={closeIncludeModal}
        onCloseExclude={closeExcludeModal}
      />
    </>
  );
}
