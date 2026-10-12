import { publicEnv } from "@/config/env";
import type { DBResponse } from "@/entities/IDBResponse";
import type { WalletConsolidation } from "@/entities/IDelegation";
import { areEqualAddresses } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import type {
  ConsolidatedWallet,
  ConsolidationDisplay,
} from "./WalletCheckerResults";

// A consolidation holds at most four wallets, so a grouped wallet has at most
// three counterparties. The cap bounds requests for wallets that also carry
// stray or superseded links.
const MAX_LINKED_CONSOLIDATION_WALLETS = 6;

function getConsolidationsUrl(address: string) {
  return `${publicEnv.API_ENDPOINT}/api/consolidations/${address}?show_incomplete=true`;
}

async function fetchConsolidationRows(
  address: string
): Promise<WalletConsolidation[]> {
  const response: DBResponse<WalletConsolidation> = await fetchUrl(
    getConsolidationsUrl(address)
  );
  return response.data;
}

async function fetchLinkedConsolidationRows(
  address: string
): Promise<WalletConsolidation[]> {
  try {
    return await fetchConsolidationRows(address);
  } catch (error) {
    console.error(
      `Failed to fetch consolidations for related wallet: ${address}`,
      error
    );
    return [];
  }
}

function getLinkedConsolidationWallets(
  address: string,
  rows: WalletConsolidation[]
): string[] {
  const seen = new Set([address.toLowerCase()]);
  const linkedWallets: string[] = [];

  // Confirmed links first, so group members are fetched before stray links.
  const prioritizedRows = rows.toSorted(
    (a, b) => Number(b.confirmed) - Number(a.confirmed)
  );

  for (const row of prioritizedRows) {
    let counterparty: string | undefined;
    if (areEqualAddresses(address, row.wallet1)) {
      counterparty = row.wallet2;
    } else if (areEqualAddresses(address, row.wallet2)) {
      counterparty = row.wallet1;
    }

    if (!counterparty || seen.has(counterparty.toLowerCase())) {
      continue;
    }

    seen.add(counterparty.toLowerCase());
    linkedWallets.push(counterparty);
    if (linkedWallets.length >= MAX_LINKED_CONSOLIDATION_WALLETS) {
      break;
    }
  }

  return linkedWallets;
}

function getConsolidationPairKey(row: WalletConsolidation) {
  const wallet1 = row.wallet1.toLowerCase();
  const wallet2 = row.wallet2.toLowerCase();
  return wallet1 < wallet2 ? `${wallet1}-${wallet2}` : `${wallet2}-${wallet1}`;
}

// Every pair is returned by both of its wallets. Keep one row per pair and,
// when copies disagree, the one from the latest block (its newest state). In
// the same block, prefer the unconfirmed copy so a possibly incomplete link is
// shown rather than hidden.
function dedupeConsolidationPairs(
  rows: WalletConsolidation[]
): WalletConsolidation[] {
  const rowsByPair = new Map<string, WalletConsolidation>();

  for (const row of rows) {
    const key = getConsolidationPairKey(row);
    const existing = rowsByPair.get(key);
    if (
      !existing ||
      row.block > existing.block ||
      (row.block === existing.block && existing.confirmed && !row.confirmed)
    ) {
      rowsByPair.set(key, row);
    }
  }

  return [...rowsByPair.values()];
}

/**
 * Loads the checked wallet's consolidation rows and those of every wallet
 * linked to it, so pairs between the other members of a group (e.g. C<->D
 * when checking A) are included. One row per wallet pair.
 */
export async function fetchConsolidationGroupRows(
  address: string
): Promise<WalletConsolidation[]> {
  const firstData = await fetchConsolidationRows(address);
  const linkedData = await Promise.all(
    getLinkedConsolidationWallets(address, firstData).map((wallet) =>
      fetchLinkedConsolidationRows(wallet)
    )
  );
  return dedupeConsolidationPairs([firstData, ...linkedData].flat());
}

/**
 * One-way links whose reverse direction is missing, limited to links between
 * wallets that belong with the checked wallet: itself, its active
 * consolidation, or wallets it links to. Completing another member's link to
 * an unrelated wallet would move that member out of the group, because the
 * newest confirmed link wins.
 */
export function selectConsolidationActions(
  consolidations: readonly ConsolidationDisplay[],
  consolidatedWallets: readonly ConsolidatedWallet[],
  checkedAddress: string
): ConsolidationDisplay[] {
  const isKnownWallet = (address: string) =>
    areEqualAddresses(address, checkedAddress) ||
    consolidatedWallets.some((wallet) =>
      areEqualAddresses(wallet.address, address)
    ) ||
    consolidations.some(
      (row) =>
        (areEqualAddresses(row.from, checkedAddress) &&
          areEqualAddresses(row.to, address)) ||
        (areEqualAddresses(row.to, checkedAddress) &&
          areEqualAddresses(row.from, address))
    );

  return consolidations.filter(
    (candidate) =>
      isKnownWallet(candidate.from) &&
      isKnownWallet(candidate.to) &&
      !consolidations.some(
        (comparison) =>
          areEqualAddresses(comparison.to, candidate.from) &&
          areEqualAddresses(comparison.from, candidate.to)
      )
  );
}
