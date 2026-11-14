/**
 * Wallet forwarding for 6529 Desktop: the shared contract.
 *
 * A Desktop profile that signed in with a browser wallet has no wallet in
 * the app. Its wallet requests travel to the user's browser instead:
 *
 * 1. The app page asks the desktop shell for a wallet request
 *    (`{ method, params, address, chainId }`). The shell validates it with
 *    the same rules as `parseWalletRequest`, binds it to a signed-in
 *    address, gives it a one-time id that it keeps to itself, signs an
 *    envelope with a key it makes at start-up, and opens the browser page.
 * 2. The browser page (`/browser-connector#w=...&s=...`) acts only on an
 *    envelope signed by that key, shows what will be signed, and returns
 *    the wallet's answer through `<scheme>://wallet?data=...`.
 * 3. The shell consumes that link itself (once, before expiry), checks the
 *    signature, and answers the app page with a `WalletBridgeResponse`.
 *    While a request is open the shell reports a `WalletBridgeStatus` with
 *    the short code the browser page also shows.
 *
 * Version 1 forwards signatures only: `personal_sign` and
 * `eth_signTypedData_v4`. Nothing that sends a transaction is forwarded.
 *
 * This module holds only types and pure helpers for those three hops. Every
 * value that crosses a hop is untrusted and is validated here.
 */

import {
  type Address,
  getAddress,
  type Hex,
  isAddress,
  recoverMessageAddress,
  sha256,
} from "viem";

export const WALLET_FORWARDING_VERSION = 1;

/** How long the user has to answer in the browser. */
export const WALLET_REQUEST_TTL_MS = 120_000;

/** The wallet methods that may be forwarded; everything else is refused. */
export const WALLET_FORWARDING_METHODS = [
  "personal_sign",
  "eth_signTypedData_v4",
] as const;

export type WalletForwardingMethod = (typeof WALLET_FORWARDING_METHODS)[number];

/** The link schemes 6529 Desktop builds register (local, staging, production). */
const DESKTOP_SCHEMES = [
  "localcore6529",
  "stagingcore6529",
  "core6529",
] as const;

type DesktopScheme = (typeof DESKTOP_SCHEMES)[number];

// Size caps. The shell applies the same ones before it opens the browser.
const MAX_MESSAGE_BYTES = 8 * 1024;
const MAX_TYPED_DATA_CHARS = 16 * 1024;
const MAX_ENVELOPE_CHARS = 32 * 1024;
const MAX_TYPED_DATA_TYPES = 32;
const MAX_TYPED_DATA_FIELDS = 64;

/** 32 random bytes, base64url without padding. */
const REQUEST_ID = /^[A-Za-z0-9_-]{43}$/;
const HEX_DIGITS = /^0x[0-9a-fA-F]*$/;
const SIGNATURE = /^0x[0-9a-fA-F]{130}$/;
const REQUEST_CODE = /^[0-9A-F]{3}-[0-9A-F]{3}$/;
const TYPE_NAME = /^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/;
const ARRAY_SUFFIX = /\[\d{0,4}\]$/;
const MAX_ARRAY_DEPTH = 4;
const ORIGIN = /^http:\/\/localhost:\d{1,5}$/;

interface TypedDataField {
  readonly name: string;
  readonly type: string;
}

interface WalletTypedData {
  readonly domain: Readonly<Record<string, unknown>>;
  readonly types: Readonly<Record<string, readonly TypedDataField[]>>;
  readonly primaryType: string;
  readonly message: Readonly<Record<string, unknown>>;
}

interface WalletRequestBase {
  /** Checksummed signer, equal to the signer named in the parameters. */
  readonly address: Address;
  readonly chainId: number;
}

/** A forwarded request after validation, in the shape the page signs. */
export type WalletRequest =
  | (WalletRequestBase & {
      readonly method: "personal_sign";
      /** The exact bytes to sign, as hex. */
      readonly message: Hex;
    })
  | (WalletRequestBase & {
      readonly method: "eth_signTypedData_v4";
      readonly typedData: WalletTypedData;
    });

