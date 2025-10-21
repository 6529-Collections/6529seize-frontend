"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { TypeOptions } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import {
  createGroup,
  publishGroup,
  validateGroupPayload,
  type ValidationIssue,
} from "@/services/groups/groupMutations";
import { convertWaveToUpdateWave } from "@/helpers/waves/waves.helpers";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { WaveGroupType } from "../../../WaveGroup";
import { getScopedGroup, isGroupAuthor } from "../utils/waveGroupEdit";

const WAVE_GROUP_LABELS: Record<string, string> = {
  VIEW: "View",
  DROP: "Drop",
  VOTE: "Vote",
  CHAT: "Chat",
  ADMIN: "Admin",
};

const toErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong";
};

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
): Promise<string[]> => {
  if (!identityGroupId) {
    return [];
  }
  try {
    const wallets = await commonApiFetch<string[]>({
      endpoint: `groups/${groupId}/identity_groups/${identityGroupId}`,
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
      return body.wave.admin_group.group_id ?? null;
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

  const hasGroup = scopedGroup !== null;
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
        message: error as unknown as string,
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
          const groupFull = await commonApiFetch<ApiGroupFull>({
            endpoint: `groups/${scopedGroup.id}`,
          });
          const includeWallets = await fetchIdentityGroupWallets(
            groupFull.id,
            groupFull.group.identity_group_id,
          );
          const excludeWallets = await fetchIdentityGroupWallets(
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

        console.info("[WaveGroupEditButtons] Published updated group", {
          waveId: wave.id,
          waveGroupType: type,
          previousGroupId,
          newGroupId: createdGroup.id,
        });

        if (needsWaveUpdate) {
          const updateBody = buildWaveUpdateBody(wave, type, createdGroup.id);
          waveMutationTriggered = true;
          await editWaveMutation.mutateAsync(updateBody);
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
          setToast({
            message: toErrorMessage(error),
            type: "error",
          });
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
