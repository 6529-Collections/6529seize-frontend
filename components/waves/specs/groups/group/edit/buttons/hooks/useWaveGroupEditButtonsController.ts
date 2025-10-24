"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { TypeOptions } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  createGroup,
  publishGroup,
  validateGroupPayload,
  type ValidationIssue,
  toErrorMessage,
} from "@/services/groups/groupMutations";
import { convertWaveToUpdateWave } from "@/helpers/waves/waves.helpers";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { WaveGroupType } from "../../../WaveGroup.types";
import { getScopedGroup, isGroupAuthor } from "../utils/waveGroupEdit";

const WAVE_GROUP_LABELS = {
  VIEW: "View",
  DROP: "Drop",
  VOTE: "Vote",
  CHAT: "Chat",
  ADMIN: "Admin",
} satisfies Record<WaveGroupType, string>;

const normaliseIdentity = (identity: string): string =>
  identity.trim().toLowerCase();

const dedupeAddresses = (addresses: readonly string[]): string[] =>
  Array.from(
    new Set(
      addresses
        .filter((addr): addr is string => typeof addr === "string")
        .map((addr) => addr.toLowerCase()),
    ),
  );

const fetchIdentityGroupWallets = async (
  groupId: string,
  identityGroupId: string | null,
  signal?: AbortSignal,
): Promise<string[]> => {
  if (!identityGroupId) {
    return [];
  }
  try {
    const wallets = await commonApiFetch<string[]>({
      endpoint: `groups/${groupId}/identity_groups/${identityGroupId}`,
      signal,
    });
    return dedupeAddresses(wallets);
  } catch (error) {
    console.warn(
      `[WaveGroupEditButtons] Failed to load identity group ${identityGroupId} for group ${groupId}:`,
      error,
    );
    return [];
  }
};

const waitWithAbort = async (
  ms: number,
  signal: AbortSignal,
): Promise<void> => {
  if (signal.aborted) {
    throw new DOMException("Request aborted", "AbortError");
  }
  await new Promise<void>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const onAbort = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      signal.removeEventListener("abort", onAbort);
      reject(new DOMException("Request aborted", "AbortError"));
    };

    signal.addEventListener("abort", onAbort, { once: true });
    timeoutId = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
  });
};

const cloneGroupPayload = (group: ApiGroupFull): ApiCreateGroup => ({
  name: group.name,
  group: {
    tdh: { ...group.group.tdh },
    rep: { ...group.group.rep },
    cic: { ...group.group.cic },
    level: { ...group.group.level },
    owns_nfts: group.group.owns_nfts.map((nft) => ({ ...nft })),
    identity_addresses: [],
    excluded_identity_addresses: [],
  },
  is_private: group.is_private ?? false,
});

const createEmptyGroupPayload = (name: string): ApiCreateGroup => ({
  name,
  group: {
    tdh: { min: null, max: null },
    rep: {
      min: null,
      max: null,
      direction: ApiGroupFilterDirection.Received,
      user_identity: null,
      category: null,
    },
    cic: {
      min: null,
      max: null,
      direction: ApiGroupFilterDirection.Received,
      user_identity: null,
    },
    level: { min: null, max: null },
    owns_nfts: [],
    identity_addresses: [],
    excluded_identity_addresses: [],
  },
  is_private: false,
});

const getGroupIdFromUpdateBody = (
  body: ApiUpdateWaveRequest,
  type: WaveGroupType,
): string | null => {
  switch (type) {
    case WaveGroupType.VIEW:
      return body.visibility.scope.group_id ?? null;
    case WaveGroupType.DROP:
      return body.participation.scope.group_id ?? null;
    case WaveGroupType.VOTE:
      return body.voting.scope.group_id ?? null;
    case WaveGroupType.CHAT:
      return body.chat.scope.group_id ?? null;
    case WaveGroupType.ADMIN:
      return body.wave.admin_group?.group_id ?? null;
    default:
      assertUnreachable(type);
      return null;
  }
};