/** What the app page hands to the shell (and the envelope carries). */
export interface WalletRequestInput {
  readonly method: string;
  readonly params: unknown;
  readonly address: string;
  readonly chainId: number;
}

export type WalletRequestProblem =
  | "unsupported-method"
  | "invalid-params"
  | "wrong-address"
  | "wrong-chain"
  | "too-large";

const INVALID_PARAMS = "invalid-params";
const WRONG_ADDRESS = "wrong-address";
const WRONG_CHAIN = "wrong-chain";
const TOO_LARGE = "too-large";

type Parsed<T, P extends string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly problem: P };

const fail = <P extends string>(problem: P) =>
  ({ ok: false, problem }) as const;

/** `0x` followed by whole bytes. */
const isHexBytes = (value: unknown): value is Hex =>
  typeof value === "string" && HEX_DIGITS.test(value) && value.length % 2 === 0;

/** An EIP-712 field type: a type name with up to four array suffixes. */
function isFieldType(value: string): boolean {
  let base = value;
  for (
    let depth = 0;
    depth < MAX_ARRAY_DEPTH && ARRAY_SUFFIX.test(base);
    depth += 1
  ) {
    base = base.replace(ARRAY_SUFFIX, "");
  }
  return TYPE_NAME.test(base);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sameAddress = (value: unknown, address: Address): boolean =>
  typeof value === "string" &&
  isAddress(value, { strict: false }) &&
  value.toLowerCase() === address.toLowerCase();

/** The largest chain id accepted: 2^53 - 1, so every id is exact. */
const MAX_CHAIN_ID = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * A chain id as wallets send it: a safe integer, or a decimal or `0x` hex
 * string, in 1..2^53-1. Strings are read with BigInt, so no value is
 * rounded before the bound is checked.
 */
function readChainId(value: unknown): number | null {
  let parsed: bigint | null = null;
  if (typeof value === "number") {
    parsed = Number.isSafeInteger(value) ? BigInt(value) : null;
  } else if (typeof value === "string" && /^0x[0-9a-fA-F]{1,16}$/.test(value)) {
    parsed = BigInt(value);
  } else if (typeof value === "string" && /^[1-9]\d{0,19}$/.test(value)) {
    parsed = BigInt(value);
  }
  return parsed !== null && parsed > 0n && parsed <= MAX_CHAIN_ID
    ? Number(parsed)
    : null;
}

function parsePersonalSign(
  params: readonly unknown[],
  base: WalletRequestBase
): Parsed<WalletRequest, WalletRequestProblem> {
  const [message, signer] = params;
  if (
    params.length !== 2 ||
    typeof message !== "string" ||
    !isHexBytes(message)
  ) {
    return fail(INVALID_PARAMS);
  }
  if (message === "0x") return fail(INVALID_PARAMS);
  if ((message.length - 2) / 2 > MAX_MESSAGE_BYTES) return fail(TOO_LARGE);
  if (!sameAddress(signer, base.address)) return fail(WRONG_ADDRESS);
  return {
    ok: true,
    value: { ...base, method: "personal_sign", message },
  };
}

function readTypes(
  value: unknown
): Record<string, readonly TypedDataField[]> | null {
  if (!isRecord(value)) return null;
  const entries = Object.entries(value);
  if (entries.length === 0 || entries.length > MAX_TYPED_DATA_TYPES) {
    return null;
  }
  const types: Record<string, readonly TypedDataField[]> = {};
  for (const [name, fields] of entries) {
    if (!TYPE_NAME.test(name) || !Array.isArray(fields)) return null;
    if (fields.length > MAX_TYPED_DATA_FIELDS) return null;
    const parsedFields: TypedDataField[] = [];
    for (const field of fields) {
      if (
        !isRecord(field) ||
        typeof field["name"] !== "string" ||
        typeof field["type"] !== "string" ||
        !TYPE_NAME.test(field["name"]) ||
        !isFieldType(field["type"])
      ) {
        return null;
      }
      parsedFields.push({ name: field["name"], type: field["type"] });
    }
    types[name] = parsedFields;
  }
  return types;
}

function parseTypedData(
  params: readonly unknown[],
  base: WalletRequestBase
): Parsed<WalletRequest, WalletRequestProblem> {
  const [signer, payload] = params;
  if (params.length !== 2 || typeof payload !== "string") {
    return fail(INVALID_PARAMS);
  }
  if (payload.length > MAX_TYPED_DATA_CHARS) return fail(TOO_LARGE);
  if (!sameAddress(signer, base.address)) return fail(WRONG_ADDRESS);
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return fail(INVALID_PARAMS);
  }
  if (!isRecord(parsed)) return fail(INVALID_PARAMS);
  const { domain, message, primaryType } = parsed;
  const types = readTypes(parsed["types"]);
  if (
    !types ||
    !isRecord(domain) ||
    !isRecord(message) ||
    typeof primaryType !== "string" ||
    primaryType === "EIP712Domain" ||
    !(primaryType in types)
  ) {
    return fail(INVALID_PARAMS);
  }
  const chainProblem = checkChainId(domain["chainId"], base.chainId);
  if (chainProblem) return fail(chainProblem);
  return {
    ok: true,
    value: {
      ...base,
      method: "eth_signTypedData_v4",
      typedData: { domain, types, primaryType, message },
    },
  };
}

