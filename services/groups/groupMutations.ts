import { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { commonApiPost } from "@/services/api/common-api";

const GROUP_INCLUDE_LIMIT = 10000;
const GROUP_EXCLUDE_LIMIT = 1000;

export type ValidationIssue =
  | "INCLUDE_LIMIT"
  | "EXCLUDE_LIMIT"
  | "NO_FILTERS"
  | "INVALID_LEVEL_RANGE"
  | "INVALID_TDH_RANGE"
  | "INVALID_REP_RANGE"
  | "INVALID_CIC_RANGE";

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: ValidationIssue[];
}

export const toErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong";
};

const sanitiseGroupPayload = (
  payload: ApiCreateGroup,
  name: string
): ApiCreateGroup => ({
  ...payload,
  name,
  group: {
    ...payload.group,
    owns_nfts: [...payload.group.owns_nfts],
    identity_addresses:
      payload.group.identity_addresses?.length
        ? [...payload.group.identity_addresses]
        : null,
    excluded_identity_addresses:
      payload.group.excluded_identity_addresses?.length
        ? [...payload.group.excluded_identity_addresses]
        : null,
  },
});

export const validateGroupPayload = (
  payload: ApiCreateGroup
): ValidationResult => {
  const issues: ValidationIssue[] = [];
  const includeCount = payload.group.identity_addresses?.length ?? 0;
  const excludeCount = payload.group.excluded_identity_addresses?.length ?? 0;

  if (includeCount > GROUP_INCLUDE_LIMIT) {
    issues.push("INCLUDE_LIMIT");
  }

  if (excludeCount > GROUP_EXCLUDE_LIMIT) {
    issues.push("EXCLUDE_LIMIT");
  }

  const hasIncludeWallets = includeCount > 0;
  const hasExcludeWallets = excludeCount > 0;
  const hasLevel =
    payload.group.level.min !== null || payload.group.level.max !== null;
  const hasTdh =
    payload.group.tdh.min !== null || payload.group.tdh.max !== null;
  const hasRep =
    payload.group.rep.min !== null ||
    payload.group.rep.max !== null ||
    payload.group.rep.user_identity !== null ||
    payload.group.rep.category !== null;
  const hasCic =
    payload.group.cic.min !== null ||
    payload.group.cic.max !== null ||
    payload.group.cic.user_identity !== null;
  const hasNfts = payload.group.owns_nfts.length > 0;

  if (
    !(
      hasIncludeWallets ||
      hasExcludeWallets ||
      hasLevel ||
      hasTdh ||
      hasRep ||
      hasCic ||
      hasNfts
    )
  ) {
    issues.push("NO_FILTERS");
  }

  if (
    payload.group.level.min !== null &&
    payload.group.level.max !== null &&
    payload.group.level.min > payload.group.level.max
  ) {
    issues.push("INVALID_LEVEL_RANGE");
  }

  if (
    payload.group.tdh.min !== null &&
    payload.group.tdh.max !== null &&
    payload.group.tdh.min > payload.group.tdh.max
  ) {
    issues.push("INVALID_TDH_RANGE");
  }

  if (
    payload.group.rep.min !== null &&
    payload.group.rep.max !== null &&
    payload.group.rep.min > payload.group.rep.max
  ) {
    issues.push("INVALID_REP_RANGE");
  }

  if (
    payload.group.cic.min !== null &&
    payload.group.cic.max !== null &&
    payload.group.cic.min > payload.group.cic.max
  ) {
    issues.push("INVALID_CIC_RANGE");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
};

export const createGroup = async ({
  payload,
  nameOverride,
}: {
  readonly payload: ApiCreateGroup;
  readonly nameOverride?: string;
}): Promise<ApiGroupFull> => {
  const effectiveName = (nameOverride ?? payload.name).trim();
  if (!effectiveName) {
    throw new Error("Group name cannot be empty");
  }
  const body = sanitiseGroupPayload(payload, effectiveName);

  return await commonApiPost<ApiCreateGroup, ApiGroupFull>({
    endpoint: `groups`,
    body,
  });
};

export const publishGroup = async ({
  id,
  oldVersionId,
  signal,
}: {
  readonly id: string;
  readonly oldVersionId: string | null;
  readonly signal?: AbortSignal;
}): Promise<ApiGroupFull> =>
  await commonApiPost<
    { visible: true; old_version_id: string | null },
    ApiGroupFull
  >({
    endpoint: `groups/${id}/visible`,
    body: { visible: true, old_version_id: oldVersionId },
    signal,
  });

export const hideGroup = async ({
  id,
  signal,
}: {
  readonly id: string;
  readonly signal?: AbortSignal;
}): Promise<ApiGroupFull> => {
  return await commonApiPost<{ visible: false }, ApiGroupFull>({
    endpoint: `groups/${id}/visible`,
    body: { visible: false },
    signal,
  });
};
