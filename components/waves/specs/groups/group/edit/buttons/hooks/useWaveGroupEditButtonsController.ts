"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, ReactNode } from "react";
import type { TypeOptions } from "react-toastify";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  createGroup,
  publishGroup,
  validateGroupPayload,
  type ValidationIssue,
  toErrorMessage,
} from "@/services/groups/groupMutations";
import { WaveGroupType } from "../../../WaveGroup.types";
import {
  buildWaveUpdateBody,
  getGroupIdFromUpdateBody,
  getScopedGroup,
  isGroupAuthor,
} from "../utils/waveGroupEdit";

const WAVE_GROUP_LABELS = {
  VIEW: "View",
  DROP: "Drop",
  VOTE: "Vote",
  CHAT: "Chat",
  ADMIN: "Admin",
} satisfies Record<WaveGroupType, string>;

const normalizeIdentity = (identity: string): string =>
  identity.trim().toLowerCase();

const dedupeAddresses = (addresses: readonly string[]): string[] =>
  Array.from(
    new Set(
      addresses
        .filter((addr): addr is string => typeof addr === "string")
        .map((addr) => addr.trim().toLowerCase())
        .filter((addr) => addr.length > 0),
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
    identity_addresses: null,
    excluded_identity_addresses: null,
  },
  is_private: group.is_private ?? false,
});

const createEmptyGroupPayload = (name: string): ApiCreateGroup => ({
  name,
  group: {
    tdh: { min: null, max: null, inclusion_strategy: ApiGroupTdhInclusionStrategy.Tdh },
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
    identity_addresses: null,
    excluded_identity_addresses: null,
  },
  is_private: false,
});

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
  normalizedIdentity: string,
  mode: WaveGroupIdentitiesModal,
): ApiCreateGroup => {

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
    return mode === WaveGroupIdentitiesModal.EXCLUDE
      ? "You need to define at least one filter before excluding identities."
      : "Unable to update the group with the selected identity.";
  }
  return "Unable to update the group with the selected identity.";
};

type ScopedGroup = ReturnType<typeof getScopedGroup>;
type IdentityModalPermissions = Readonly<
  Record<WaveGroupIdentitiesModal, boolean>
>;

const isIdentityActionAllowed = (
  mode: WaveGroupIdentitiesModal,
  permissions: IdentityModalPermissions,
  setToast: SetToast,
): boolean => {
  if (permissions[mode]) {
    return true;
  }
  setToast({
    type: "error",
    message:
      "You do not have permission to modify identities for this group.",
  });
  return false;
};

const ensureAuthenticated = async (
  requestAuth: RequestAuth,
  setToast: SetToast,
): Promise<boolean> => {
  const { success } = await requestAuth();
  if (success) {
    return true;
  }
  setToast({
    type: "error",
    message: "Failed to authenticate",
  });
  return false;
};

interface BuildIdentityPayloadParams {
  readonly scopedGroup: ScopedGroup;
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly mode: WaveGroupIdentitiesModal;
  readonly fetchScopedGroupFull: () => Promise<ApiGroupFull | null>;
  readonly loadIdentityGroupWallets: (
    groupId: string,
    identityGroupId: string | null,
  ) => Promise<string[]>;
}

const buildIdentityPayload = async ({
  scopedGroup,
  wave,
  type,
  mode,
  fetchScopedGroupFull,
  loadIdentityGroupWallets,
}: BuildIdentityPayloadParams): Promise<{
  payload: ApiCreateGroup;
  previousGroupId: string | null;
}> => {
  if (!scopedGroup?.id) {
    const groupName = buildDefaultGroupName(wave, type, mode);
    return {
      payload: createEmptyGroupPayload(groupName),
      previousGroupId: null,
    };
  }

  const groupFull = await fetchScopedGroupFull();
  if (!groupFull) {
    throw new Error("Unable to load scoped group details.");
  }

  const [includeWallets, excludeWallets] = await Promise.all([
    loadIdentityGroupWallets(
      groupFull.id,
      groupFull.group.identity_group_id,
    ),
    loadIdentityGroupWallets(
      groupFull.id,
      groupFull.group.excluded_identity_group_id,
    ),
  ]);

  const basePayload = cloneGroupPayload(groupFull);
  return {
    payload: {
      ...basePayload,
      group: {
        ...basePayload.group,
        identity_addresses: includeWallets.length ? includeWallets : null,
        excluded_identity_addresses: excludeWallets.length
          ? excludeWallets
          : null,
      },
    },
    previousGroupId: groupFull.id,
  };
};

