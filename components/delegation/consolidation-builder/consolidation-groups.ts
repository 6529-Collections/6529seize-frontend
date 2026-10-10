import { CONSOLIDATION_WALLET_LIMIT } from "@/constants/consolidation.constants";
import { isAddress } from "viem";
import { toWalletKey } from "./consolidation-plan";

/**
 * Current consolidation of each wallet, keyed by lowercased wallet. A wallet
 * that is not consolidated maps to an empty list.
 */
export type ConsolidationGroups = ReadonlyMap<string, readonly string[]>;

export interface ConsolidationDeparture {
  /** Listed wallets that leave the same current consolidation. */
  readonly wallets: readonly string[];
  /** Its members that are not listed and will be separated from them. */
  readonly separatedFrom: readonly string[];
}

/**
 * Reads `GET /api/consolidations/{wallet}`, which returns the wallets of the
 * wallet's current consolidation. Fewer than two wallets means none.
 */
export function parseConsolidationGroup(response: unknown): string[] {
  const data: unknown =
    typeof response === "object" && response !== null
      ? Reflect.get(response, "data")
      : undefined;
  if (!Array.isArray(data)) {
    return [];
  }
  const members = [
    ...new Set(
      data
        .filter(
          (wallet): wallet is string =>
            typeof wallet === "string" && isAddress(wallet, { strict: false })
        )
        .map(toWalletKey)
    ),
  ];
  return members.length >= 2 ? members : [];
}

/**
 * Wallets to prefill: the connected wallet first, then the rest of its
 * current consolidation.
 */
export function getPrefillWallets(
  connectedAddress: string,
  connectedGroup: readonly string[]
): string[] {
  const connected = toWalletKey(connectedAddress);
  const others = connectedGroup
    .map(toWalletKey)
    .filter((wallet) => wallet !== connected);
  const isMember = others.length < connectedGroup.length;
  return [connected, ...(isMember ? others : [])].slice(
    0,
    CONSOLIDATION_WALLET_LIMIT
  );
}

/**
 * The listed wallets that belong to the current consolidation being
 * extended: the consolidation containing the most listed wallets, with ties
 * going to the consolidation of the wallet listed first.
 */
export function selectExistingMembers(
  wallets: readonly string[],
  groups: ConsolidationGroups
): string[] {
  let best: { members: ReadonlySet<string>; count: number } | undefined;

  for (const wallet of wallets) {
    const group = groups.get(wallet) ?? [];
    if (group.length < 2) {
      continue;
    }
    const members = new Set(group.map(toWalletKey));
    const count = wallets.filter((listed) => members.has(listed)).length;
    if (!best || count > best.count) {
      best = { members, count };
    }
  }

  const selected = best?.members;
  return selected ? wallets.filter((wallet) => selected.has(wallet)) : [];
}

/**
 * Listed wallets whose current consolidation includes unlisted wallets,
 * grouped by the consolidation they leave.
 */
export function getConsolidationDepartures(
  wallets: readonly string[],
  groups: ConsolidationGroups
): ConsolidationDeparture[] {
  const listed = new Set(wallets);
  const departures = new Map<
    string,
    { wallets: string[]; separatedFrom: string[] }
  >();

  for (const wallet of wallets) {
    const group = (groups.get(wallet) ?? []).map(toWalletKey);
    const separatedFrom = group.filter((member) => !listed.has(member));
    if (group.length < 2 || separatedFrom.length === 0) {
      continue;
    }
    const key = [...group].sort().join(",");
    const departure = departures.get(key);
    if (departure) {
      departure.wallets.push(wallet);
    } else {
      departures.set(key, { wallets: [wallet], separatedFrom });
    }
  }

  return [...departures.values()];
}
