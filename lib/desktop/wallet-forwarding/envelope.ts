/** Wallet forwarding: the signed request envelope and the browser fragment. */

import { type Hex, isAddress, recoverMessageAddress } from "viem";
import { UTF8 } from "./messageText";
import { parseWalletRequest } from "./request";
import {
  DESKTOP_SCHEMES,
  type DesktopScheme,
  fail,
  isRecord,
  MAX_ENVELOPE_CHARS,
  ORIGIN,
  type Parsed,
  REQUEST_ID,
  SIGNATURE,
  WALLET_FORWARDING_VERSION,
  WALLET_REQUEST_TTL_MS,
  type WalletRequest,
  type WalletRequestInput,
  type WalletRequestProblem,
} from "./shared";
import { base64UrlLength } from "./size";

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
    binary += String.fromCodePoint(...bytes.subarray(start, start + 0x2000));
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
  if (base64UrlLength(envelopeBytes.length) > MAX_ENVELOPE_CHARS) {
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
