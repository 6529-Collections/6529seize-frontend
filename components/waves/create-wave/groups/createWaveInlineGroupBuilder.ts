"use client";

import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";

export type CreateWaveInlineGroupPanel =
  | "actions"
  | "identity"
  | "rule-list"
  | "rule-editor"
  | "search";

export enum CreateWaveInlineGroupRuleType {
  LEVEL = "level",
  TDH = "tdh",
  CIC = "cic",
  REP = "rep",
  NFTS = "nfts",
  COLLECTIONS = "collections",
  XTDH_GRANT = "xtdh-grant",
}

export interface CreateWaveInlineGroupBuilderState {
  readonly draft: ApiCreateGroup;
  readonly identities: readonly CommunityMemberMinimal[];
  readonly panel: CreateWaveInlineGroupPanel;
  readonly activeRule: CreateWaveInlineGroupRuleType | null;
}

const QUICK_RULES = [
  CreateWaveInlineGroupRuleType.LEVEL,
  CreateWaveInlineGroupRuleType.TDH,
  CreateWaveInlineGroupRuleType.CIC,
  CreateWaveInlineGroupRuleType.REP,
] as const;

const MORE_RULES = [
  CreateWaveInlineGroupRuleType.NFTS,
  CreateWaveInlineGroupRuleType.COLLECTIONS,
  CreateWaveInlineGroupRuleType.XTDH_GRANT,
] as const;

export const CREATE_WAVE_INLINE_GROUP_RULE_LABELS: Record<
  CreateWaveInlineGroupRuleType,
  string
> = {
  [CreateWaveInlineGroupRuleType.LEVEL]: "Level",
  [CreateWaveInlineGroupRuleType.TDH]: "TDH",
  [CreateWaveInlineGroupRuleType.CIC]: "NIC",
  [CreateWaveInlineGroupRuleType.REP]: "Rep",
  [CreateWaveInlineGroupRuleType.NFTS]: "Required NFTs",
  [CreateWaveInlineGroupRuleType.COLLECTIONS]: "Collection Access",
  [CreateWaveInlineGroupRuleType.XTDH_GRANT]: "xTDH Grant",
};

export const CREATE_WAVE_INLINE_GROUP_QUICK_RULES = QUICK_RULES;
export const CREATE_WAVE_INLINE_GROUP_MORE_RULES = MORE_RULES;

export const createEmptyInlineGroupPayload = (): ApiCreateGroup => ({
  name: "",
  group: {
    tdh: {
      min: null,
      max: null,
      inclusion_strategy: ApiGroupTdhInclusionStrategy.Both,
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
    is_beneficiary_of_grant_id: null,
    is_beneficiary_of_grant_match_mode:
      ApiGroupBeneficiaryGrantMatchMode.AnyToken,
  },
  is_private: false,
});

export const createInitialInlineGroupBuilderState =
  (): CreateWaveInlineGroupBuilderState => ({
    draft: createEmptyInlineGroupPayload(),
    identities: [],
    panel: "actions",
    activeRule: null,
  });

const normalizeAddress = (address: string): string =>
  address.trim().toLowerCase();

export const dedupeInlineIdentities = (
  identities: readonly CommunityMemberMinimal[]
): CommunityMemberMinimal[] => {
  const seen = new Set<string>();
  const next: CommunityMemberMinimal[] = [];

  for (const identity of identities) {
    const key = normalizeAddress(identity.wallet);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    next.push(identity);
  }

  return next;
};

export const getInlineIdentityAddresses = (
  identities: readonly CommunityMemberMinimal[]
): string[] | null => {
  const addresses = dedupeInlineIdentities(identities)
    .map((identity) => normalizeAddress(identity.wallet))
    .filter((address) => address.length > 0);

  return addresses.length ? addresses : null;
};

const hasRepRule = (draft: ApiCreateGroup): boolean =>
  draft.group.rep.min !== null ||
  draft.group.rep.max !== null ||
  draft.group.rep.user_identity !== null ||
  draft.group.rep.category !== null;

const hasCicRule = (draft: ApiCreateGroup): boolean =>
  draft.group.cic.min !== null ||
  draft.group.cic.max !== null ||
  draft.group.cic.user_identity !== null;

const hasLevelRule = (draft: ApiCreateGroup): boolean =>
  draft.group.level.min !== null || draft.group.level.max !== null;

const hasTdhRule = (draft: ApiCreateGroup): boolean =>
  draft.group.tdh.min !== null || draft.group.tdh.max !== null;

const hasCollectionRule = (draft: ApiCreateGroup): boolean =>
  draft.group.owns_nfts.some((group) => group.tokens.length === 0);

const hasNftRule = (draft: ApiCreateGroup): boolean =>
  draft.group.owns_nfts.some((group) => group.tokens.length > 0);

const hasGrantRule = (draft: ApiCreateGroup): boolean =>
  typeof draft.group.is_beneficiary_of_grant_id === "string" &&
  draft.group.is_beneficiary_of_grant_id.trim().length > 0;

export const getInlineGroupRuleCount = (draft: ApiCreateGroup): number =>
  [
    hasLevelRule(draft),
    hasTdhRule(draft),
    hasCicRule(draft),
    hasRepRule(draft),
    hasCollectionRule(draft),
    hasNftRule(draft),
    hasGrantRule(draft),
  ].filter(Boolean).length;

export const getInlineGroupConfiguredRules = (
  draft: ApiCreateGroup
): CreateWaveInlineGroupRuleType[] => {
  const ruleChecks: Array<readonly [CreateWaveInlineGroupRuleType, boolean]> = [
    [CreateWaveInlineGroupRuleType.LEVEL, hasLevelRule(draft)],
    [CreateWaveInlineGroupRuleType.TDH, hasTdhRule(draft)],
    [CreateWaveInlineGroupRuleType.CIC, hasCicRule(draft)],
    [CreateWaveInlineGroupRuleType.REP, hasRepRule(draft)],
    [CreateWaveInlineGroupRuleType.NFTS, hasNftRule(draft)],
    [CreateWaveInlineGroupRuleType.COLLECTIONS, hasCollectionRule(draft)],
    [CreateWaveInlineGroupRuleType.XTDH_GRANT, hasGrantRule(draft)],
  ];

  return ruleChecks.filter(([, hasRule]) => hasRule).map(([rule]) => rule);
};

export const getInlineGroupDraftSummary = ({
  draft,
  identityCount,
}: {
  readonly draft: ApiCreateGroup;
  readonly identityCount: number;
}): string | null => {
  const ruleCount = getInlineGroupRuleCount(draft);
  const parts: string[] = [];

  if (identityCount > 0) {
    parts.push(
      `${identityCount} ${identityCount === 1 ? "identity" : "identities"}`
    );
  }
  if (ruleCount > 0) {
    parts.push(`${ruleCount} ${ruleCount === 1 ? "rule" : "rules"}`);
  }

  return parts.length ? parts.join(" · ") : null;
};

export const buildInlineGroupName = ({
  waveName,
  groupLabel,
}: {
  readonly waveName: string | null | undefined;
  readonly groupLabel: string | null | undefined;
}): string => {
  const normalizedWaveName = waveName?.trim() ?? "";
  const normalizedGroupLabel = groupLabel?.trim() ?? "";

  if (!normalizedWaveName.length) {
    return normalizedGroupLabel || "Wave Group";
  }

  if (!normalizedGroupLabel.length) {
    return normalizedWaveName;
  }

  return `${normalizedWaveName} ${normalizedGroupLabel}`;
};