/** An optional chain id in the request must be the request's chain. */
function checkChainId(
  value: unknown,
  chainId: number
): typeof INVALID_PARAMS | typeof WRONG_CHAIN | null {
  if (value === undefined) return null;
  const parsed = readChainId(value);
  if (parsed === null) return INVALID_PARAMS;
  return parsed === chainId ? null : WRONG_CHAIN;
}

/**
 * Validate a wallet request from the app page (EIP-1193 `method` and
 * `params`), bound to the signed-in `address` and the app's `chainId`.
 * `allowedChainIds` are the chains the app is configured for.
 */
export function parseWalletRequest(
  input: WalletRequestInput,
  allowedChainIds: readonly number[]
): Parsed<WalletRequest, WalletRequestProblem> {
  if (!isRecord(input)) return fail(INVALID_PARAMS);
  const { method, params, address, chainId } = input;
  if (
    typeof method !== "string" ||
    !(WALLET_FORWARDING_METHODS as readonly string[]).includes(method)
  ) {
    return fail("unsupported-method");
  }
  if (typeof address !== "string" || !isAddress(address, { strict: false })) {
    return fail(WRONG_ADDRESS);
  }
  if (
    typeof chainId !== "number" ||
    !Number.isSafeInteger(chainId) ||
    !allowedChainIds.includes(chainId)
  ) {
    return fail(WRONG_CHAIN);
  }
  if (!Array.isArray(params)) return fail(INVALID_PARAMS);
  const base: WalletRequestBase = { address: getAddress(address), chainId };
  switch (method as WalletForwardingMethod) {
    case "personal_sign":
      return parsePersonalSign(params, base);
    case "eth_signTypedData_v4":
      return parseTypedData(params, base);
  }
}

const UTF8 = new TextDecoder("utf-8", { fatal: true });

/**
 * Control characters other than tab, line feed and carriage return, and
 * bidirectional controls that can make text read differently than it signs.
 */
function isHiddenCharacter(codePoint: number): boolean {
  if (codePoint === 0x09 || codePoint === 0x0a || codePoint === 0x0d) {
    return false;
  }
  return (
    codePoint < 0x20 ||
    codePoint === 0x7f ||
    (codePoint >= 0x202a && codePoint <= 0x202e) ||
    (codePoint >= 0x2066 && codePoint <= 0x2069)
  );
}

const hasHiddenCharacters = (text: string): boolean =>
  Array.from(text).some((char) => isHiddenCharacter(char.codePointAt(0) ?? 0));

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array((hex.length - 2) / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16);
  }
  return bytes;
}

/**
 * The text of a `personal_sign` message, or null when the bytes are not
 * readable text (invalid UTF-8, hidden characters). The page refuses to
 * sign what it cannot show.
 */
