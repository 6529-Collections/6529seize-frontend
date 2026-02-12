"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiWaveCurationGroup } from "@/generated/models/ApiWaveCurationGroup";
import type { ApiWaveCurationGroupRequest } from "@/generated/models/ApiWaveCurationGroupRequest";
import { AuthContext } from "@/components/auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import SelectGroupModalWrapper from "@/components/utils/select-group/SelectGroupModalWrapper";
import WaveGroupManageIdentitiesModal, {
  WaveGroupManageIdentitiesMode,
  type WaveGroupManageIdentitiesConfirmEvent,
} from "@/components/waves/specs/groups/group/edit/WaveGroupManageIdentitiesModal";
import WaveGroupRemoveModal from "@/components/waves/specs/groups/group/edit/WaveGroupRemoveModal";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";
import { toErrorMessage } from "@/services/groups/groupMutations";
import {
  createPublishedGroupForIdentityChange,
  IdentityGroupWorkflowMode,
} from "@/components/waves/specs/groups/group/edit/buttons/utils/identityGroupWorkflow";

const curationGroupsQueryKey = (waveId: string) =>
  [QueryKey.WAVE_CURATION_GROUPS, { wave_id: waveId }] as const;

interface WaveCurationGroupMenuProps {
  readonly hasGroup: boolean;
  readonly disabled: boolean;
  readonly onAddGroup: () => void;
  readonly onIncludeIdentity?: () => void;
  readonly onExcludeIdentity?: () => void;
  readonly onChangeGroup?: () => void;
  readonly onRemoveGroup?: () => void;
}

function WaveCurationGroupMenu({
  hasGroup,
  disabled,
  onAddGroup,
  onIncludeIdentity,
  onExcludeIdentity,
  onChangeGroup,
  onRemoveGroup,
}: WaveCurationGroupMenuProps) {
  const menuItems = useMemo<CompactMenuItem[]>(() => {
    const items: CompactMenuItem[] = [
      {
        id: "add",
        label: "Add group",
        onSelect: onAddGroup,
      },
    ];

    if (!hasGroup) {
      return items;
    }

    if (onIncludeIdentity) {
      items.push({
        id: "include",
        label: "Include identity",
        onSelect: onIncludeIdentity,
      });
    }

    if (onExcludeIdentity) {
      items.push({
        id: "exclude",
        label: "Exclude identity",
        onSelect: onExcludeIdentity,
      });
    }

    if (onChangeGroup) {
      items.push({
        id: "change",
        label: "Change group",
        onSelect: onChangeGroup,
      });
    }

    if (onRemoveGroup) {
      items.push({
        id: "remove",
        label: "Remove group",
        onSelect: onRemoveGroup,
        className: "tw-text-red desktop-hover:hover:tw-text-red",
      });
    }

    return items;
  }, [
    hasGroup,
    onAddGroup,
    onIncludeIdentity,
    onExcludeIdentity,
    onChangeGroup,
    onRemoveGroup,
  ]);

  return (
    <CompactMenu
      triggerClassName="tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
      trigger={
        <>
          <span className="tw-sr-only">Curation group options</span>
          <FontAwesomeIcon
            icon={faGear}
            className="tw-size-5 tw-flex-shrink-0"
          />
        </>
      }
      aria-label="Curation group options"
      items={menuItems}
      disabled={disabled}
    />
  );
}

