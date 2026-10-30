"use client";

import { useCallback, useContext, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useWaveInformationPanel } from "@/components/brain/mobile/WaveInformationPanelContext";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { WaveGroupType } from "../WaveGroup.types";
import { useWaveGroupEditButtonsController } from "./buttons/hooks/useWaveGroupEditButtonsController";
import WaveGroupEditButton from "./buttons/subcomponents/WaveGroupEditButton";
import WaveGroupChangeDialog from "./WaveGroupChangeDialog";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { useGroupMutations } from "@/hooks/groups/useGroupMutations";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { getInlineGroupIdentityFromProfile } from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import {
  buildWaveUpdateBody,
  getScopedGroup,
} from "./buttons/utils/waveGroupEdit";
import {
  getCloneReferenceState,
  hideUnattachedClone,
} from "./buttons/utils/waveGroupCloneRecovery";
import SubwaveAccessWarningDialog from "@/components/waves/groups/SubwaveAccessWarningDialog";

const GROUP_LABEL_KEYS = {
  VIEW: "waves.chatSettings.groups.view",
  DROP: "waves.chatSettings.groups.drop",
  VOTE: "waves.chatSettings.groups.vote",
  CHAT: "waves.create.groups.editAccess.chatLabel",
  ADMIN: "waves.chatSettings.groups.admin",
} satisfies Record<WaveGroupType, MessageKey>;

interface WaveGroupEditButtonsProps {
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
}

export default function WaveGroupEditButtons({
  wave,
  type,
}: WaveGroupEditButtonsProps) {
  const locale = useBrowserLocale();
  const { setToast, requestAuth, connectedProfile } = useContext(AuthContext);
  const { onWaveCreated, onGroupCreate } = useContext(ReactQueryWrapperContext);
  const skipNextGroupChangeAuthRef = useRef(false);
  const lastCreatedGroupIdRef = useRef<string | null>(null);
  const scopedGroup = useMemo(() => getScopedGroup(wave, type), [wave, type]);
  const defaultIncludedIdentity = useMemo(
    () => getInlineGroupIdentityFromProfile(connectedProfile),
    [connectedProfile]
  );
  const groupLabel = t(locale, GROUP_LABEL_KEYS[type]);
  const panel = useWaveInformationPanel(
    t(locale, "waves.create.groups.editAccess.title", { groupLabel })
  );
  const { close: closePanel } = panel;
  const { submit: submitInlineGroup } = useGroupMutations({
    requestAuth,
    onGroupCreate,
  });

  const { mutating, updateWave, subwaveAccessConfirmation } =
    useWaveGroupEditButtonsController({
      wave,
      type,
      requestAuth,
      setToast,
      onWaveCreated,
    });

  const handleChangeGroupClose = useCallback(() => {
    skipNextGroupChangeAuthRef.current = false;
    closePanel();
  }, [closePanel]);

  const handleGroupChange = useCallback(
    async (group: ApiGroupFull | null): Promise<boolean> => {
      const skipAuth = skipNextGroupChangeAuthRef.current;
      skipNextGroupChangeAuthRef.current = false;
      const groupId = group?.id ?? null;
      const createdGroupId =
        groupId !== null && lastCreatedGroupIdRef.current === groupId
          ? groupId
          : null;

      try {
        const updated = await updateWave(
          buildWaveUpdateBody(wave, type, groupId),
          {
            skipAuth,
          }
        );
        if (updated) {
          lastCreatedGroupIdRef.current = null;
          closePanel();
          return true;
        }
        if (createdGroupId) {
          await hideUnattachedClone({
            waveId: wave.id,
            groupId: createdGroupId,
          });
          lastCreatedGroupIdRef.current = null;
        }
      } catch {
        if (createdGroupId) {
          const referenceState = await getCloneReferenceState({
            waveId: wave.id,
            groupId: createdGroupId,
          });
          if (referenceState === "attached") {
            lastCreatedGroupIdRef.current = null;
            onWaveCreated();
            closePanel();
            return true;
          }
          if (referenceState === "unattached") {
            await hideUnattachedClone({
              waveId: wave.id,
              groupId: createdGroupId,
            });
            lastCreatedGroupIdRef.current = null;
          }
        }
        // updateWave already surfaces mutation failures through the shared toast.
      }
      return false;
    },
    [closePanel, onWaveCreated, type, updateWave, wave]
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

      skipNextGroupChangeAuthRef.current = true;
      lastCreatedGroupIdRef.current = result.group.id;

      return result.group;
    },
    [connectedProfile?.handle, setToast, submitInlineGroup]
  );

  const editor = panel.isOpen ? (
    <WaveGroupChangeDialog
      wave={wave}
      type={type}
      currentGroup={scopedGroup}
      defaultIncludedIdentity={defaultIncludedIdentity}
      accessLabel={groupLabel}
      disabled={mutating}
      embedded={panel.isInSheet}
      onClose={handleChangeGroupClose}
      onGroupChange={handleGroupChange}
      onCreateGroup={handleInlineGroupCreate}
    />
  ) : null;

  return (
    <>
      <WaveGroupEditButton
        disabled={mutating}
        loading={mutating}
        label={t(locale, "waves.create.groups.editAccess.triggerLabel", {
          groupLabel,
        })}
        onClick={(trigger) => {
          skipNextGroupChangeAuthRef.current = false;
          panel.open(trigger);
        }}
        expanded={panel.isOpen}
        controls={panel.isInSheet ? panel.contentId : undefined}
      />
      {panel.isInSheet
        ? panel.container && createPortal(editor, panel.container)
        : editor}
      <SubwaveAccessWarningDialog
        isOpen={subwaveAccessConfirmation.isOpen}
        onDecision={subwaveAccessConfirmation.onDecision}
      />
    </>
  );
}