export function readWalletMessageText(message: Hex): string | null {
  if (!isHexBytes(message) || message === "0x") return null;
  let text: string;
  try {
    text = UTF8.decode(hexToBytes(message));
  } catch {
    return null;
  }
  return text.trim().length > 0 && !hasHiddenCharacters(text) ? text : null;
}

/** What the shell signs and the browser page verifies. */
export interface WalletRequestEnvelope {
  readonly v: typeof WALLET_FORWARDING_VERSION;
  /** One-time request id, made and kept by the shell. */
  readonly id: string;
  /** The link scheme the answer goes back to. */
  readonly scheme: DesktopScheme;
  /** The app origin, which is also the browser page's origin. */
  readonly origin: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly request: WalletRequestInput;
}

export type WalletEnvelopeProblem =
  | "missing"
  | "malformed"
  | "wrong-origin"
  | "expired"
  | WalletRequestProblem;

/** Base64url without padding, built in chunks (no whole-array spreading). */
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let start = 0; start < bytes.length; start += 0x2000) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x2000));
  }
  let encoded = btoa(binary).replaceAll("+", "-").replaceAll("/", "_");
  while (encoded.endsWith("=")) encoded = encoded.slice(0, -1);
  return encoded;
}

function fromBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
    return Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);
  } catch {
    return null;
  }
}

/**
 * The browser page's fragment: `w` is the envelope's UTF-8 JSON bytes
 * (base64url), `s` the shell's EIP-191 signature over exactly those bytes.
 * The shell builds it the same way; this is the reference. Null when the
 * fragment would exceed the cap the page applies when parsing, so a
 * request too large to open is refused before the browser is asked.
 */
export function buildWalletRequestFragment(
  envelopeBytes: Uint8Array,
  signature: Hex
): string | null {
  // Base64 grows by 4/3: refuse before encoding anything too large.
  if (Math.ceil(envelopeBytes.length / 3) * 4 > MAX_ENVELOPE_CHARS) {
    return null;
  }
  const params = new URLSearchParams({
    w: toBase64Url(envelopeBytes),
    s: signature,
  });
  const fragment = `#${params.toString()}`;
  return fragment.length > MAX_ENVELOPE_CHARS ? null : fragment;
}

export function encodeWalletRequestEnvelope(
  envelope: WalletRequestEnvelope
): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(envelope));
}

export interface ParsedWalletRequestFragment {
  readonly envelope: WalletRequestEnvelope;
  readonly request: WalletRequest;
  readonly envelopeBytes: Uint8Array;
  readonly signature: Hex;
}

function readEnvelope(value: unknown): WalletRequestEnvelope | null {
  if (!isRecord(value)) return null;
  const { v, id, scheme, origin, issuedAt, expiresAt, request } = value;
  if (
    v !== WALLET_FORWARDING_VERSION ||
    typeof id !== "string" ||
    !REQUEST_ID.test(id) ||
    typeof scheme !== "string" ||
    !(DESKTOP_SCHEMES as readonly string[]).includes(scheme) ||
    typeof origin !== "string" ||
    !ORIGIN.test(origin) ||
    typeof issuedAt !== "number" ||
    !Number.isSafeInteger(issuedAt) ||
    typeof expiresAt !== "number" ||
    !Number.isSafeInteger(expiresAt) ||
    !isRecord(request)
  ) {
    return null;
  }
  return {
    v,
    id,
    scheme: scheme as DesktopScheme,
    origin,
    issuedAt,
    expiresAt,
    request: request as unknown as WalletRequestInput,
  };
}

/**
 * Read the browser page's fragment. Checks shape, origin, lifetime and the
 * request itself; the caller must still check the signature with
 * `isWalletRequestSignedBy` before showing anything to sign.
 */
