/**
 * The published sanctions list, `6529.sanctions-list.v1`. The normative spec
 * and test vectors live in the backend repository
 * (`specs/sanctions-list-v1.md`); this mirrors its payload shape.
 */

export const SANCTIONS_LIST_SCHEMA = "6529.sanctions-list.v1";

/** Display order on the public page: the issuing jurisdictions, US first. */
export const SANCTIONS_SOURCE_ORDER = [
  "us-ofac-sdn",
  "uk-fcdo",
  "eu-fsf",
  "ch-seco",
  "jp-mof",
  "kr-fsc",
  "il-nbctf",
  "ca-sema",
] as const;

export type SanctionsSourceId = (typeof SANCTIONS_SOURCE_ORDER)[number];

export interface SanctionsListSource {
  readonly id: SanctionsSourceId;
  readonly authority: string;
  readonly jurisdiction: string;
  readonly list_name: string;
  readonly nature: "sanctions_designation" | "seizure_order";
  readonly url: string;
  readonly acquisition: "automatic" | "pinned_manual";
  readonly parser: string;
  readonly inputs: ReadonlyArray<{
    readonly name: string;
    readonly sha256: string;
    readonly bytes: number;
  }>;
  readonly source_published: string | null;
  readonly evm_addresses: number;
  readonly listings: number;
}

export interface SanctionsListing {
  readonly source: SanctionsSourceId;
  readonly entry_id: string;
  readonly entity: string | null;
  readonly programs: ReadonlyArray<string>;
  readonly labels: ReadonlyArray<string>;
  readonly listed_on: string | null;
  readonly valid_until: string | null;
}

export interface SanctionsListV1 {
  readonly schema: typeof SANCTIONS_LIST_SCHEMA;
  readonly builder: string;
  readonly chain_family: "evm";
  readonly sources: ReadonlyArray<SanctionsListSource>;
  readonly addresses: ReadonlyArray<{
    readonly address: string;
    readonly listings: ReadonlyArray<SanctionsListing>;
  }>;
  readonly totals: {
    readonly addresses: number;
    readonly listings: number;
    readonly sources: number;
  };
}
