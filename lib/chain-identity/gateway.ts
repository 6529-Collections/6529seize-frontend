import type { Hex } from "viem";
import { getChainGatewayUrl } from "./config";

/**
 * The public chain gateway: the node's read-and-submit API (drafts, submits,
 * reads) and the gateway's own document store and drip. Requests carry no
 * cookie or login: a transaction authenticates itself.
 */

const DEFAULT_TIMEOUT_MS = 15_000;

export class ChainGatewayError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ChainGatewayError";
  }
}

interface Envelope<T> {
  readonly data?: T;
  readonly next?: string | null;
  readonly error?: { readonly code?: string; readonly message?: string };
}

export interface ChainIdentity {
  readonly principalId: Hex;
  readonly kind: string;
  readonly status: string;
  readonly handle: string | null;
  readonly anchor: Hex;
  readonly primary: Hex;
  readonly wallets: readonly Hex[];
  readonly profile: {
    readonly docCid: Hex;
    readonly version: number;
    readonly updatedHeight: number;
  } | null;
  readonly rep?: { readonly total: string; readonly raters: number };
  readonly nic?: { readonly total: string; readonly raters: number };
  readonly level?: { readonly level: number } | null;
}

interface ChainHandle {
  readonly handle: string;
  readonly valid: boolean;
  readonly available: boolean;
  readonly status: "free" | "claimed" | "reserved" | "invalid";
  readonly principalId: Hex | null;
}

export interface ChainTypedData {
  readonly domain: {
    readonly name: string;
    readonly version: string;
    readonly salt: Hex;
  };
  readonly primaryType: string;
  readonly types: Readonly<
    Record<string, readonly { readonly name: string; readonly type: string }[]>
  >;
  readonly message: Readonly<Record<string, unknown>>;
}

export interface ChainDraft {
  readonly txId: Hex;
  readonly opType: number;
  readonly opName: string | null;
  readonly opVersion: number;
  readonly typedData: ChainTypedData;
  readonly unsigned: Hex;
  readonly envelope: {
    readonly networkId: Hex;
    readonly header: Readonly<Record<string, unknown>>;
  };
  readonly signatures: readonly {
    readonly role: number;
    readonly keyType: number;
    readonly signer: Hex | null;
  }[];
  readonly fee: {
    readonly maxWork: string;
    readonly worst: string;
    readonly maxFee: string;
    readonly sizeBytes: number;
  };
}

export interface ChainDraftRequest {
  readonly opType: string;
  readonly principal?: Hex | null;
  /** keyType 1: the signing wallet. */
  readonly signer?: Hex;
  /** keyType 2: a session key, its id and its grant. */
  readonly keyType?: 1 | 2;
  readonly keyId?: Hex;
  readonly authRef?: Hex;
  readonly body: Readonly<Record<string, unknown>>;
  readonly validForMs?: number;
}

export interface ChainSignatureEntry {
  readonly role: number;
  readonly keyType: number;
  readonly sig: Hex;
}

export interface ChainTxStatus {
  readonly status: "final" | "in_block" | "failed" | "pending";
  readonly height?: number;
  readonly result?: {
    readonly code: number;
    readonly name: string;
    readonly detail: number;
  };
}

interface ChainOps {
  readonly ruleVersion: number;
  readonly currencyAsset: Hex;
}

export interface ChainDelegationRecord {
  readonly scope: "identity" | "wallet";
  readonly holder: Hex;
  readonly collection: Hex;
  readonly delegate: Hex;
  readonly useCase: number;
  readonly allTokens: number;
  readonly tokenId: Hex;
  readonly expiry: string;
  readonly expired: boolean;
  readonly source: "imported" | "set";
}

interface ChainRatingRow {
  readonly rater: Hex;
  readonly target: Hex;
  readonly matter: string;
  readonly category: { readonly id: Hex; readonly name: string | null };
  readonly value: string;
  readonly updatedHeight: number;
}