export function parseWalletRequestFragment(
  hash: string,
  context: {
    readonly origin: string;
    readonly now: number;
    readonly allowedChainIds: readonly number[];
  }
): Parsed<ParsedWalletRequestFragment, WalletEnvelopeProblem> {
  if (hash.length > MAX_ENVELOPE_CHARS) return fail("malformed");
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const encoded = params.get("w");
  const signature = params.get("s");
  if (!encoded || !signature) return fail("missing");
  if (!SIGNATURE.test(signature)) return fail("malformed");
  const envelopeBytes = fromBase64Url(encoded);
  if (!envelopeBytes) return fail("malformed");
  let json: unknown;
  try {
    json = JSON.parse(UTF8.decode(envelopeBytes));
  } catch {
    return fail("malformed");
  }
  const envelope = readEnvelope(json);
  if (!envelope) return fail("malformed");
  if (envelope.origin !== context.origin) return fail("wrong-origin");
  if (
    envelope.expiresAt <= envelope.issuedAt ||
    envelope.expiresAt <= context.now ||
    envelope.issuedAt > context.now + 60_000 ||
    envelope.expiresAt - envelope.issuedAt > WALLET_REQUEST_TTL_MS
  ) {
    return fail("expired");
  }
  const request = parseWalletRequest(envelope.request, context.allowedChainIds);
  if (!request.ok) return request;
  return {
    ok: true,
    value: {
      envelope,
      request: request.value,
      envelopeBytes,
      signature: signature as Hex,
    },
  };
}

/**
 * True only when `signer` (the address the local server reports for this
 * run of 6529 Desktop) signed exactly these envelope bytes.
 */
