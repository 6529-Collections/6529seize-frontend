import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import type { ApiGroupDescription } from "@/generated/models/ApiGroupDescription";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import { getGroupNftOwnershipCardSummary } from "@/helpers/groups/group-nft-ownership";
import { formatInteger, formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type GroupCriteria = ApiCreateGroupDescription | ApiGroupDescription;

export type GroupCriteriaIdentityLabels = Readonly<Record<string, string>>;

type FormattedRange =
  | { readonly kind: "atMost"; readonly max: string }
  | { readonly kind: "atLeast"; readonly min: string }
  | {
      readonly kind: "between";
      readonly min: string;
      readonly max: string;
    };

type RangeContext =
  | "range"
  | "identityRange"
  | "categoryRange"
  | "categoryIdentityRange";

const RANGE_MESSAGE_KEYS = {
  range: {
    atMost: "waves.create.groups.members.criteria.range.atMost",
    atLeast: "waves.create.groups.members.criteria.range.atLeast",
    between: "waves.create.groups.members.criteria.range.between",
  },
  identityRange: {
    atMost: "waves.create.groups.members.criteria.identityRange.atMost",
    atLeast: "waves.create.groups.members.criteria.identityRange.atLeast",
    between: "waves.create.groups.members.criteria.identityRange.between",
  },
  categoryRange: {
    atMost: "waves.create.groups.members.criteria.categoryRange.atMost",
    atLeast: "waves.create.groups.members.criteria.categoryRange.atLeast",
    between: "waves.create.groups.members.criteria.categoryRange.between",
  },
  categoryIdentityRange: {
    atMost: "waves.create.groups.members.criteria.categoryIdentityRange.atMost",
    atLeast:
      "waves.create.groups.members.criteria.categoryIdentityRange.atLeast",
    between:
      "waves.create.groups.members.criteria.categoryIdentityRange.between",
  },
} as const satisfies Record<
  RangeContext,
  Record<FormattedRange["kind"], MessageKey>
>;

type GroupCriteriaSummary =
  | {
      readonly status: "available";
      readonly text: string | null;
    }
  | {
      readonly status: "unavailable";
      readonly text: null;
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasReadableCriteria = (
  group: GroupCriteria | null | undefined
): group is GroupCriteria =>
  isRecord(group) &&
  isRecord(group.tdh) &&
  isRecord(group.rep) &&
  isRecord(group.cic) &&
  isRecord(group.level) &&
  Array.isArray(group.owns_nfts);

const formatRange = ({
  locale,
  min,
  max,
}: {
  readonly locale: SupportedLocale;
  readonly min: number | null;
  readonly max: number | null;
}): FormattedRange | null => {
  if (min === null && max === null) {
    return null;
  }
  if (min === null) {
    return { kind: "atMost", max: formatInteger(locale, max) };
  }
  if (max === null) {
    return { kind: "atLeast", min: formatInteger(locale, min) };
  }
  return {
    kind: "between",
    min: formatInteger(locale, min),
    max: formatInteger(locale, max),
  };
};

const formatRangedCriterion = ({
  locale,
  context,
  range,
  params,
}: {
  readonly locale: SupportedLocale;
  readonly context: RangeContext;
  readonly range: FormattedRange;
  readonly params: Readonly<Record<string, string | number>>;
}): string =>
  t(locale, RANGE_MESSAGE_KEYS[context][range.kind], {
    ...params,
    ...(range.kind === "atMost" ? { max: range.max } : {}),
    ...(range.kind === "atLeast" ? { min: range.min } : {}),
    ...(range.kind === "between" ? { min: range.min, max: range.max } : {}),
  });

const formatIdentityRule = ({
  locale,
  metric,
  min,
  max,
  direction,
  identity,
  category,
}: {
  readonly locale: SupportedLocale;
  readonly metric: string;
  readonly min: number | null;
  readonly max: number | null;
  readonly direction: ApiGroupFilterDirection | null;
  readonly identity: string | null;
  readonly category?: string | null | undefined;
}): string | null => {
  const range = formatRange({ locale, min, max });
  const normalizedIdentity = identity?.trim() ?? "";
  const normalizedCategory = category?.trim() ?? "";

  if (!range && !normalizedIdentity && !normalizedCategory) {
    return null;
  }

  const directionLabel =
    direction === ApiGroupFilterDirection.Sent
      ? t(locale, "waves.create.groups.members.criteria.to")
      : t(locale, "waves.create.groups.members.criteria.from");

  if (normalizedCategory && normalizedIdentity && range) {
    return formatRangedCriterion({
      locale,
      context: "categoryIdentityRange",
      range,
      params: {
        metric,
        category: normalizedCategory,
        direction: directionLabel,
        identity: normalizedIdentity,
      },
    });
  }
  if (normalizedCategory && normalizedIdentity) {
    return t(locale, "waves.create.groups.members.criteria.categoryIdentity", {
      metric,
      category: normalizedCategory,
      direction: directionLabel,
      identity: normalizedIdentity,
    });
  }
  if (normalizedIdentity && range) {
    return formatRangedCriterion({
      locale,
      context: "identityRange",
      range,
      params: {
        metric,
        direction: directionLabel,
        identity: normalizedIdentity,
      },
    });
  }
  if (normalizedIdentity) {
    return t(locale, "waves.create.groups.members.criteria.identity", {
      metric,
      direction: directionLabel,
      identity: normalizedIdentity,
    });
  }
  if (normalizedCategory && range) {
    return formatRangedCriterion({
      locale,
      context: "categoryRange",
      range,
      params: { metric, category: normalizedCategory },
    });
  }
  if (normalizedCategory) {
    return t(locale, "waves.create.groups.members.criteria.category", {
      metric,
      category: normalizedCategory,
    });
  }

  return range
    ? formatRangedCriterion({
        locale,
        context: "range",
        range,
        params: { metric },
      })
    : null;
};

export const getGroupCriteriaIdentityLabel = ({
  identity,
  identityLabels,
}: {
  readonly identity: string | null;
  readonly identityLabels?: GroupCriteriaIdentityLabels | undefined;
}): string | null => {
  const normalizedIdentity = identity?.trim() ?? "";
  if (!normalizedIdentity) {
    return null;
  }

  return (
    identityLabels?.[normalizedIdentity.toLowerCase()] ?? normalizedIdentity
  );
};

const getTdhMetric = (
  inclusionStrategy: ApiGroupTdhInclusionStrategy,
  locale: SupportedLocale
): string => {
  if (inclusionStrategy === ApiGroupTdhInclusionStrategy.Tdh) {
    return t(locale, "waves.create.groups.members.criteria.metric.tdh");
  }
  if (inclusionStrategy === ApiGroupTdhInclusionStrategy.Xtdh) {
    return t(locale, "waves.create.groups.members.criteria.metric.xtdh");
  }
  return t(locale, "waves.create.groups.members.criteria.metric.tdhAndXtdh");
};

const getExplicitIdentityCounts = ({
  group,
  includedCountOverride,
}: {
  readonly group: GroupCriteria;
  readonly includedCountOverride?: number | undefined;
}): { readonly included: number; readonly excluded: number } => {
  if ("identity_addresses" in group) {
    return {
      included: includedCountOverride ?? group.identity_addresses?.length ?? 0,
      excluded: group.excluded_identity_addresses?.length ?? 0,
    };
  }

  const normalizeCount = (value: unknown): number =>
    typeof value === "number" && Number.isFinite(value) ? value : 0;

  return {
    included: normalizeCount(group.identity_group_identities_count),
    excluded: normalizeCount(group.excluded_identity_group_identities_count),
  };
};

const formatExplicitCount = ({
  locale,
  count,
  kind,
}: {
  readonly locale: SupportedLocale;
  readonly count: number;
  readonly kind: "included" | "excluded";
}): string =>
  t(
    locale,
    `waves.create.groups.members.criteria.${kind}.${count === 1 ? "one" : "other"}`,
    { count: formatInteger(locale, count) }
  );

export const getGroupCriteriaSummary = ({
  group,
  locale,
  includedCountOverride,
  grantCriterionOverride,
  identityLabels,
}: {
  readonly group: GroupCriteria | null | undefined;
  readonly locale: SupportedLocale;
  readonly includedCountOverride?: number | undefined;
  readonly grantCriterionOverride?: string | undefined;
  readonly identityLabels?: GroupCriteriaIdentityLabels | undefined;
}): GroupCriteriaSummary => {
  if (!hasReadableCriteria(group)) {
    return { status: "unavailable", text: null };
  }

  const parts: string[] = [];
  const tdhRange = formatRange({
    locale,
    min: group.tdh.min,
    max: group.tdh.max,
  });
  if (tdhRange) {
    parts.push(
      formatRangedCriterion({
        locale,
        context: "range",
        range: tdhRange,
        params: {
          metric: getTdhMetric(group.tdh.inclusion_strategy, locale),
        },
      })
    );
  }

  const rep = formatIdentityRule({
    locale,
    metric: t(locale, "waves.create.groups.members.criteria.metric.rep"),
    min: group.rep.min,
    max: group.rep.max,
    direction: group.rep.direction,
    identity: getGroupCriteriaIdentityLabel({
      identity: group.rep.user_identity,
      identityLabels,
    }),
    category: group.rep.category,
  });
  if (rep) {
    parts.push(rep);
  }

  const nic = formatIdentityRule({
    locale,
    metric: t(locale, "waves.create.groups.members.criteria.metric.nic"),
    min: group.cic.min,
    max: group.cic.max,
    direction: group.cic.direction,
    identity: getGroupCriteriaIdentityLabel({
      identity: group.cic.user_identity,
      identityLabels,
    }),
  });
  if (nic) {
    parts.push(nic);
  }

  const levelRange = formatRange({
    locale,
    min: group.level.min,
    max: group.level.max,
  });
  if (levelRange) {
    parts.push(
      formatRangedCriterion({
        locale,
        context: "range",
        range: levelRange,
        params: {
          metric: t(
            locale,
            "waves.create.groups.members.criteria.metric.level"
          ),
        },
      })
    );
  }

  parts.push(
    ...group.owns_nfts.map((nft) =>
      getGroupNftOwnershipCardSummary(nft, locale)
    )
  );

  if (group.is_beneficiary_of_grant_id?.trim()) {
    const embeddedGrantCollectionName =
      "is_beneficiary_of_grant" in group
        ? (group.is_beneficiary_of_grant?.target_collection_name?.trim() ?? "")
        : "";
    parts.push(
      grantCriterionOverride ??
        t(locale, "waves.create.groups.members.criteria.grant", {
          grantId:
            embeddedGrantCollectionName.length > 0
              ? embeddedGrantCollectionName
              : group.is_beneficiary_of_grant_id.trim(),
        })
    );
  }

  const explicitCounts = getExplicitIdentityCounts({
    group,
    includedCountOverride,
  });
  if (explicitCounts.included > 0) {
    parts.push(
      formatExplicitCount({
        locale,
        count: explicitCounts.included,
        kind: "included",
      })
    );
  }
  if (explicitCounts.excluded > 0) {
    parts.push(
      formatExplicitCount({
        locale,
        count: explicitCounts.excluded,
        kind: "excluded",
      })
    );
  }

  return {
    status: "available",
    text: parts.length ? formatList(locale, parts) : null,
  };
};
