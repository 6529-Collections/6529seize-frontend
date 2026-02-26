import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import { commonApiFetch } from "@/services/api/common-api";
import {
  createGroup,
  publishGroup,
  validateGroupPayload,
  type ValidationIssue,
} from "@/services/groups/groupMutations";

import type { QueryClient } from "@tanstack/react-query";

export enum IdentityGroupWorkflowMode {
  INCLUDE = "include",
  EXCLUDE = "exclude",
}

const normalizeIdentity = (identity: string): string =>
  identity.trim().toLowerCase();

const dedupeAddresses = (addresses: readonly string[]): string[] =>
  Array.from(
    new Set(
      addresses
        .filter((addr): addr is string => typeof addr === "string")
        .map((addr) => addr.trim().toLowerCase())
        .filter((addr) => addr.length > 0)
    )
  );

const fetchIdentityGroupWallets = async (
  groupId: string,
  identityGroupId: string | null,
  signal?: AbortSignal
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
      `[IdentityGroupWorkflow] Failed to load identity group ${identityGroupId} for group ${groupId}:`,
      error
    );
    return [];
  }
};

const waitWithAbort = async (
  ms: number,
  signal: AbortSignal
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
  is_private: group.is_private,
});

const createEmptyGroupPayload = (name: string): ApiCreateGroup => ({
  name,
  group: {
    tdh: {
      min: null,
      max: null,
      inclusion_strategy: ApiGroupTdhInclusionStrategy.Tdh,
    },
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

const buildDefaultGroupName = ({
  waveName,
  waveId,
  groupLabel,
  mode,
}: {
  readonly waveName: string | null | undefined;
  readonly waveId: string;
  readonly groupLabel: string;
  readonly mode: IdentityGroupWorkflowMode;
}): string => {
  const actionLabel =
    mode === IdentityGroupWorkflowMode.INCLUDE ? "Include" : "Exclude";
  const normalizedWaveName = waveName?.trim();
  if (normalizedWaveName) {
    return `${normalizedWaveName} ${groupLabel} ${actionLabel}`;
  }
  return `Wave ${waveId} ${groupLabel} ${actionLabel}`;
};

const applyIdentityChangeToPayload = (
  payload: ApiCreateGroup,
  normalizedIdentity: string,
  mode: IdentityGroupWorkflowMode
): ApiCreateGroup => {
  const includeSet = new Set(
    dedupeAddresses(payload.group.identity_addresses ?? [])
  );
  const excludeSet = new Set(
    dedupeAddresses(payload.group.excluded_identity_addresses ?? [])
  );

  if (mode === IdentityGroupWorkflowMode.INCLUDE) {
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
  mode: IdentityGroupWorkflowMode
): string => {
  if (issues.includes("INCLUDE_LIMIT")) {
    return "This group already contains the maximum number of included identities.";
  }
  if (issues.includes("EXCLUDE_LIMIT")) {
    return "This group already contains the maximum number of excluded identities.";
  }
  if (issues.includes("NO_FILTERS")) {
    return mode === IdentityGroupWorkflowMode.EXCLUDE
      ? "You need to define at least one filter before excluding identities."
      : "Unable to update the group with the selected identity.";
  }
  return "Unable to update the group with the selected identity.";
};

const validatePayloadOrThrow = (
  payload: ApiCreateGroup,
  mode: IdentityGroupWorkflowMode
): void => {
  const validation = validateGroupPayload(payload);
  if (validation.valid) {
    return;
  }
  throw new Error(mapValidationToMessage(validation.issues, mode));
};

const pollGroupVisibility = async ({
  createdGroupId,
  waveId,
  queryClient,
  abortControllers,
}: {
  readonly createdGroupId: string;
  readonly waveId: string;
  readonly queryClient: QueryClient;
  readonly abortControllers: Set<AbortController>;
}): Promise<void> => {
  const pollController = new AbortController();
  abortControllers.add(pollController);
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
          queryClient.setQueryData([QueryKey.GROUP, createdGroupId], refreshed);
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

    console.warn("[IdentityGroupWorkflow] Group publish polling timed out", {
      groupId: createdGroupId,
      waveId,
    });
  } finally {
    pollController.abort();
    abortControllers.delete(pollController);
  }
};

const createAndPublishGroupWithVisibility = async ({
  payload,
  previousGroupId,
  waveId,
  queryClient,
  abortControllers,
}: {
  readonly payload: ApiCreateGroup;
  readonly previousGroupId: string | null;
  readonly waveId: string;
  readonly queryClient: QueryClient;
  readonly abortControllers: Set<AbortController>;
}): Promise<string> => {
  const trimmedName = payload.name.trim();
  const createdGroup = await createGroup({
    payload: {
      ...payload,
      name: trimmedName,
    },
    nameOverride: trimmedName,
  });

  const publishController = new AbortController();
  abortControllers.add(publishController);
  try {
    await publishGroup({
      id: createdGroup.id,
      oldVersionId: previousGroupId,
      signal: publishController.signal,
    });
  } finally {
    publishController.abort();
    abortControllers.delete(publishController);
  }

  await pollGroupVisibility({
    createdGroupId: createdGroup.id,
    waveId,
    queryClient,
    abortControllers,
  });

  return createdGroup.id;
};

export const createPublishedGroupForIdentityChange = async ({
  identity,
  mode,
  waveId,
  waveName,
  groupLabel,
  scopedGroupId,
  queryClient,
  abortControllers,
}: {
  readonly identity: string;
  readonly mode: IdentityGroupWorkflowMode;
  readonly waveId: string;
  readonly waveName: string | null | undefined;
  readonly groupLabel: string;
  readonly scopedGroupId: string | null;
  readonly queryClient: QueryClient;
  readonly abortControllers: Set<AbortController>;
}): Promise<string> => {
  const normalizedIdentity = normalizeIdentity(identity);
  if (!normalizedIdentity) {
    throw new Error("Identity is required.");
  }

  let payload: ApiCreateGroup;
  let previousGroupId: string | null = null;

  if (scopedGroupId) {
    const groupFull = await queryClient.ensureQueryData({
      queryKey: [QueryKey.GROUP, scopedGroupId],
      queryFn: async ({ signal }) =>
        await commonApiFetch<ApiGroupFull>({
          endpoint: `groups/${scopedGroupId}`,
          signal,
        }),
    });

    const [includeWallets, excludeWallets] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: [
          QueryKey.GROUP_WALLET_GROUP_WALLETS,
          {
            group_id: groupFull.id,
            wallet_group_id: groupFull.group.identity_group_id,
          },
        ],
        queryFn: async ({ signal }) =>
          await fetchIdentityGroupWallets(
            groupFull.id,
            groupFull.group.identity_group_id,
            signal
          ),
      }),
      queryClient.fetchQuery({
        queryKey: [
          QueryKey.GROUP_WALLET_GROUP_WALLETS,
          {
            group_id: groupFull.id,
            wallet_group_id: groupFull.group.excluded_identity_group_id,
          },
        ],
        queryFn: async ({ signal }) =>
          await fetchIdentityGroupWallets(
            groupFull.id,
            groupFull.group.excluded_identity_group_id,
            signal
          ),
      }),
    ]);

    const basePayload = cloneGroupPayload(groupFull);
    payload = {
      ...basePayload,
      group: {
        ...basePayload.group,
        identity_addresses: includeWallets.length ? includeWallets : null,
        excluded_identity_addresses: excludeWallets.length
          ? excludeWallets
          : null,
      },
    };
    previousGroupId = groupFull.id;
  } else {
    payload = createEmptyGroupPayload(
      buildDefaultGroupName({
        waveName,
        waveId,
        groupLabel,
        mode,
      })
    );
  }

  const updatedPayload = applyIdentityChangeToPayload(
    payload,
    normalizedIdentity,
    mode
  );
  validatePayloadOrThrow(updatedPayload, mode);

  return await createAndPublishGroupWithVisibility({
    payload: updatedPayload,
    previousGroupId,
    waveId,
    queryClient,
    abortControllers,
  });
};