const validatePayloadOrNotify = (
  payload: ApiCreateGroup,
  mode: WaveGroupIdentitiesModal,
  setToast: SetToast,
): boolean => {
  const validation = validateGroupPayload(payload);
  if (validation.valid) {
    return true;
  }
  setToast({
    message: mapValidationToMessage(validation.issues, mode),
    type: "error",
  });
  return false;
};

interface PollGroupVisibilityParams {
  readonly createdGroupId: string;
  readonly waveId: string;
  readonly abortControllersRef: MutableRefObject<Set<AbortController>>;
  readonly queryClient: QueryClient;
}

const pollGroupVisibility = async ({
  createdGroupId,
  waveId,
  abortControllersRef,
  queryClient,
}: PollGroupVisibilityParams): Promise<void> => {
  const pollController = new AbortController();
  abortControllersRef.current.add(pollController);
  try {
    const maxDelayMs = 2000;
    const maxElapsedMs = 10000;
    let delayMs = 200;
    const pollStart = Date.now();

    while (Date.now() - pollStart < maxElapsedMs) {
      try {
        const refreshed = await commonApiFetch<ApiGroupFull>({
          endpoint: `groups/${createdGroupId}`,
          signal: pollController.signal,
        });
        if (refreshed.visible) {
          queryClient.setQueryData(
            [QueryKey.GROUP, createdGroupId],
            refreshed,
          );
          return;
        }
      } catch (pollError) {
        if (
          pollError instanceof DOMException &&
          pollError.name === "AbortError"
        ) {
          throw pollError;
        }
      }

      await waitWithAbort(delayMs, pollController.signal);
      delayMs = Math.min(delayMs * 2, maxDelayMs);
    }

    console.warn("[WaveGroupEditButtons] Group publish polling timed out", {
      groupId: createdGroupId,
      waveId,
    });
  } finally {
    pollController.abort();
    abortControllersRef.current.delete(pollController);
  }
};

interface CreateAndPublishGroupParams {
  readonly payload: ApiCreateGroup;
  readonly previousGroupId: string | null;
  readonly abortControllersRef: MutableRefObject<Set<AbortController>>;
  readonly queryClient: QueryClient;
  readonly waveId: string;
  readonly waveGroupType: WaveGroupType;
}

const createAndPublishGroupWithVisibility = async ({
  payload,
  previousGroupId,
  abortControllersRef,
  queryClient,
  waveId,
  waveGroupType,
}: CreateAndPublishGroupParams): Promise<string> => {
  const trimmedName = payload.name.trim();
  const createdGroup = await createGroup({
    payload: {
      ...payload,
      name: trimmedName,
    },
    nameOverride: trimmedName,
  });

  const publishController = new AbortController();
  abortControllersRef.current.add(publishController);
  try {
    await publishGroup({
      id: createdGroup.id,
      oldVersionId: previousGroupId,
      signal: publishController.signal,
    });
  } finally {
    publishController.abort();
    abortControllersRef.current.delete(publishController);
  }

  await pollGroupVisibility({
    createdGroupId: createdGroup.id,
    waveId,
    abortControllersRef,
    queryClient,
  });

  console.info("[WaveGroupEditButtons] Published updated group", {
    waveId,
    waveGroupType,
    previousGroupId,
    newGroupId: createdGroup.id,
  });

  return createdGroup.id;
};

type RequestAuth = () => Promise<{ success: boolean }>;