interface ChainStateRecord {
  readonly key: Hex;
  readonly value: Hex | null;
  readonly valueFields: Readonly<Record<string, unknown>> | null;
}

interface ChainDocUpload {
  readonly cid: string;
  readonly cid_hex: Hex;
}

interface ChainDripInfo {
  readonly address: Hex;
  readonly amount: string;
  readonly message?: string;
}

interface ChainDripResult {
  readonly sent?: boolean;
  readonly to?: Hex;
  readonly tx_id?: Hex;
}

const requireBase = (): string => {
  const base = getChainGatewayUrl();
  if (base === null) {
    throw new ChainGatewayError(0, "unconfigured", "No chain gateway is set.");
  }
  return base;
};

const withTimeout = (signal?: AbortSignal) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  return {
    signal: controller.signal,
    done: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    },
  };
};

interface RequestOptions {
  readonly query?:
    | Readonly<Record<string, string | number | undefined>>
    | undefined;
  readonly json?: unknown;
  readonly bytes?: Uint8Array | undefined;
  readonly signal?: AbortSignal | undefined;
  /** 404 reads as null instead of an error. */
  readonly nullOn404?: boolean | undefined;
  /** The doc store and the drip answer without the node's envelope. */
  readonly bare?: boolean | undefined;
}

const urlOf = (path: string, options: RequestOptions): string => {
  const url = new URL(`${requireBase()}${path}`);
  for (const [name, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(name, String(value));
    }
  }
  return url.toString();
};

const bodyOf = (
  options: RequestOptions
): { readonly body: BodyInit | null; readonly type: string | null } => {
  if (options.json !== undefined) {
    return { body: JSON.stringify(options.json), type: "application/json" };
  }
  if (options.bytes !== undefined) {
    return {
      body: new Uint8Array(options.bytes),
      type: "application/octet-stream",
    };
  }
  return { body: null, type: null };
};

const text = (value: unknown): string | null =>
  typeof value === "string" && value !== "" ? value : null;

/** The node's `{ error: { code, message } }`, or the gateway's own `{ error, message }`. */
const refusalOf = (status: number, parsed: unknown): ChainGatewayError => {
  const answer = (parsed ?? {}) as { error?: unknown; message?: unknown };
  const nested =
    typeof answer.error === "object" && answer.error !== null
      ? (answer.error as { code?: unknown; message?: unknown })
      : null;
  return new ChainGatewayError(
    status,
    text(nested?.code) ?? text(answer.error) ?? `http_${status}`,
    text(nested?.message) ??
      text(answer.message) ??
      `The gateway refused the request (${status}).`
  );
};

async function request<T>(
  method: "GET" | "POST",
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, type } = bodyOf(options);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (type !== null) {
    headers["Content-Type"] = type;
  }
  const timeout = withTimeout(options.signal);
  let response: Response;
  try {
    response = await fetch(urlOf(path, options), {
      method,
      headers,
      body,
      credentials: "omit",
      cache: "no-store",
      signal: timeout.signal,
    });
  } catch {
    throw new ChainGatewayError(
      0,
      "network",
      "The 6529 Network gateway did not answer."
    );
  } finally {
    timeout.done();
  }
  if (response.status === 404 && options.nullOn404 === true) {
    return null as T;
  }
  const parsed: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw refusalOf(response.status, parsed);
  }
  if (options.bare === true) {
    return parsed as T;
  }
  return (parsed as Envelope<T> | null)?.data as T;
}

const lower = (value: string): string => value.toLowerCase();

