import type { ApiGroupOwnsNft } from "@/generated/models/ApiGroupOwnsNft";
import type { WaveGroupCriteria } from "../../hooks/useWaveGroupCriteria";

const CANONICAL_IDENTIFIER_LOCALE = "en-US";

const normalizeText = (value: string | null | undefined): string | null => {
  const normalized = value?.trim() ?? "";
  return normalized.length ? normalized : null;
};

const normalizeCaseInsensitiveIdentifier = (
  value: string | null | undefined
): string | null =>
  normalizeText(value)?.toLocaleLowerCase(CANONICAL_IDENTIFIER_LOCALE) ?? null;

const compareCanonicalIdentifiers = (left: string, right: string): number =>
  left.localeCompare(right, CANONICAL_IDENTIFIER_LOCALE);

const normalizeWallets = (wallets: readonly string[]): string[] =>
  [
    ...new Set(
      wallets
        .map(normalizeCaseInsensitiveIdentifier)
        .filter((wallet): wallet is string => wallet !== null)
    ),
  ].sort(compareCanonicalIdentifiers);

const normalizeNftOwnerships = (
  ownerships: readonly ApiGroupOwnsNft[]
): Array<{
  readonly name: string;
  readonly matchMode: string | null;
  readonly tokens: readonly string[];
}> =>
  ownerships
    .map((ownership) => ({
      name: ownership.name,
      matchMode: ownership.match_mode ?? null,
      tokens: [
        ...new Set(
          ownership.tokens
            .map(normalizeCaseInsensitiveIdentifier)
            .filter((token): token is string => token !== null)
        ),
      ].sort(compareCanonicalIdentifiers),
    }))
    .sort((left, right) => {
      const leftKey = `${left.name}:${left.matchMode ?? ""}:${left.tokens.join(",")}`;
      const rightKey = `${right.name}:${right.matchMode ?? ""}:${right.tokens.join(",")}`;
      return compareCanonicalIdentifiers(leftKey, rightKey);
    });

const getCriteriaSnapshot = (criteria: WaveGroupCriteria) => {
  const group = criteria.group;
  if (group === null) {
    return null;
  }

  return {
    tdh: group.group.tdh,
    rep: {
      ...group.group.rep,
      category: normalizeText(group.group.rep.category),
      user_identity: normalizeText(group.group.rep.user_identity),
    },
    cic: {
      ...group.group.cic,
      user_identity: normalizeText(group.group.cic.user_identity),
    },
    level: group.group.level,
    ownsNfts: normalizeNftOwnerships(group.group.owns_nfts),
    includedWallets: normalizeWallets(criteria.includedWallets),
    excludedWallets: normalizeWallets(criteria.excludedWallets),
    grantId: normalizeCaseInsensitiveIdentifier(
      group.group.is_beneficiary_of_grant_id
    ),
    grantMatchMode: group.group.is_beneficiary_of_grant_match_mode,
  };
};

export const areWaveGroupCriteriaEqual = (
  left: WaveGroupCriteria,
  right: WaveGroupCriteria
): boolean => {
  if (left.group?.id && left.group.id === right.group?.id) {
    return true;
  }

  return (
    JSON.stringify(getCriteriaSnapshot(left)) ===
    JSON.stringify(getCriteriaSnapshot(right))
  );
};
