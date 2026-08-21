import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import type { ApiGroupDescription } from "@/generated/models/ApiGroupDescription";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import { getGroupNftOwnershipCardSummary } from "@/helpers/groups/group-nft-ownership";
import { formatInteger, formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

type GroupCriteria = ApiCreateGroupDescription | ApiGroupDescription;

export type GroupCriteriaSummary =
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
}): string | null => {
  if (min === null && max === null) {
    return null;
  }
  if (min === null) {
    return `≤ ${formatInteger(locale, max)}`;
  }
  if (max === null) {
    return `≥ ${formatInteger(locale, min)}`;
  }
  return `${formatInteger(locale, min)}–${formatInteger(locale, max)}`;
};

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
    return t(
      locale,
      "waves.create.groups.members.criteria.categoryIdentityRange",
      {
        metric,
        category: normalizedCategory,
        direction: directionLabel,
        identity: normalizedIdentity,
        range,
      }
    );
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
    return t(locale, "waves.create.groups.members.criteria.identityRange", {
      metric,
      direction: directionLabel,
      identity: normalizedIdentity,
      range,
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
    return t(locale, "waves.create.groups.members.criteria.categoryRange", {
      metric,
      category: normalizedCategory,
      range,
    });
  }
  if (normalizedCategory) {
    return t(locale, "waves.create.groups.members.criteria.category", {
      metric,
      category: normalizedCategory,
    });
  }

  return t(locale, "waves.create.groups.members.criteria.range", {
    metric,
    range: range ?? "",
  });
};

const getTdhMetric = (
  inclusionStrategy: ApiGroupTdhInclusionStrategy
): string => {
  if (inclusionStrategy === ApiGroupTdhInclusionStrategy.Tdh) {
    return "TDH";
  }
  if (inclusionStrategy === ApiGroupTdhInclusionStrategy.Xtdh) {
    return "xTDH";
  }
  return "TDH + xTDH";
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

  return {
    included: group.identity_group_identities_count,
    excluded: group.excluded_identity_group_identities_count,
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
}: {
  readonly group: GroupCriteria | null | undefined;
  readonly locale: SupportedLocale;
  readonly includedCountOverride?: number | undefined;
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
      t(locale, "waves.create.groups.members.criteria.range", {
        metric: getTdhMetric(group.tdh.inclusion_strategy),
        range: tdhRange,
      })
    );
  }

  const rep = formatIdentityRule({
    locale,
    metric: "REP",
    min: group.rep.min,
    max: group.rep.max,
    direction: group.rep.direction,
    identity: group.rep.user_identity,
    category: group.rep.category,
  });
  if (rep) {
    parts.push(rep);
  }

  const nic = formatIdentityRule({
    locale,
    metric: "NIC",
    min: group.cic.min,
    max: group.cic.max,
    direction: group.cic.direction,
    identity: group.cic.user_identity,
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
      t(locale, "waves.create.groups.members.criteria.range", {
        metric: "Level",
        range: levelRange,
      })
    );
  }

  parts.push(
    ...group.owns_nfts.map((nft) =>
      getGroupNftOwnershipCardSummary(nft, locale)
    )
  );

  if (group.is_beneficiary_of_grant_id?.trim()) {
    parts.push(
      t(locale, "waves.create.groups.members.criteria.grant", {
        grantId: group.is_beneficiary_of_grant_id.trim(),
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