const buildWaveUpdateBody = (
  wave: ApiWave,
  type: WaveGroupType,
  groupId: string | null,
): ApiUpdateWaveRequest => {
  const originalBody = convertWaveToUpdateWave(wave);
  switch (type) {
    case WaveGroupType.VIEW:
      return {
        ...originalBody,
        visibility: {
          ...originalBody.visibility,
          scope: {
            ...originalBody.visibility.scope,
            group_id: groupId,
          },
        },
      };
    case WaveGroupType.DROP:
      return {
        ...originalBody,
        participation: {
          ...originalBody.participation,
          scope: {
            ...originalBody.participation.scope,
            group_id: groupId,
          },
        },
      };
    case WaveGroupType.VOTE:
      return {
        ...originalBody,
        voting: {
          ...originalBody.voting,
          scope: {
            ...originalBody.voting.scope,
            group_id: groupId,
          },
        },
      };
    case WaveGroupType.CHAT:
      return {
        ...originalBody,
        chat: {
          ...originalBody.chat,
          scope: {
            ...originalBody.chat.scope,
            group_id: groupId,
          },
        },
      };
    case WaveGroupType.ADMIN:
      return {
        ...originalBody,
        wave: {
          ...originalBody.wave,
          admin_group: {
            ...originalBody.wave.admin_group,
            group_id: groupId,
          },
        },
      };
    default:
      assertUnreachable(type);
      return originalBody;
  }
};

const buildDefaultGroupName = (
  wave: ApiWave,
  type: WaveGroupType,
  mode: WaveGroupIdentitiesModal,
): string => {
  const typeLabel = WAVE_GROUP_LABELS[type] ?? "Group";
  const actionLabel =
    mode === WaveGroupIdentitiesModal.INCLUDE ? "Include" : "Exclude";
  const waveName = wave.name?.trim();
  if (waveName) {
    return `${waveName} ${typeLabel} ${actionLabel}`;
  }
  return `Wave ${wave.id} ${typeLabel} ${actionLabel}`;
};

const applyIdentityChangeToPayload = (
  payload: ApiCreateGroup,
  identity: string,
  mode: WaveGroupIdentitiesModal,
): ApiCreateGroup => {
  const normalizedIdentity = identity.toLowerCase();
  const includeSet = new Set(
    dedupeAddresses(payload.group.identity_addresses ?? []),
  );
  const excludeSet = new Set(
    dedupeAddresses(payload.group.excluded_identity_addresses ?? []),
  );

  if (mode === WaveGroupIdentitiesModal.INCLUDE) {
    excludeSet.delete(normalizedIdentity);
    includeSet.add(normalizedIdentity);
  } else {
    includeSet.delete(normalizedIdentity);
    excludeSet.add(normalizedIdentity);
  }

  const nextIncludes = Array.from(includeSet);
  const nextExcludes = Array.from(excludeSet);

  return {
    ...payload,
    group: {
      ...payload.group,
      identity_addresses: nextIncludes.length ? nextIncludes : null,
      excluded_identity_addresses: nextExcludes.length ? nextExcludes : null,
    },
  };
};

const mapValidationToMessage = (
  issues: ValidationIssue[],
  mode: WaveGroupIdentitiesModal,
): string => {
  if (issues.includes("INCLUDE_LIMIT")) {
    return "This group already contains the maximum number of included identities.";
  }
  if (issues.includes("EXCLUDE_LIMIT")) {
    return "This group already contains the maximum number of excluded identities.";
  }
  if (issues.includes("NO_FILTERS")) {
    return mode === WaveGroupIdentitiesModal.INCLUDE
      ? "The group must contain at least one filter before adding identities."
      : "You need to define at least one filter before excluding identities.";
  }
  return "Unable to update the group with the selected identity.";
};

type RequestAuth = () => Promise<{ success: boolean }>;

type SetToast = (options: {
  message: string | ReactNode;
  type: TypeOptions;
}) => void;

interface UseWaveGroupEditButtonsControllerProps {
  readonly haveGroup: boolean;
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly connectedProfile: ApiIdentity | null;
  readonly requestAuth: RequestAuth;
  readonly setToast: SetToast;
  readonly onWaveCreated: () => void;
}

export enum WaveGroupIdentitiesModal {
  INCLUDE = "include",
  EXCLUDE = "exclude",
}

export interface WaveGroupEditButtonsController {
  readonly mutating: boolean;
  readonly canIncludeIdentity: boolean;
  readonly canExcludeIdentity: boolean;
  readonly canRemoveGroup: boolean;
  readonly activeIdentitiesModal: WaveGroupIdentitiesModal | null;
  readonly openIdentitiesModal: (modal: WaveGroupIdentitiesModal) => void;
  readonly closeIdentitiesModal: () => void;
  readonly updateWave: (body: ApiUpdateWaveRequest) => Promise<void>;
  readonly onIdentityConfirm: (event: {
    identity: string;
    mode: WaveGroupIdentitiesModal;
  }) => void;
}

