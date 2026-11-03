/**
 * CertificateReader: daily TDH certificates and cycle records, with
 * provenance.
 *
 * Sources: `6529validator` ARCHITECTURE.md §7.1 (local API routes) and
 * `crates/node-api/src/status.rs` (bodies, format 1).
 *
 *   GET /api/v1/cycles?from=N&to=M     [CycleRecord], at most 64
 *   GET /api/v1/certificates/{day}     [CertificateView]
 *
 * The local API listens on 127.0.0.1:6529, checks the Host header, and
 * wants a bearer token (the CLI's, from `run/api.json`) or a session cookie
 * plus CSRF token. A web page cannot call it; the desktop app's main
 * process can, once a pairing flow (D145) hands it a token. This reader
 * therefore takes the token and `fetch` as parameters.
 *
 * Every read carries provenance. The client does not verify the BLS
 * aggregate, so a certificate is always the named node's claim, even when
 * that node says `verified_here` (GW5's rule, applied to validators).
 */
import type { CertificateView, CycleRecord } from "./types";
import { parseCertificateView, parseCycleRecord, ValidatorFormatError } from "./parse";

export const VALIDATOR_LOCAL_API = "http://127.0.0.1:6529";
/** ARCHITECTURE.md §7.1: `/cycles` answers at most 64 records. */
export const MAX_CYCLES_PER_READ = 64;

export interface CertificateProvenance {
  /** Where the read came from, e.g. "validator-local-api" or "fixture". */
  readonly source: string;
  /** The node or fixture whose word this is. */
  readonly reportedBy: string;
  /** Always false: the client checks no aggregate signature itself. */
  readonly verifiedByClient: false;
}

export interface CertificateRead<T> {
  readonly value: T;
  readonly prov: CertificateProvenance;
}

export interface CertificateReader {
  certificates(day: number, signal?: AbortSignal): Promise<CertificateRead<CertificateView[]>>;
  cycles(from: number, to: number, signal?: AbortSignal): Promise<CertificateRead<CycleRecord[]>>;
}

function checkDay(day: number): void {
  if (!Number.isSafeInteger(day) || day < 0 || day > 0xffffffff) {
    throw new RangeError("a cycle day is a uint32");
  }
}

function checkRange(from: number, to: number): void {
  checkDay(from);
  checkDay(to);
  if (to < from || to - from >= MAX_CYCLES_PER_READ) {
    throw new RangeError(`ask for 1 to ${MAX_CYCLES_PER_READ} days, from <= to`);
  }
}

function parseList<T>(value: unknown, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) {
    throw new ValidatorFormatError("expected an array");
  }
  return (value as readonly unknown[]).map((item) => parse(item));
}

export interface ValidatorApiReaderOptions {
  readonly baseUrl?: string;
  /** The CLI's bearer token, or one a pairing flow issued. */
  readonly bearerToken?: string;
  /** A label for provenance, e.g. the node's name. */
  readonly nodeLabel?: string;
  readonly fetch?: typeof fetch;
}

export function createValidatorApiCertificateReader(
  options: ValidatorApiReaderOptions = {}
): CertificateReader {
  const baseUrl = (options.baseUrl ?? VALIDATOR_LOCAL_API).replace(/\/$/, "");
  const doFetch = options.fetch ?? fetch;
  const prov: CertificateProvenance = {
    source: "validator-local-api",
    reportedBy: options.nodeLabel ?? baseUrl,
    verifiedByClient: false,
  };

  async function get(path: string, signal?: AbortSignal): Promise<unknown> {
    const headers: Record<string, string> = { accept: "application/json" };
    if (options.bearerToken !== undefined) {
      headers["authorization"] = `Bearer ${options.bearerToken}`;
    }
    const init: RequestInit = { method: "GET", headers, cache: "no-store" };
    const response = await doFetch(`${baseUrl}${path}`, signal === undefined ? init : { ...init, signal });
    if (!response.ok) {
      throw new Error(`validator API answered HTTP ${response.status}`);
    }
    return (await response.json()) as unknown;
  }

  return {
    async certificates(day, signal) {
      checkDay(day);
      const value = parseList(await get(`/api/v1/certificates/${day}`, signal), parseCertificateView);
      return { value, prov };
    },
    async cycles(from, to, signal) {
      checkRange(from, to);
      const value = parseList(await get(`/api/v1/cycles?from=${from}&to=${to}`, signal), parseCycleRecord);
      return { value, prov };
    },
  };
}

/** A recorded set of API answers (see `fixtures/`). */
export interface ValidatorFixture {
  readonly provenance: string;
  readonly cycles: readonly unknown[];
  readonly certificates: Readonly<Record<string, readonly unknown[]>>;
}

export function createFixtureCertificateReader(
  fixture: ValidatorFixture,
  label = "fixture"
): CertificateReader {
  const prov: CertificateProvenance = { source: "fixture", reportedBy: label, verifiedByClient: false };
  const records = fixture.cycles.map((record) => parseCycleRecord(record));
  // Executors that throw reject, so bad arguments fail like the API reader's.
  return {
    certificates(day) {
      return new Promise((resolve) => {
        checkDay(day);
        resolve({
          value: (fixture.certificates[String(day)] ?? []).map((view) => parseCertificateView(view)),
          prov,
        });
      });
    },
    cycles(from, to) {
      return new Promise((resolve) => {
        checkRange(from, to);
        resolve({ value: records.filter((r) => r.day >= from && r.day <= to), prov });
      });
    },
  };
}
