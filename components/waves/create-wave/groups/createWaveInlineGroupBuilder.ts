"use client";

import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getGroupCriteriaSummary } from "@/helpers/groups/group-criteria-summary";
import type { GroupCriteriaIdentityLabels } from "@/helpers/groups/group-criteria-summary";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

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
  readonly excludedIdentities: readonly CommunityMemberMinimal[];
  readonly includedWalletSources: CreateWaveInlineGroupWalletSources;
  readonly excludedWalletSources: CreateWaveInlineGroupWalletSources;
  readonly panel: CreateWaveInlineGroupPanel;
  readonly activeRule: CreateWaveInlineGroupRuleType | null;
  readonly criteriaReplacementActive: boolean;
}

export interface CreateWaveInlineGroupWalletSources {
  readonly selectedAllowlist: AllowlistDescription | null;
  readonly emmaWallets: readonly string[] | null;
  readonly uploadedWallets: readonly string[] | null;
  readonly uploadedFileName: string | null;
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

const normalizeAddress = (address: string): string =>
  address.trim().toLowerCase();

export const createEmptyInlineGroupWalletSources =
  (): CreateWaveInlineGroupWalletSources => ({
    selectedAllowlist: null,
    emmaWallets: null,
    uploadedWallets: null,
    uploadedFileName: null,
  });

export const dedupeInlineWallets = (wallets: readonly string[]): string[] => [
  ...new Set(wallets.map(normalizeAddress).filter(Boolean)),
];

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
  identities: readonly CommunityMemberMinimal[],
  walletSources: CreateWaveInlineGroupWalletSources = createEmptyInlineGroupWalletSources()
): string[] | null => {
  const addresses = dedupeInlineWallets([
    ...dedupeInlineIdentities(identities).map((identity) => identity.wallet),
    ...(walletSources.emmaWallets ?? []),
    ...(walletSources.uploadedWallets ?? []),
  ]);

  return addresses.length ? addresses : null;
};

export const getInlineGroupIdentityFromProfile = (
  profile: ApiIdentity | null | undefined
): CommunityMemberMinimal | null =>
  profile?.primary_wallet
    ? {
        profile_id: profile.id,
        handle: profile.handle,
        normalised_handle: profile.normalised_handle,
        primary_wallet: profile.primary_wallet,
        display: profile.display,
        tdh: profile.tdh,
        level: profile.level,
        cic_rating: profile.cic,
        wallet: profile.primary_wallet,
        pfp: profile.pfp,
      }
    : null;

export const createInitialInlineGroupBuilderState = (
  identities: readonly CommunityMemberMinimal[] = []
): CreateWaveInlineGroupBuilderState => {
  const initialIdentities = dedupeInlineIdentities(identities);
  const includedWalletSources = createEmptyInlineGroupWalletSources();
  const excludedWalletSources = createEmptyInlineGroupWalletSources();
  const draft = createEmptyInlineGroupPayload();

  return {
    draft: {
      ...draft,
      group: {
        ...draft.group,
        identity_addresses: getInlineIdentityAddresses(
          initialIdentities,
          includedWalletSources
        ),
      },
    },
    identities: initialIdentities,
    excludedIdentities: [],
    includedWalletSources,
    excludedWalletSources,
    panel: "actions",
    activeRule: null,
    criteriaReplacementActive: false,
  };
};

const createInlineGroupIdentityFromWallet = (
  wallet: string
): CommunityMemberMinimal => ({
  profile_id: null,
  handle: wallet,
  normalised_handle: wallet.toLowerCase(),
  primary_wallet: wallet,
  display: wallet,
  tdh: 0,
  level: 0,
  cic_rating: 0,
  wallet,
  pfp: null,
});

export const createInlineGroupBuilderStateFromSavedGroup = ({
  group,
  includedWallets,
  excludedWallets,
}: {
  readonly group: ApiGroupFull;
  readonly includedWallets: readonly string[];
  readonly excludedWallets: readonly string[];
}): CreateWaveInlineGroupBuilderState => {
  const normalizedIncludedWallets = dedupeInlineWallets(includedWallets);
  const normalizedExcludedWallets = dedupeInlineWallets(excludedWallets);
  const includedWalletKeys = new Set(normalizedIncludedWallets);
  const nonOverlappingExcludedWallets = normalizedExcludedWallets.filter(
    (wallet) => !includedWalletKeys.has(wallet)
  );
  const includedWalletSources = createEmptyInlineGroupWalletSources();
  const excludedWalletSources = createEmptyInlineGroupWalletSources();

  return {
    draft: {
      name: group.name,
      is_private: group.is_private,
      group: {
        tdh: { ...group.group.tdh },
        rep: { ...group.group.rep },
        cic: { ...group.group.cic },
        level: { ...group.group.level },
        owns_nfts: group.group.owns_nfts.map((ownership) => ({
          ...ownership,
          tokens: [...ownership.tokens],
        })),
        identity_addresses: normalizedIncludedWallets.length
          ? normalizedIncludedWallets
          : null,
        excluded_identity_addresses: nonOverlappingExcludedWallets.length
          ? nonOverlappingExcludedWallets
          : null,
        is_beneficiary_of_grant_id: group.group.is_beneficiary_of_grant_id,
        is_beneficiary_of_grant_match_mode:
          group.group.is_beneficiary_of_grant_match_mode,
      },
    },
    identities: normalizedIncludedWallets.map(
      createInlineGroupIdentityFromWallet
    ),
    excludedIdentities: nonOverlappingExcludedWallets.map(
      createInlineGroupIdentityFromWallet
    ),
    includedWalletSources,
    excludedWalletSources,
    panel: "rule-list",
    activeRule: null,
    criteriaReplacementActive: true,
  };
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
  beneficiaryGrantCollectionName,
  identityLabels,
  locale = DEFAULT_LOCALE,
}: {
  readonly draft: ApiCreateGroup;
  readonly identityCount: number;
  readonly beneficiaryGrantCollectionName?: string | null | undefined;
  readonly identityLabels?: GroupCriteriaIdentityLabels | undefined;
  readonly locale?: SupportedLocale | undefined;
}): string | null => {
  const normalizedCollectionName = beneficiaryGrantCollectionName?.trim() ?? "";
  let grantCriterionOverride: string | undefined;
  if (hasGrantRule(draft)) {
    grantCriterionOverride = normalizedCollectionName
      ? t(locale, "waves.create.groups.members.criteria.grant.collection", {
          collectionName: normalizedCollectionName,
        })
      : t(locale, "waves.create.groups.members.criteria.grant.selected");
  }
  const summary = getGroupCriteriaSummary({
    group: draft.group,
    locale,
    includedCountOverride: identityCount,
    grantCriterionOverride,
    identityLabels,
  });
  return summary.text;
};

export const buildInlineGroupName = ({
  waveName,
  groupLabel,
  fallbackName,
}: {
  readonly waveName: string | null | undefined;
  readonly groupLabel: string | null | undefined;
  readonly fallbackName: string;
}): string => {
  const normalizedWaveName = waveName?.trim() ?? "";
  const normalizedGroupLabel = groupLabel?.trim() ?? "";

  if (!normalizedWaveName.length) {
    return normalizedGroupLabel || fallbackName;
  }

  if (!normalizedGroupLabel.length) {
    return normalizedWaveName;
  }

  return `${normalizedWaveName} ${normalizedGroupLabel}`;
};