type SetToast = (options: {
  readonly message: string | ReactNode;
  readonly type: TypeOptions;
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

interface WaveGroupEditButtonsController {
  readonly mutating: boolean;
  readonly canIncludeIdentity: boolean;
  readonly canExcludeIdentity: boolean;
  readonly canRemoveGroup: boolean;
  readonly activeIdentitiesModal: WaveGroupIdentitiesModal | null;
  readonly openIdentitiesModal: (modal: WaveGroupIdentitiesModal) => void;
  readonly closeIdentitiesModal: () => void;
  readonly updateWave: (
    body: ApiUpdateWaveRequest,
    opts?: { readonly skipAuth?: boolean },
  ) => Promise<void>;
  readonly onIdentityConfirm: (event: Readonly<{
    identity: string;
    mode: WaveGroupIdentitiesModal;
  }>) => Promise<void>;
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
    queryKey: [QueryKey.GROUP, scopedGroup?.id ?? ""],
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
    return await queryClient.ensureQueryData({
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

  const canIncludeIdentity = isWaveAdmin || isAuthor;
  const canExcludeIdentity = isWaveAdmin || isAuthor;
  const canRemoveGroup =
    haveGroup && type !== WaveGroupType.ADMIN;

  const identityModalPermissions = useMemo<IdentityModalPermissions>(
    () => ({
      [WaveGroupIdentitiesModal.INCLUDE]: canIncludeIdentity,
      [WaveGroupIdentitiesModal.EXCLUDE]: canExcludeIdentity,
    }),
    [canIncludeIdentity, canExcludeIdentity],
  );

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
    async (
      body: ApiUpdateWaveRequest,
      opts?: { readonly skipAuth?: boolean },
    ) => {
      setMutating(true);
      if (!opts?.skipAuth) {
        const authenticated = await ensureAuthenticated(
          requestAuth,
          setToast,
        );
        if (!authenticated) {
          setMutating(false);
          return;
        }
      }
      await editWaveMutation.mutateAsync(body);
    },
    [editWaveMutation, requestAuth, setToast],
  );

  useEffect(() => {
    if (
      activeIdentitiesModal &&
      !identityModalPermissions[activeIdentitiesModal]
    ) {
      setActiveIdentitiesModal(null);
    }
  }, [activeIdentitiesModal, identityModalPermissions]);

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
    }: Readonly<{
      identity: string;
      mode: WaveGroupIdentitiesModal;
    }>) => {
      const normalizedIdentity = normalizeIdentity(identity);
      if (
        !normalizedIdentity ||
        !isIdentityActionAllowed(
          mode,
          identityModalPermissions,
          setToast,
        )
      ) {
        return;
      }

      setMutating(true);
      const needsWaveUpdate = !scopedGroup?.id;
      let waveMutationTriggered = false;
      try {
        const authenticated = await ensureAuthenticated(
          requestAuth,
          setToast,
        );
        if (!authenticated) {
          return;
        }

        const { payload, previousGroupId } = await buildIdentityPayload({
          scopedGroup,
          wave,
          type,
          mode,
          fetchScopedGroupFull,
          loadIdentityGroupWallets,
        });

        const updatedPayload = applyIdentityChangeToPayload(
          payload,
          normalizedIdentity,
          mode,
        );

        if (!validatePayloadOrNotify(updatedPayload, mode, setToast)) {
          return;
        }

        const newGroupId = await createAndPublishGroupWithVisibility({
          payload: updatedPayload,
          previousGroupId,
          abortControllersRef,
          queryClient,
          waveId: wave.id,
          waveGroupType: type,
        });

        if (needsWaveUpdate) {
          const updateBody = buildWaveUpdateBody(
            wave,
            type,
            newGroupId,
          );
          waveMutationTriggered = true;
          await updateWave(updateBody, { skipAuth: true });
        } else {
          onWaveCreated();
        }

        const successMessage =
          mode === WaveGroupIdentitiesModal.INCLUDE
            ? "Identity successfully included in the group."
            : "Identity successfully excluded from the group.";

        setActiveIdentitiesModal(null);
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
        if (!waveMutationTriggered) {
          setMutating(false);
        }
      }
    },
    [
      identityModalPermissions,
      requestAuth,
      scopedGroup,
      setToast,
      type,
      wave,
      onWaveCreated,
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