export default function WaveCurationGroupsSection({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useContext(AuthContext);
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const queryClient = useQueryClient();
  const abortControllersRef = useRef(new Set<AbortController>());
  const [mutating, setMutating] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ApiWaveCurationGroup | null>(
    null
  );
  const [groupPickerState, setGroupPickerState] = useState<
    | {
        readonly mode: "add";
      }
    | {
        readonly mode: "change";
        readonly curationGroup: ApiWaveCurationGroup;
      }
    | null
  >(null);
  const [identityModalState, setIdentityModalState] = useState<{
    readonly curationGroup: ApiWaveCurationGroup;
    readonly mode: WaveGroupManageIdentitiesMode;
  } | null>(null);

  const canManageCurationGroups = canEditWave({
    connectedProfile,
    activeProfileProxy,
    wave,
  });

  useEffect(() => {
    const abortControllers = abortControllersRef.current;

    return () => {
      abortControllers.forEach((controller) => controller.abort());
      abortControllers.clear();
    };
  }, []);

  const {
    data: curationGroups = [],
    isLoading,
    isError,
  } = useQuery<ApiWaveCurationGroup[]>({
    queryKey: curationGroupsQueryKey(wave.id),
    queryFn: async () =>
      await commonApiFetch<ApiWaveCurationGroup[]>({
        endpoint: `waves/${wave.id}/curation-groups`,
      }),
    enabled: wave.wave.type !== ApiWaveType.Chat,
  });

  const refreshCurationGroups = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: curationGroupsQueryKey(wave.id),
    });
    onWaveCreated();
  }, [queryClient, wave.id, onWaveCreated]);

  const ensureAuthenticated = useCallback(async () => {
    const { success } = await requestAuth();
    if (success) {
      return true;
    }
    setToast({
      type: "error",
      message: "Failed to authenticate",
    });
    return false;
  }, [requestAuth, setToast]);

  const updateCurationGroup = useCallback(
    async ({
      curationGroupId,
      body,
    }: {
      readonly curationGroupId: string;
      readonly body: ApiWaveCurationGroupRequest;
    }) => {
      await commonApiPost<ApiWaveCurationGroupRequest, ApiWaveCurationGroup>({
        endpoint: `waves/${wave.id}/curation-groups/${curationGroupId}`,
        body,
      });
    },
    [wave.id]
  );

  const onGroupSelect = useCallback(
    async (group: ApiGroupFull) => {
      setMutating(true);
      try {
        const authenticated = await ensureAuthenticated();
        if (!authenticated) {
          return;
        }

        if (groupPickerState?.mode === "change") {
          await updateCurationGroup({
            curationGroupId: groupPickerState.curationGroup.id,
            body: {
              name: group.name,
              group_id: group.id,
            },
          });
          setToast({
            type: "success",
            message: "Curation group updated.",
          });
        } else {
          await commonApiPost<
            ApiWaveCurationGroupRequest,
            ApiWaveCurationGroup
          >({
            endpoint: `waves/${wave.id}/curation-groups`,
            body: {
              name: group.name,
              group_id: group.id,
            },
          });
          setToast({
            type: "success",
            message: "Curation group added.",
          });
        }

        setGroupPickerState(null);
        await refreshCurationGroups();
      } catch (error) {
        setToast({
          type: "error",
          message: toErrorMessage(error),
        });
      } finally {
        setMutating(false);
      }
    },
    [
      ensureAuthenticated,
      groupPickerState,
      refreshCurationGroups,
      setToast,
      updateCurationGroup,
      wave.id,
    ]
  );

  const onRemoveCurationGroup = useCallback(async () => {
    if (!removeTarget) {
      return;
    }

    setMutating(true);
    try {
      const authenticated = await ensureAuthenticated();
      if (!authenticated) {
        return;
      }

      await commonApiDelete({
        endpoint: `waves/${wave.id}/curation-groups/${removeTarget.id}`,
      });

      setToast({
        type: "success",
        message: "Curation group removed.",
      });
      setRemoveTarget(null);
      await refreshCurationGroups();
    } catch (error) {
      setToast({
        type: "error",
        message: toErrorMessage(error),
      });
    } finally {
      setMutating(false);
    }
  }, [
    ensureAuthenticated,
    refreshCurationGroups,
    removeTarget,
    setToast,
    wave.id,
  ]);

  const onIdentityModalConfirm = useCallback(
    async (
      curationGroup: ApiWaveCurationGroup,
      event: WaveGroupManageIdentitiesConfirmEvent
    ) => {
      setMutating(true);
      try {
        const authenticated = await ensureAuthenticated();
        if (!authenticated) {
          return;
        }

        const mode =
          event.mode === WaveGroupManageIdentitiesMode.INCLUDE
            ? IdentityGroupWorkflowMode.INCLUDE
            : IdentityGroupWorkflowMode.EXCLUDE;

        const nextGroupId = await createPublishedGroupForIdentityChange({
          identity: event.identity,
          mode,
          waveId: wave.id,
          waveName: wave.name,
          groupLabel: "Curation",
          scopedGroupId: curationGroup.group_id,
          queryClient,
          abortControllers: abortControllersRef.current,
        });

        await updateCurationGroup({
          curationGroupId: curationGroup.id,
          body: {
            name: curationGroup.name,
            group_id: nextGroupId,
          },
        });

        const successMessage =
          mode === IdentityGroupWorkflowMode.INCLUDE
            ? "Identity successfully included in the group."
            : "Identity successfully excluded from the group.";

        setToast({
          type: "success",
          message: successMessage,
        });
        await refreshCurationGroups();
      } catch (error) {
        setToast({
          type: "error",
          message: toErrorMessage(error),
        });
      } finally {
        setMutating(false);
      }
    },
    [
      ensureAuthenticated,
      queryClient,
      refreshCurationGroups,
      setToast,
      updateCurationGroup,
      wave.id,
      wave.name,
    ]
  );

  if (wave.wave.type === ApiWaveType.Chat) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="tw-group tw-relative tw-flex tw-h-6 tw-w-full tw-items-center tw-justify-between tw-text-sm">
        <span className="tw-font-medium tw-text-iron-500">Curation</span>
        <span className="tw-inline-flex tw-items-center tw-gap-2 tw-text-iron-300">
          <CircleLoader />
          <span>Loading</span>
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="tw-group tw-relative tw-flex tw-h-6 tw-w-full tw-items-center tw-justify-between tw-text-sm">
        <span className="tw-font-medium tw-text-iron-500">Curation</span>
        <span className="tw-font-medium tw-text-red">Unavailable</span>
      </div>
    );
  }

  const rows =
    curationGroups.length > 0
      ? curationGroups
      : [
          {
            id: "__empty__",
            name: "None",
            wave_id: wave.id,
            group_id: "",
            created_at: 0,
            updated_at: 0,
          } satisfies ApiWaveCurationGroup,
        ];

  return (
    <>
      {rows.map((curationGroup) => {
        const isPlaceholder = curationGroup.id === "__empty__";

        return (
          <div
            key={curationGroup.id}
            className="tw-group tw-relative tw-flex tw-h-6 tw-w-full tw-items-center tw-justify-between tw-text-sm"
          >
            <div className="tw-flex tw-gap-x-4">
              <span className="tw-font-medium tw-text-iron-500">Curation</span>
            </div>
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <span className="tw-max-w-40 tw-truncate tw-text-sm tw-font-medium tw-text-iron-200">
                {curationGroup.name}
              </span>
              {canManageCurationGroups && (
                <div className="tw-ml-1">
                  <WaveCurationGroupMenu
                    hasGroup={!isPlaceholder}
                    disabled={mutating}
                    onAddGroup={() => setGroupPickerState({ mode: "add" })}
                    {...(isPlaceholder
                      ? {}
                      : {
                          onIncludeIdentity: () =>
                            setIdentityModalState({
                              curationGroup,
                              mode: WaveGroupManageIdentitiesMode.INCLUDE,
                            }),
                          onExcludeIdentity: () =>
                            setIdentityModalState({
                              curationGroup,
                              mode: WaveGroupManageIdentitiesMode.EXCLUDE,
                            }),
                          onChangeGroup: () =>
                            setGroupPickerState({
                              mode: "change",
                              curationGroup,
                            }),
                          onRemoveGroup: () => setRemoveTarget(curationGroup),
                        })}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

      <SelectGroupModalWrapper
        isOpen={groupPickerState !== null}
        onClose={() => setGroupPickerState(null)}
        onGroupSelect={onGroupSelect}
      />

      {removeTarget && (
        <WaveGroupRemoveModal
          closeModal={() => setRemoveTarget(null)}
          removeGroup={onRemoveCurationGroup}
        />
      )}

      {identityModalState && (
        <WaveGroupManageIdentitiesModal
          mode={identityModalState.mode}
          onClose={() => setIdentityModalState(null)}
          onConfirm={(event) =>
            onIdentityModalConfirm(identityModalState.curationGroup, event)
          }
        />
      )}
    </>
  );
}