export const chainGateway = {
  /** The node's status; each read stamp names the network. */
  getStatus: (signal?: AbortSignal) =>
    request<{
      readonly finalized?: { readonly network?: Hex };
      readonly head?: { readonly network?: Hex };
    }>("GET", "/v1/status", { signal }),

  getOps: (signal?: AbortSignal) =>
    request<ChainOps>("GET", "/v1/ops", { signal }),

  getIdentity: (principalId: Hex, signal?: AbortSignal) =>
    request<ChainIdentity | null>(
      "GET",
      `/v1/identities/${lower(principalId)}`,
      { signal, nullOn404: true, query: { at: "head" } }
    ),

  getIdentityByWallet: (wallet: Hex, signal?: AbortSignal) =>
    request<ChainIdentity | null>(
      "GET",
      `/v1/identities/by-wallet/${lower(wallet)}`,
      { signal, nullOn404: true, query: { at: "head" } }
    ),

  getIdentityByHandle: (handle: string, signal?: AbortSignal) =>
    request<ChainIdentity | null>(
      "GET",
      `/v1/identities/by-handle/${encodeURIComponent(lower(handle))}`,
      { signal, nullOn404: true }
    ),

  getHandle: (handle: string, signal?: AbortSignal) =>
    request<ChainHandle>(
      "GET",
      `/v1/handles/${encodeURIComponent(lower(handle))}`,
      { signal, query: { at: "head" } }
    ),

  getDelegationsOfWallet: (wallet: Hex, signal?: AbortSignal) =>
    request<
      readonly {
        readonly scope: "identity" | "wallet";
        readonly holder: Hex;
        readonly records: readonly ChainDelegationRecord[];
        readonly more: boolean;
      }[]
    >("GET", `/v1/delegations/of-wallet/${lower(wallet)}`, {
      signal,
      query: { at: "head", limit: 1000 },
    }),

  getRatingsByRater: (
    principalId: Hex,
    matter: "rep" | "nic",
    signal?: AbortSignal
  ) =>
    request<readonly ChainRatingRow[]>(
      "GET",
      `/v1/ratings/by-rater/${lower(principalId)}`,
      { signal, query: { at: "head", matter, limit: 1000 } }
    ),

  getState: (key: Hex, signal?: AbortSignal) =>
    request<ChainStateRecord>("GET", `/v1/state/${lower(key)}`, {
      signal,
      query: { at: "head" },
    }),

  getTx: (txId: Hex, signal?: AbortSignal) =>
    request<ChainTxStatus | null>("GET", `/v1/tx/${lower(txId)}`, {
      signal,
      nullOn404: true,
    }),

  draft: (draft: ChainDraftRequest, signal?: AbortSignal) =>
    request<ChainDraft>("POST", "/v1/draft", { json: draft, signal }),

  submit: (
    unsigned: Hex,
    signatures: readonly ChainSignatureEntry[],
    signal?: AbortSignal
  ) =>
    request<{ readonly txId: Hex; readonly accepted: boolean }>(
      "POST",
      "/v1/submit",
      { json: { unsigned, signatures }, signal }
    ),

  uploadDoc: (bytes: Uint8Array, cidHex: Hex, signal?: AbortSignal) =>
    request<ChainDocUpload>("POST", "/v1/docs", {
      bytes,
      signal,
      bare: true,
      query: { cid: cidHex },
    }),

  getDoc: async (cidHex: Hex, signal?: AbortSignal): Promise<Uint8Array> => {
    const timeout = withTimeout(signal);
    try {
      const response = await fetch(
        `${requireBase()}/v1/docs/${lower(cidHex)}`,
        { credentials: "omit", signal: timeout.signal }
      );
      if (!response.ok) {
        throw new ChainGatewayError(
          response.status,
          `http_${response.status}`,
          "The profile document could not be read."
        );
      }
      return new Uint8Array(await response.arrayBuffer());
    } finally {
      timeout.done();
    }
  },

  getDrip: (signal?: AbortSignal) =>
    request<ChainDripInfo>("GET", "/v1/drip", { signal, bare: true }),

  postDrip: (address: Hex, signature: Hex, signal?: AbortSignal) =>
    request<ChainDripResult>("POST", "/v1/drip", {
      json: { address: lower(address), signature },
      signal,
      bare: true,
    }),
};
