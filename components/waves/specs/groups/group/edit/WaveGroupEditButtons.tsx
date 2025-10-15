"use client";

import { useContext, useMemo, useRef, useState } from "react";
import { ApiWave } from "@/generated/models/ApiWave";
import { WaveGroupType } from "../WaveGroup";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "@/services/api/common-api";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "@/components/auth/Auth";
import WaveGroupEditButton from "./WaveGroupEditButton";
import WaveGroupRemoveButton from "./WaveGroupRemoveButton";
import { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { CompactMenu } from "@/components/common/CompactMenu";
import { ApiGroup } from "@/generated/models/ApiGroup";
import WaveGroupManageIdentitiesModal, {
  WaveGroupManageIdentitiesMode,
} from "./WaveGroupManageIdentitiesModal";

export default function WaveGroupEditButtons({
  haveGroup,
  wave,
  type,
}: {
  readonly haveGroup: boolean;
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
}) {
  const { setToast, requestAuth, connectedProfile } = useContext(AuthContext);
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState(false);
  const openEditRef = useRef<(() => void) | null>(null);
  const openRemoveRef = useRef<(() => void) | null>(null);
  const [showIncludeModal, setShowIncludeModal] = useState(false);
  const [showExcludeModal, setShowExcludeModal] = useState(false);

  const scopedGroup: ApiGroup | null = useMemo(() => {
    switch (type) {
      case WaveGroupType.VIEW:
        return wave.visibility.scope.group ?? null;
      case WaveGroupType.DROP:
        return wave.participation.scope.group ?? null;
      case WaveGroupType.VOTE:
        return wave.voting.scope.group ?? null;
      case WaveGroupType.CHAT:
        return wave.chat.scope.group ?? null;
      case WaveGroupType.ADMIN:
        return wave.wave.admin_group.group ?? null;
      default:
        return null;
    }
  }, [type, wave]);

  const isWaveAdmin =
    wave.wave.authenticated_user_eligible_for_admin ?? false;

  const isGroupAuthor = useMemo(() => {
    if (!scopedGroup || !connectedProfile) {
      return false;
    }
    const groupAuthorId =
      scopedGroup.author?.id !== undefined && scopedGroup.author?.id !== null
        ? String(scopedGroup.author.id)
        : null;
    const userId =
      connectedProfile.id !== undefined && connectedProfile.id !== null
        ? String(connectedProfile.id)
        : null;
    if (groupAuthorId && userId && groupAuthorId === userId) {
      return true;
    }
    const groupAuthorHandle = scopedGroup.author?.handle?.toLowerCase();
    const userHandle = connectedProfile.handle?.toLowerCase();
    return !!groupAuthorHandle && !!userHandle
      ? groupAuthorHandle === userHandle
      : false;
  }, [scopedGroup, connectedProfile]);

  const hasGroup = scopedGroup !== null;
  const canIncludeIdentity = hasGroup && (isWaveAdmin || isGroupAuthor);
  const canExcludeIdentity =
    isWaveAdmin || isGroupAuthor || !hasGroup;

  const editWaveMutation = useMutation({
    mutationFn: async (body: ApiUpdateWaveRequest) =>
      await commonApiPost<ApiUpdateWaveRequest, ApiWave>({
        endpoint: `waves/${wave.id}`,
        body,
      }),
    onSuccess: () => {
      onWaveCreated();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onEdit = async (body: ApiUpdateWaveRequest) => {
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        type: "error",
        message: "Failed to authenticate",
      });
      setMutating(false);
      return;
    }
    await editWaveMutation.mutateAsync(body);
  };

  if (mutating) {
    return <CircleLoader />;
  }

  if (!haveGroup || type === WaveGroupType.ADMIN) {
    openRemoveRef.current = null;
  }

  const menuItems = [
    ...(canIncludeIdentity
      ? [
          {
            id: "include",
            label: "Include identity",
            onSelect: () => setShowIncludeModal(true),
            className:
              "tw-text-iron-200 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50",
          } as const,
        ]
      : []),
    ...(canExcludeIdentity
      ? [
          {
            id: "exclude",
            label: "Exclude identity",
            onSelect: () => setShowExcludeModal(true),
            className:
              "tw-text-iron-200 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50",
          } as const,
        ]
      : []),
    {
      id: "change",
      label: "Change group",
      onSelect: () => {
        openEditRef.current?.();
      },
      className:
        "tw-text-iron-200 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50",
    } as const,
    ...(haveGroup && type !== WaveGroupType.ADMIN
      ? [
          {
            id: "remove",
            label: "Remove group",
            onSelect: () => {
              openRemoveRef.current?.();
            },
            className:
              "tw-text-red desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-red",
          } as const,
        ]
      : []),
  ];

  return (
    <>
      <div className="tw-relative">
        <div className="tw-hidden">
          <WaveGroupEditButton
            wave={wave}
            type={type}
            onEdit={onEdit}
            renderTrigger={({ open }) => {
              openEditRef.current = open;
              return null;
            }}
          />
          {haveGroup && type !== WaveGroupType.ADMIN && (
            <WaveGroupRemoveButton
              wave={wave}
              type={type}
              onEdit={onEdit}
              renderTrigger={({ open }) => {
                openRemoveRef.current = open;
                return null;
              }}
            />
          )}
        </div>
        <CompactMenu
          triggerClassName="tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
          trigger={() => (
            <>
              <span className="tw-sr-only">Group options</span>
              <Cog6ToothIcon className="tw-size-5 tw-flex-shrink-0" />
            </>
          )}
          aria-label="Group options"
          itemsWrapperClassName="tw-flex tw-flex-col"
          unstyledItems
          itemClassName="tw-flex tw-items-center tw-gap-x-2 tw-rounded-md tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-semibold tw-transition tw-duration-200 tw-ease-out"
          focusItemClassName="tw-bg-iron-800 tw-text-iron-50"
          items={menuItems}
        />
      </div>
      {showIncludeModal && (
        <WaveGroupManageIdentitiesModal
          mode={WaveGroupManageIdentitiesMode.INCLUDE}
          onClose={() => setShowIncludeModal(false)}
        />
      )}
      {showExcludeModal && (
        <WaveGroupManageIdentitiesModal
          mode={WaveGroupManageIdentitiesMode.EXCLUDE}
          onClose={() => setShowExcludeModal(false)}
        />
      )}
    </>
  );
}
