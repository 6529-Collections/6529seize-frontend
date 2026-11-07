import {
  SANCTIONS_SOURCE_ORDER,
  type SanctionsListing,
  type SanctionsListV1,
  type SanctionsSourceId,
} from "@/lib/sanctions/sanctions-list.types";

/**
 * The public page's view of the list. Built only from the published list
 * (official public data); nothing here may come from 6529 profiles or match
 * results.
 */

export interface SanctionsPageRow {
  readonly address: string;
  readonly labels: ReadonlyArray<string>;
  readonly reference: string;
  readonly programs: ReadonlyArray<string>;
  readonly entity: string | null;
  readonly listedOn: string | null;
  readonly validUntil: string | null;
}

export interface SanctionsPageGroup {
  /** Unique per group: the source id, or `il-nbctf-lapsed`. */
  readonly key: string;
  readonly source: SanctionsSourceId;
  readonly lapsed: boolean;
  readonly url: string;
  readonly sourcePublished: string | null;
  readonly addressCount: number;
  readonly rows: ReadonlyArray<SanctionsPageRow>;
}

export interface SanctionsPageModel {
  readonly asOf: string;
  /** Distinct addresses with at least one listing in force on `asOf`. */
  readonly enforcedAddressCount: number;
  readonly sourceCount: number;
  readonly groups: ReadonlyArray<SanctionsPageGroup>;
}

/** Same rule as the spec's `listingInForce`: `valid_until` is inclusive. */
export function isListingInForce(
  listing: SanctionsListing,
  asOf: string
): boolean {
  return listing.valid_until === null || listing.valid_until >= asOf;
}

function toRow(address: string, listing: SanctionsListing): SanctionsPageRow {
  return {
    address,
    labels: listing.labels,
    reference: listing.entry_id,
    programs: listing.programs,
    entity: listing.entity,
    listedOn: listing.listed_on,
    validUntil: listing.valid_until,
  };
}

function compareRows(a: SanctionsPageRow, b: SanctionsPageRow): number {
  if (a.address !== b.address) {
    return a.address < b.address ? -1 : 1;
  }
  if (a.reference === b.reference) {
    return 0;
  }
  return a.reference < b.reference ? -1 : 1;
}

function group(
  source: SanctionsListV1["sources"][number],
  rows: SanctionsPageRow[],
  lapsed: boolean
): SanctionsPageGroup {
  const sorted = [...rows].sort(compareRows);
  return {
    key: lapsed ? `${source.id}-lapsed` : source.id,
    source: source.id,
    lapsed,
    url: source.url,
    sourcePublished: source.source_published,
    addressCount: new Set(sorted.map((row) => row.address)).size,
    rows: sorted,
  };
}

/**
 * Groups the list by issuing authority in display order. Listings that have
 * lapsed (only Israeli orders carry end dates) go to a separate, clearly
 * labelled group after their authority and are not counted as enforced.
 */
export function buildSanctionsPageModel(
  list: SanctionsListV1,
  asOf: string
): SanctionsPageModel {
  const inForce = new Map<SanctionsSourceId, SanctionsPageRow[]>();
  const lapsed = new Map<SanctionsSourceId, SanctionsPageRow[]>();
  const enforced = new Set<string>();

  for (const entry of list.addresses) {
    for (const listing of entry.listings) {
      const target = isListingInForce(listing, asOf) ? inForce : lapsed;
      const rows = target.get(listing.source) ?? [];
      rows.push(toRow(entry.address, listing));
      target.set(listing.source, rows);
      if (target === inForce) {
        enforced.add(entry.address);
      }
    }
  }

  const groups: SanctionsPageGroup[] = [];
  for (const id of SANCTIONS_SOURCE_ORDER) {
    const source = list.sources.find((candidate) => candidate.id === id);
    if (!source) {
      continue;
    }
    groups.push(group(source, inForce.get(id) ?? [], false));
    const lapsedRows = lapsed.get(id);
    if (lapsedRows && lapsedRows.length > 0) {
      groups.push(group(source, lapsedRows, true));
    }
  }

  return {
    asOf,
    enforcedAddressCount: enforced.size,
    sourceCount: list.sources.length,
    groups,
  };
}
