"use client";

import { useCallback, useContext, useMemo, useRef, useState } from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { WaveGroupType } from "../WaveGroup.types";
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
import WaveGroupChangeDialog from "./WaveGroupChangeDialog";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { useGroupMutations } from "@/hooks/groups/useGroupMutations";
import {
  buildWaveUpdateBody,
  getScopedGroup,
} from "./buttons/utils/waveGroupEdit";

interface WaveGroupEditButtonsProps {
  readonly haveGroup: boolean;
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
}

export default function WaveGroupEditButtons({
  haveGroup,
  wave,
  type,
}: WaveGroupEditButtonsProps) {
  const { setToast, requestAuth, connectedProfile } = useContext(AuthContext);
  const { onWaveCreated, onGroupCreate } = useContext(ReactQueryWrapperContext);
  const [isGroupChangeOpen, setIsGroupChangeOpen] = useState(false);
  const skipNextGroupChangeAuthRef = useRef(false);
  const scopedGroup = useMemo(() => getScopedGroup(wave, type), [wave, type]);
  const { submit: submitInlineGroup } = useGroupMutations({
    requestAuth,
    onGroupCreate,
  });

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
      void onIdentityConfirm({ identity, mode: normalizedMode });
    },
    [onIdentityConfirm]
  );

  const handleIncludeIdentity = useCallback(
    () => openIdentitiesModal(WaveGroupIdentitiesModal.INCLUDE),
    [openIdentitiesModal]
  );

  const handleExcludeIdentity = useCallback(
    () => openIdentitiesModal(WaveGroupIdentitiesModal.EXCLUDE),
    [openIdentitiesModal]
  );

  const handleChangeGroupOpen = useCallback(() => {
    setIsGroupChangeOpen(true);
  }, []);

  const handleChangeGroupClose = useCallback(() => {
    skipNextGroupChangeAuthRef.current = false;
    setIsGroupChangeOpen(false);
  }, []);

  const handleGroupChange = useCallback(
    async (group: ApiGroupFull | null) => {
      if (!group) {
        return;
      }

      const skipAuth = skipNextGroupChangeAuthRef.current;
      skipNextGroupChangeAuthRef.current = false;

      try {
        await updateWave(buildWaveUpdateBody(wave, type, group.id), {
          skipAuth,
        });
        setIsGroupChangeOpen(false);
      } catch {
        // updateWave already surfaces mutation failures through the shared toast.
      }
    },
    [type, updateWave, wave]
  );

  const handleInlineGroupCreate = useCallback(
    async (payload: ApiCreateGroup): Promise<ApiGroupFull | null> => {
      const result = await submitInlineGroup({
        payload,
        currentHandle: connectedProfile?.handle ?? null,
      });

      if (!result.ok) {
        if (result.reason !== "auth") {
          setToast({
            type: "error",
            title: "Couldn't create this group.",
            description: "Please check the group setup and try again.",
            details: result.error,
          });
        }
        return null;
      }

      setToast({
        message: "Group created.",
        type: "success",
      });
      skipNextGroupChangeAuthRef.current = true;

      return result.group;
    },
    [connectedProfile?.handle, setToast, submitInlineGroup]
  );

  if (mutating) {
    return (
      <output
        aria-live="polite"
        className="tw-inline-flex tw-items-center tw-gap-2"
      >
        <CircleLoader />
        <span className="tw-sr-only">Updating wave group</span>
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
        onChangeGroup={handleChangeGroupOpen}
      />
      {isGroupChangeOpen && (
        <WaveGroupChangeDialog
          wave={wave}
          type={type}
          currentGroup={scopedGroup}
          onClose={handleChangeGroupClose}
          onGroupChange={handleGroupChange}
          onCreateGroup={handleInlineGroupCreate}
        />
      )}
      <WaveGroupManageIdentitiesModals
        activeModal={activeIdentitiesModal}
        onClose={closeIdentitiesModal}
        onConfirm={handleIdentityConfirm}
      />
    </>
  );
}
