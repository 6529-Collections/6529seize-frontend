/**
 * ServiceRecord: what an operator of a network service publishes.
 *
 * Source: 6529chain `design/p2p-venue.md` §3.2-§3.3 (P44 VS1-VS9), which
 * extends P37's operator record (`content-and-data-obligations.md` NR8).
 * VS1 lists the contents: operator principal, service types, endpoints
 * (multiaddrs or URLs), capacity, price terms or free, retention,
 * jurisdictions, abuse contact and subscribed lists; NR8 adds name or legal
 * entity, DMCA agent and policy URL. A key that a CAPABILITY_GRANT scopes
 * to SERVICE signs it.
 *
 * The design leaves the byte schema, DHT keys, list format and signature
 * open (P44 VE6). This is therefore a client-side shape, `v: 0`, with the
 * signature carried but unverified. When VE6 fixes the encoding, a new
 * version sits beside this one behind the same reader.
 */
import type { Hex } from "viem";

/** P44 §3.2 service roles, plus the Ethereum RPC role DN12 relies on. */
export type ServiceRole =
  | "relay"
  | "dht"
  | "host"
  | "inbox"
  | "turn"
  | "sfu"
  | "edge-sfu"
  | "pinner"
  | "archive"
  | "indexer"
  | "labeler"
  | "gateway"
  | "notifier"
  | "web-mirror"
  | "membership-prover"
  | "ethereum-rpc"
  | "anonymity-transport";

export interface ServiceOffer {
  readonly role: ServiceRole;
  /** Multiaddrs or URLs (VS1). */
  readonly endpoints: readonly string[];
  /** Free text from the operator, e.g. requests per second. */
  readonly capacity?: string;
}

export type ServicePrice = { readonly free: true } | { readonly terms: string };

export interface ServiceRecordSignature {
  /** The SERVICE-scoped key's keyId (P28 §2.4). */
  readonly keyId: Hex;
  readonly signature: Hex;
}

export interface ServiceRecordV0 {
  readonly v: 0;
  readonly operator: {
    /** Principal ID once the operator has one on chain. */
    readonly principal: Hex | null;
    readonly name: string;
    readonly legalEntity?: string;
  };
  readonly services: readonly ServiceOffer[];
  readonly price: ServicePrice;
  readonly retentionDays?: number;
  /** ISO 3166-1 alpha-2 codes. */
  readonly jurisdictions: readonly string[];
  readonly abuseContact: string;
  readonly dmcaAgent?: string;
  readonly policyUrl?: string;
  /** Lists the operator subscribes to (VS1, NR8). */
  readonly subscribedLists: readonly string[];
  /** Unverified until P44 VE6 fixes the record's encoding and signature. */
  readonly signature: ServiceRecordSignature | null;
}

export type ServiceRecord = ServiceRecordV0;

/** VS4/VS7/GW4: clients use at least two operators per function. */
export const SERVICE_MIN_OPERATORS = 2;

/**
 * The operator key used to count distinct operators.
 *
 * VS1 identifies an operator by its principal, so a principal ID (compared
 * case-insensitively, as hex) is the key. A record without a principal
 * falls back to its self-declared name, case-folded and trimmed. That
 * fallback is a heuristic, not an identity: one operator can publish
 * records under several names, and VS9 says distinct records never prove
 * distinct operators. Callers must not treat the count as a guarantee.
 */
export function operatorKey(record: ServiceRecord): string {
  const principal = record.operator.principal;
  if (principal !== null) {
    return `principal:${principal.toLowerCase()}`;
  }
  return `name:${record.operator.name.trim().toLowerCase()}`;
}

/** Distinct operator keys offering `role` (a heuristic count; see `operatorKey`). */
export function operatorsFor(records: readonly ServiceRecord[], role: ServiceRole): string[] {
  const keys = records
    .filter((record) => record.services.some((offer) => offer.role === role))
    .map((record) => operatorKey(record));
  return [...new Set(keys)];
}
