import type { ApiGroupOwnsNft } from "@/generated/models/ApiGroupOwnsNft";
import type { WaveGroupCriteria } from "../../hooks/useWaveGroupCriteria";

const normalizeText = (value: string | null | undefined): string | null => {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.length ? normalized : null;
};

const normalizeWallets = (wallets: readonly string[]): string[] =>
  [
    ...new Set(
      wallets
        .map(normalizeText)
        .filter((wallet): wallet is string => wallet !== null)
    ),
  ].sort();

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
            .map(normalizeText)
            .filter((token): token is string => token !== null)
        ),
      ].sort(),
    }))
    .sort((left, right) =>
      `${left.name}:${left.matchMode ?? ""}:${left.tokens.join(",")}`.localeCompare(
        `${right.name}:${right.matchMode ?? ""}:${right.tokens.join(",")}`
      )
    );

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
    grantId: normalizeText(group.group.is_beneficiary_of_grant_id),
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