export async function isWalletRequestSignedBy(
  fragment: Pick<ParsedWalletRequestFragment, "envelopeBytes" | "signature">,
  signer: string
): Promise<boolean> {
  if (!isAddress(signer, { strict: false })) return false;
  try {
    const recovered = await recoverMessageAddress({
      message: { raw: fragment.envelopeBytes },
      signature: fragment.signature,
    });
    return recovered.toLowerCase() === signer.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Short code shown both in the app and on the browser page, so the user can
 * tell that the page belongs to the request they started.
 * Six hex characters of SHA-256 over the id, as `ABC-123`.
 */
export function walletRequestCode(id: string): string {
  const digest = sha256(new TextEncoder().encode(id)).slice(2, 8).toUpperCase();
  return `${digest.slice(0, 3)}-${digest.slice(3)}`;
}

/** Why the browser page did not return a signature. */
const WALLET_RESULT_FAILURES = [
  "rejected",
  "failed",
  "wrong-account",
  "wrong-chain",
  "refused",
] as const;

type WalletResultFailure = (typeof WALLET_RESULT_FAILURES)[number];

/** What the browser page sends back through `<scheme>://wallet?data=`. */
export type WalletResult =
  | {
      readonly v: typeof WALLET_FORWARDING_VERSION;
      readonly id: string;
      readonly ok: true;
      readonly value: Hex;
    }
  | {
      readonly v: typeof WALLET_FORWARDING_VERSION;
      readonly id: string;
      readonly ok: false;
      readonly code: WalletResultFailure;
    };

/** `v`, `id`, `ok` and `value` (success) or `code` (failure), nothing else. */
function hasResultKeys(value: Record<string, unknown>): boolean {
  const own = Object.keys(value);
  const expected = ["v", "id", "ok", value["ok"] === true ? "value" : "code"];
  return (
    own.length === expected.length && expected.every((key) => own.includes(key))
  );
}

/** A 65-byte signature, as an externally owned account's wallet returns. */
const isSignature = (value: unknown): value is Hex =>
  typeof value === "string" && SIGNATURE.test(value);

export function buildWalletResultDeepLink(
  scheme: DesktopScheme,
  result: WalletResult
): string {
  return `${scheme}://wallet?data=${encodeURIComponent(JSON.stringify(result))}`;
}

/**
 * Validate a returned result. The shell applies the same rules and also
 * matches the id to its live request.
 */
export function parseWalletResult(value: unknown): WalletResult | null {
  // Exactly the result's keys: every field is then bounded by its own
  // check, with no need to serialize untrusted input to measure it.
  if (!isRecord(value) || !hasResultKeys(value)) return null;
  const { v, id, ok } = value;
  if (
    v !== WALLET_FORWARDING_VERSION ||
    typeof id !== "string" ||
    !REQUEST_ID.test(id)
  ) {
    return null;
  }
  if (ok === true) {
    const result = value["value"];
    return isSignature(result)
      ? { v, id, ok, value: result.toLowerCase() as Hex }
      : null;
  }
  const code = value["code"];
  if (
    ok === false &&
    typeof code === "string" &&
    (WALLET_RESULT_FAILURES as readonly string[]).includes(code)
  ) {
    return { v, id, ok, code: code as WalletResultFailure };
  }
  return null;
}

/** Why the shell could not return a wallet answer to the app page. */
const WALLET_BRIDGE_FAILURES = [
  ...WALLET_RESULT_FAILURES,
  "cancelled",
  "expired",
  "busy",
  "invalid",
  "unsupported",
  "not-signed-in",
] as const;

type WalletBridgeFailure = (typeof WALLET_BRIDGE_FAILURES)[number];

const isBridgeFailure = (value: unknown): value is WalletBridgeFailure =>
  typeof value === "string" &&
  (WALLET_BRIDGE_FAILURES as readonly string[]).includes(value);

/** A fixed diagnostic word the shell may add to a failure; never data. */
const REASON = /^[a-z][a-z-]{0,39}$/;

/** The shell's answer to `window.desktopWallet.request(...)`. */
export type WalletBridgeResponse =
  | { readonly ok: true; readonly value: Hex }
  | {
      readonly ok: false;
      readonly code: WalletBridgeFailure;
      /** For example `unverified-signature`, `too-large`. */
      readonly reason?: string;
    };

/** Validate the shell's answer; anything unexpected counts as a failure. */
export function parseWalletBridgeResponse(
  value: unknown
): WalletBridgeResponse {
  if (isRecord(value) && value["ok"] === true) {
    const result = value["value"];
    return isSignature(result)
      ? { ok: true, value: result.toLowerCase() as Hex }
      : { ok: false, code: "failed" };
  }
  const code = isRecord(value) ? value["code"] : undefined;
  const reason = isRecord(value) ? value["reason"] : undefined;
  return {
    ok: false,
    code: isBridgeFailure(code) ? code : "failed",
    ...(typeof reason === "string" && REASON.test(reason) ? { reason } : {}),
  };
}

/**
 * The shell's `window.desktopWallet.status()` and `onStatusChange` payload:
 * whether a request is open, with the short code the browser page also
 * shows. The request id itself never reaches the app page.
 */
export type WalletBridgeStatus =
  | { readonly pending: false }
  | {
      readonly pending: true;
      readonly requestCode: string;
      readonly method: WalletForwardingMethod;
      readonly expiresAt: number;
    };

/** Validate a shell status; anything unexpected reads as no open request. */
export function parseWalletBridgeStatus(value: unknown): WalletBridgeStatus {
  if (!isRecord(value) || value["pending"] !== true) return { pending: false };
  const { code, method, expiresAt } = value;
  return typeof code === "string" &&
    REQUEST_CODE.test(code) &&
    typeof method === "string" &&
    (WALLET_FORWARDING_METHODS as readonly string[]).includes(method) &&
    typeof expiresAt === "number" &&
    Number.isSafeInteger(expiresAt) &&
    expiresAt > 0
    ? {
        pending: true,
        requestCode: code,
        method: method as WalletForwardingMethod,
        expiresAt,
      }
    : { pending: false };
}

/**
 * The methods the shell forwards, from `window.desktopWallet.capabilities()`
 * (`{ version: 1, methods: [...] }`). Empty when the shell speaks another
 * version or names no method this website forwards.
 */
export function parseWalletBridgeCapabilities(
  value: unknown
): readonly WalletForwardingMethod[] {
  if (
    !isRecord(value) ||
    value["version"] !== WALLET_FORWARDING_VERSION ||
    !Array.isArray(value["methods"])
  ) {
    return [];
  }
  const offered: readonly unknown[] = value["methods"];
  return WALLET_FORWARDING_METHODS.filter((method) => offered.includes(method));
}
