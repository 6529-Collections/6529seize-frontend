/** Wallet forwarding: constants, types and small checks shared by the contract modules. */

import { type Address, type Hex, isAddress } from "viem";

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
export const DESKTOP_SCHEMES = [
  "localcore6529",
  "stagingcore6529",
  "core6529",
] as const;

export type DesktopScheme = (typeof DESKTOP_SCHEMES)[number];

// Size caps. The shell applies the same ones before it opens the browser.
export const MAX_MESSAGE_BYTES = 8 * 1024;
export const MAX_TYPED_DATA_CHARS = 16 * 1024;
export const MAX_ENVELOPE_CHARS = 32 * 1024;
export const MAX_TYPED_DATA_TYPES = 32;
export const MAX_TYPED_DATA_FIELDS = 64;

/** 32 random bytes, base64url without padding. */
export const REQUEST_ID = /^[A-Za-z0-9_-]{43}$/;
const HEX_DIGITS = /^0x[0-9a-fA-F]*$/;
export const SIGNATURE = /^0x[0-9a-fA-F]{130}$/;
export const REQUEST_CODE = /^[0-9A-F]{3}-[0-9A-F]{3}$/;
export const TYPE_NAME = /^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/;
const ARRAY_SUFFIX = /\[\d{0,4}\]$/;
const MAX_ARRAY_DEPTH = 4;
export const ORIGIN = /^http:\/\/localhost:\d{1,5}$/;

export interface TypedDataField {
  readonly name: string;
  readonly type: string;
}

interface WalletTypedData {
  readonly domain: Readonly<Record<string, unknown>>;
  readonly types: Readonly<Record<string, readonly TypedDataField[]>>;
  readonly primaryType: string;
  readonly message: Readonly<Record<string, unknown>>;
}

export interface WalletRequestBase {
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

export const INVALID_PARAMS = "invalid-params";
export const WRONG_ADDRESS = "wrong-address";
export const WRONG_CHAIN = "wrong-chain";
export const TOO_LARGE = "too-large";

export type Parsed<T, P extends string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly problem: P };

export const fail = <P extends string>(problem: P) =>
  ({ ok: false, problem }) as const;

/** `0x` followed by whole bytes. */
export const isHexBytes = (value: unknown): value is Hex =>
  typeof value === "string" && HEX_DIGITS.test(value) && value.length % 2 === 0;

/** An EIP-712 field type: a type name with up to four array suffixes. */
export function isFieldType(value: string): boolean {
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

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const sameAddress = (value: unknown, address: Address): boolean =>
  typeof value === "string" &&
  isAddress(value, { strict: false }) &&
  value.toLowerCase() === address.toLowerCase();