export const useWaveGroupEditButtonsController = ({
  haveGroup,
  wave,
  type,
  connectedProfile,
  requestAuth,
  setToast,
  onWaveCreated,
}: UseWaveGroupEditButtonsControllerProps): WaveGroupEditButtonsController => {
  const [mutating, setMutating] = useState(false);
  const [activeIdentitiesModal, setActiveIdentitiesModal] =
    useState<WaveGroupIdentitiesModal | null>(null);
  const scopedGroup = useMemo(
    () => getScopedGroup(wave, type),
    [wave, type],
  );
  const queryClient = useQueryClient();
  const abortControllersRef = useRef(new Set<AbortController>());

  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach((controller) => controller.abort());
      abortControllersRef.current.clear();
    };
  }, []);

  useQuery({
    queryKey: [QueryKey.GROUP, scopedGroup?.id],
    enabled: !!scopedGroup?.id,
    queryFn: async ({ signal }) => {
      if (!scopedGroup?.id) {
        throw new Error("Missing scoped group id");
      }
      return await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${scopedGroup.id}`,
        signal,
      });
    },
  });

  const fetchScopedGroupFull = useCallback(async (): Promise<ApiGroupFull | null> => {
    if (!scopedGroup?.id) {
      return null;
    }
    return await queryClient.fetchQuery({
      queryKey: [QueryKey.GROUP, scopedGroup.id],
      queryFn: async ({ signal }) =>
        await commonApiFetch<ApiGroupFull>({
          endpoint: `groups/${scopedGroup.id}`,
          signal,
        }),
    });
  }, [queryClient, scopedGroup]);

  const loadIdentityGroupWallets = useCallback(
    async (
      groupId: string,
      identityGroupId: string | null,
    ): Promise<string[]> => {
      if (!identityGroupId) {
        return [];
      }
      return await queryClient.fetchQuery({
        queryKey: [
          QueryKey.GROUP_WALLET_GROUP_WALLETS,
          {
            group_id: groupId,
            wallet_group_id: identityGroupId,
          },
        ],
        queryFn: async ({ signal }) =>
          await fetchIdentityGroupWallets(groupId, identityGroupId, signal),
      });
    },
    [queryClient],
  );

  const isWaveAdmin =
    wave.wave.authenticated_user_eligible_for_admin ?? false;

  const isAuthor = useMemo(
    () => isGroupAuthor(scopedGroup, connectedProfile),
    [scopedGroup, connectedProfile],
  );

  const canIncludeIdentity =
    scopedGroup !== null && (isWaveAdmin || isAuthor);
  const canExcludeIdentity =
    scopedGroup !== null && (isWaveAdmin || isAuthor);
  const canRemoveGroup =
    haveGroup && type !== WaveGroupType.ADMIN;

  const editWaveMutation = useMutation({
    mutationFn: async (body: ApiUpdateWaveRequest) =>
      await commonApiPost<ApiUpdateWaveRequest, ApiWave>({
        endpoint: `waves/${wave.id}`,
        body,
      }),
    onSuccess: () => {
      onWaveCreated();
    },
    onError: (error, body) => {
      const groupId = body ? getGroupIdFromUpdateBody(body, type) : null;
      console.error(
        "[WaveGroupEditButtons] Wave update failed",
        {
          waveId: wave.id,
          waveGroupType: type,
          groupId,
          error,
        },
      );
      setToast({
        message: toErrorMessage(error),
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const updateWave = useCallback(
    async (body: ApiUpdateWaveRequest) => {
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
    },
    [editWaveMutation, requestAuth, setToast],
  );

  useEffect(() => {
    if (
      (activeIdentitiesModal === WaveGroupIdentitiesModal.INCLUDE &&
        !canIncludeIdentity) ||
      (activeIdentitiesModal === WaveGroupIdentitiesModal.EXCLUDE &&
        !canExcludeIdentity)
    ) {
      setActiveIdentitiesModal(null);
    }
  }, [activeIdentitiesModal, canIncludeIdentity, canExcludeIdentity]);

  const openIdentitiesModal = useCallback(
    (modal: WaveGroupIdentitiesModal) => {
      setActiveIdentitiesModal(modal);
    },
    [],
  );

  const closeIdentitiesModal = useCallback(() => {
    setActiveIdentitiesModal(null);
  }, []);

  const onIdentityConfirm = useCallback(
    async ({
      identity,
      mode,
    }: {
      identity: string;
      mode: WaveGroupIdentitiesModal;
    }) => {
      const normalisedIdentity = normaliseIdentity(identity);
      if (!normalisedIdentity) {
        return;
      }

      if (
        mode === WaveGroupIdentitiesModal.INCLUDE &&
        !scopedGroup?.id
      ) {
        setToast({
          type: "error",
          message:
            "You need to define group filters before including specific identities.",
        });
        return;
      }

      setMutating(true);
      const needsWaveUpdate = !scopedGroup?.id;
      let waveMutationTriggered = false;
      try {
        const { success } = await requestAuth();
        if (!success) {
          setToast({
            type: "error",
            message: "Failed to authenticate",
          });
          return;
        }

        let payload: ApiCreateGroup;
        let previousGroupId: string | null = null;

        if (scopedGroup?.id) {
          const groupFull = await fetchScopedGroupFull();
          if (!groupFull) {
            throw new Error("Unable to load scoped group details.");
          }
          const includeWallets = await loadIdentityGroupWallets(
            groupFull.id,
            groupFull.group.identity_group_id,
          );
          const excludeWallets = await loadIdentityGroupWallets(
            groupFull.id,
            groupFull.group.excluded_identity_group_id,
          );
          const basePayload = cloneGroupPayload(groupFull);
          payload = {
            ...basePayload,
            group: {
              ...basePayload.group,
              identity_addresses: includeWallets,
              excluded_identity_addresses: excludeWallets,
            },
          };
          previousGroupId = groupFull.id;
        } else {
          const groupName = buildDefaultGroupName(wave, type, mode);
          payload = createEmptyGroupPayload(groupName);
        }

        const updatedPayload = applyIdentityChangeToPayload(
          payload,
          normalisedIdentity,
          mode,
        );

        const validation = validateGroupPayload(updatedPayload);
        if (!validation.valid) {
          setToast({
            message: mapValidationToMessage(validation.issues, mode),
            type: "error",
          });
          return;
        }

        const trimmedName = updatedPayload.name.trim();
        const createdGroup = await createGroup({
          payload: {
            ...updatedPayload,
            name: trimmedName,
          },
          nameOverride: trimmedName,
        });

        await publishGroup({
          id: createdGroup.id,
          oldVersionId: previousGroupId,
        });

        const pollController = new AbortController();
        abortControllersRef.current.add(pollController);
        try {
          const maxAttempts = 10;
          const maxDelayMs = 2000;
          const maxElapsedMs = 10000;
          let delayMs = 200;
          const pollStart = Date.now();

          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
              const refreshed = await commonApiFetch<ApiGroupFull>({
                endpoint: `groups/${createdGroup.id}`,
                signal: pollController.signal,
              });
              if (refreshed.visible) {
                queryClient.setQueryData(
                  [QueryKey.GROUP, createdGroup.id],
                  refreshed,
                );
                break;
              }
            } catch (pollError) {
              if (
                pollError instanceof DOMException &&
                pollError.name === "AbortError"
              ) {
                throw pollError;
              }
            }

            if (Date.now() - pollStart >= maxElapsedMs) {
              console.warn(
                "[WaveGroupEditButtons] Group publish polling timed out",
                {
                  groupId: createdGroup.id,
                  waveId: wave.id,
                },
              );
              break;
            }

            await waitWithAbort(delayMs, pollController.signal);
            delayMs = Math.min(delayMs * 2, maxDelayMs);
          }
        } finally {
          pollController.abort();
          abortControllersRef.current.delete(pollController);
        }

        console.info("[WaveGroupEditButtons] Published updated group", {
          waveId: wave.id,
          waveGroupType: type,
          previousGroupId,
          newGroupId: createdGroup.id,
        });

        if (needsWaveUpdate) {
          const updateBody = buildWaveUpdateBody(wave, type, createdGroup.id);
          waveMutationTriggered = true;
          await updateWave(updateBody);
        } else {
          onWaveCreated();
        }

        const successMessage =
          mode === WaveGroupIdentitiesModal.INCLUDE
            ? "Identity successfully included in the group."
            : "Identity successfully excluded from the group.";

        setToast({
          message: successMessage,
          type: "success",
        });
      } catch (error) {
        if (!waveMutationTriggered) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            console.info("[WaveGroupEditButtons] Identity update aborted");
          } else {
            setToast({
              message: toErrorMessage(error),
              type: "error",
            });
          }
        }
      } finally {
        setMutating(false);
      }
    },
    [
      requestAuth,
      scopedGroup,
      setToast,
      type,
      wave,
      onWaveCreated,
      editWaveMutation,
      updateWave,
      fetchScopedGroupFull,
      loadIdentityGroupWallets,
      abortControllersRef,
      queryClient,
    ],
  );

  return {
    mutating,
    canIncludeIdentity,
    canExcludeIdentity,
    canRemoveGroup,
    activeIdentitiesModal,
    openIdentitiesModal,
    closeIdentitiesModal,
    updateWave,
    onIdentityConfirm,
  };
};
