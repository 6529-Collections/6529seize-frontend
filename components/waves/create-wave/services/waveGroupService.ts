import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import { createGroup, publishGroup } from "@/services/groups/groupMutations";

type WaveAdminGroupErrorReason =
  | "missing-primary-wallet"
  | "create-personal-group"
  | "publish-personal-group";

export class WaveAdminGroupError extends Error {
  readonly reason: WaveAdminGroupErrorReason;
  override readonly cause: unknown;

  constructor({
    reason,
    cause,
  }: {
    readonly reason: WaveAdminGroupErrorReason;
    readonly cause?: unknown;
  }) {
    super(reason);
    this.name = "WaveAdminGroupError";
    this.reason = reason;
    this.cause = cause;
  }
}

export const getOnlyMeGroupDescription = (
  primaryWallet: string
): ApiCreateGroupDescription => ({
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
  identity_addresses: [primaryWallet],
  excluded_identity_addresses: null,
});

/**
 * Creates a group that only includes the specified wallet
 * @param primaryWallet The primary wallet address to include
 * @param handle User handle for the group name
 * @returns Promise with the group ID or null
 */
const createOnlyMeGroup = async ({
  primaryWallet,
  handle,
  onError,
}: {
  readonly primaryWallet: string;
  readonly handle: string | undefined;
  readonly onError: (error: unknown) => void;
}): Promise<string | null> => {
  const groupConfig: ApiCreateGroup = {
    name: `Only ${handle ?? "Me"}`,
    group: getOnlyMeGroupDescription(primaryWallet),
  };

  let group: Awaited<ReturnType<typeof createGroup>>;
  try {
    group = await createGroup({
      payload: groupConfig,
    });
  } catch (error) {
    onError(
      new WaveAdminGroupError({
        reason: "create-personal-group",
        cause: error,
      })
    );
    return null;
  }

  try {
    await publishGroup({
      id: group.id,
      oldVersionId: null,
    });
  } catch (error) {
    onError(
      new WaveAdminGroupError({
        reason: "publish-personal-group",
        cause: error,
      })
    );
    return null;
  }

  return group.id;
};

/**
 * Gets or creates an admin group for the wave
 * @param adminGroupId Existing admin group ID if any
 * @param primaryWallet User's primary wallet
 * @param handle User's handle
 * @param onError Error handler callback
 * @returns Promise with the group ID or null
 */
export const getAdminGroupId = async ({
  adminGroupId,
  primaryWallet,
  handle,
  onError,
}: {
  readonly adminGroupId: string | null;
  readonly primaryWallet: string | null | undefined;
  readonly handle: string | undefined;
  readonly onError: (error: unknown) => void;
}): Promise<string | null> => {
  if (adminGroupId) {
    return adminGroupId;
  }

  if (!primaryWallet) {
    onError(new WaveAdminGroupError({ reason: "missing-primary-wallet" }));
    return null;
  }

  return await createOnlyMeGroup({
    primaryWallet,
    handle,
    onError,
  });
};
