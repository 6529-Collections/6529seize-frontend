/**
 * Plain-language descriptions of forwarded wallet requests, for the browser
 * page that asks the user's browser wallet to sign for 6529 Desktop.
 *
 * Everything shown is read from the signed request itself, never from a
 * description supplied by the requester. A request the page cannot describe
 * honestly is refused: messages that are not readable text, 6529 sign-in
 * challenges (sessions start only through the sign-in flow), and typed data
 * other than the exact schemas 6529 Desktop signs.
 */

import { type Address, getTypesForEIP712Domain } from "viem";
import { DESKTOP_GRANT_ORIGIN } from "@/components/e2ee/e2eePlatform";
import {
  APP_GRANT_DOMAIN,
  APP_GRANT_DOMAIN_V2,
  APP_GRANT_PRIMARY_TYPE,
  APP_GRANT_TYPES,
  APP_GRANT_TYPES_V2,
  parseAppGrantMessage,
} from "@/lib/device-signing/app-grant";
import {
  GRANT_DOMAIN,
  GRANT_DOMAIN_V2,
  GRANT_PRIMARY_TYPE,
  GRANT_TYPES,
  GRANT_TYPES_V2,
  renderGrantStatement,
} from "@/lib/e2ee/grant";
import {
  PROFILE_CMS_PUBLISH_DOMAIN_NAME,
  PROFILE_CMS_PUBLISH_DOMAIN_VERSION,
  PROFILE_CMS_PUBLISH_EIP712_TYPES,
  PROFILE_CMS_PUBLISH_PRIMARY_TYPE,
} from "@/lib/profile-cms/builder/publish";
import {
  MEMES_SUBMISSION_DOMAIN,
  MEMES_SUBMISSION_TYPES,
} from "@/services/wallet-signatures/memes-submission-signature";
import {
  readWalletMessageText,
  type WalletRequest,
} from "@/lib/desktop/walletForwarding";

/** The typed-data schemas the browser page knows how to describe. */
export type WalletTypedDataKind =
  | "encryptedMessagesGrant"
  | "signedMessagesGrant"
  | "memesSubmission"
  | "profileSitePublish";

interface WalletRequestDetail {
  /** Field path in the signed message, e.g. `Verification.Wallet`. */
  readonly label: string;
  readonly value: string;
}

export type WalletRequestDescription =
  | { readonly kind: "message"; readonly text: string }
  | {
      readonly kind: "typedData";
      readonly schema: WalletTypedDataKind;
      /** Plain sentence the signed message itself carries, if any. */
      readonly statement: string | null;
      /** Values for the schema's summary sentence. */
      readonly summary: Readonly<Record<string, string>>;
      /** Every signed field, so nothing is hidden. */
      readonly details: readonly WalletRequestDetail[];
    };

export type WalletRequestRefusal =
  | "unreadable-message"
  | "sign-in-message"
  | "unknown-typed-data"
  | "wrong-wallet"
  | "wrong-origin"
  | "statement-mismatch";

type DescribedWalletRequest =
  | { readonly ok: true; readonly value: WalletRequestDescription }
  | { readonly ok: false; readonly refusal: WalletRequestRefusal };

const refuse = (refusal: WalletRequestRefusal): DescribedWalletRequest => ({
  ok: false,
  refusal,
});

const SIWE_HEADER_SUFFIX = " wants you to sign in with your Ethereum account:";

/**
 * 6529 sign-in challenges (the structured "6529 Authentication" message, a
 * SIWE message or any login action) must never be signed through
 * forwarding: they would start a session outside the sign-in flow.
 */
function isSignInMessage(text: string): boolean {
  const lines = text.split(/\r?\n/u).map((line) => line.trim());
  return (
    lines[0] === "6529 Authentication" ||
    lines.some(
      (line) => line.endsWith(SIWE_HEADER_SUFFIX) || line === "Action: login"
    )
  );
}

type Json = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Structural equality for the JSON values typed data is made of. */
function sameJson(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => sameJson(item, right[index]))
    );
  }
  if (isRecord(left) && isRecord(right)) {
    const keys = Object.keys(left);
    return (
      keys.length === Object.keys(right).length &&
      keys.every((key) => key in right && sameJson(left[key], right[key]))
    );
  }
  return left === right;
}

type TypedData = Extract<
  WalletRequest,
  { method: "eth_signTypedData_v4" }
>["typedData"];

/**
 * True when the request uses exactly `domain` and `types` (its own
 * `EIP712Domain` entry, when present, must be the one viem derives from
 * that domain, so the wallet hashes the domain that is shown).
 */
function hasSchema(
  typedData: TypedData,
  domain: Json,
  types: Readonly<Record<string, unknown>>
): boolean {
  const { EIP712Domain: domainType, ...rest } = typedData.types;
  const { EIP712Domain: _ignored, ...expectedTypes } = types;
  return (
    sameJson(typedData.domain, domain) &&
    sameJson(rest, expectedTypes) &&
    (domainType === undefined ||
      sameJson(domainType, getTypesForEIP712Domain({ domain })))
  );
}

/** Every signed value as text, nested fields as dotted paths. */
function flatten(value: Json, prefix = ""): WalletRequestDetail[] {
  return Object.entries(value).flatMap(([key, item]) => {
    const label = prefix ? `${prefix}.${key}` : key;
    if (isRecord(item)) return flatten(item, label);
    const text = Array.isArray(item)
      ? item.map((entry) => String(entry)).join(", ")
      : String(item);
    return [{ label, value: text }];
  });
}

const sameAddress = (value: unknown, address: Address): boolean =>
  typeof value === "string" && value.toLowerCase() === address.toLowerCase();

const asText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

function typed(
  schema: WalletTypedDataKind,
  message: Json,
  statement: string | null,
  summary: Record<string, string>
): DescribedWalletRequest {
  return {
    ok: true,
    value: {
      kind: "typedData",
      schema,
      statement,
      summary,
      details: flatten(message),
    },
  };
}

function describeEncryptedMessagesGrant(
  typedData: TypedData,
  address: Address
): DescribedWalletRequest {
  const { message } = typedData;
  if (!sameAddress(message["wallet"], address)) return refuse("wrong-wallet");
  if (message["origin"] !== DESKTOP_GRANT_ORIGIN) return refuse("wrong-origin");
  const statement = message["statement"];
  const deviceKey = message["deviceKey"];
  const expiresAt = Number(message["expiresAt"]);
  if (
    typeof statement !== "string" ||
    typeof deviceKey !== "string" ||
    !Number.isSafeInteger(expiresAt) ||
    renderGrantStatement(deviceKey, expiresAt) !== statement
  ) {
    return refuse("statement-mismatch");
  }
  return typed("encryptedMessagesGrant", message, statement, {});
}

function describeSignedMessagesGrant(
  typedData: TypedData,
  address: Address
): DescribedWalletRequest {
  const { message } = typedData;
  if (!sameAddress(message["wallet"], address)) return refuse("wrong-wallet");
  if (message["origin"] !== DESKTOP_GRANT_ORIGIN) return refuse("wrong-origin");
  // The wallet's JSON carries the uint64 times as decimal strings; the
  // grant reader takes numbers and checks the statement against the fields.
  const read = parseAppGrantMessage(
    JSON.stringify({
      ...message,
      issuedAt: Number(message["issuedAt"]),
      expiresAt: Number(message["expiresAt"]),
    })
  );
  const statement = message["statement"];
  if (!read || typeof statement !== "string") {
    return refuse("statement-mismatch");
  }
  return typed("signedMessagesGrant", message, statement, {});
}

function describeMemesSubmission(
  typedData: TypedData,
  address: Address,
  pageOrigin: string
): DescribedWalletRequest {
  const { message } = typedData;
  const verification = message["Verification"];
  if (
    !isRecord(verification) ||
    !sameAddress(verification["Wallet"], address)
  ) {
    return refuse("wrong-wallet");
  }
  if (verification["Origin"] !== pageOrigin) return refuse("wrong-origin");
  return typed("memesSubmission", message, asText(message["Notice"]) || null, {
    artwork: asText(message["Artwork"]),
    destination: asText(message["Destination"]),
  });
}

function describeProfileSitePublish(
  typedData: TypedData
): DescribedWalletRequest {
  const { message } = typedData;
  return typed("profileSitePublish", message, null, {
    handle: asText(message["handle"]),
    version: asText(message["version"]),
  });
}

function describeTypedData(
  typedData: TypedData,
  request: WalletRequest,
  pageOrigin: string
): DescribedWalletRequest {
  const { primaryType, domain } = typedData;
  const { address } = request;
  if (
    primaryType === GRANT_PRIMARY_TYPE &&
    (hasSchema(typedData, GRANT_DOMAIN, GRANT_TYPES) ||
      hasSchema(typedData, GRANT_DOMAIN_V2, GRANT_TYPES_V2))
  ) {
    return describeEncryptedMessagesGrant(typedData, address);
  }
  if (
    primaryType === APP_GRANT_PRIMARY_TYPE &&
    (hasSchema(typedData, APP_GRANT_DOMAIN, APP_GRANT_TYPES) ||
      hasSchema(typedData, APP_GRANT_DOMAIN_V2, APP_GRANT_TYPES_V2))
  ) {
    return describeSignedMessagesGrant(typedData, address);
  }
  if (
    primaryType === "MemeCardSubmission" &&
    hasSchema(typedData, MEMES_SUBMISSION_DOMAIN, MEMES_SUBMISSION_TYPES)
  ) {
    return describeMemesSubmission(typedData, address, pageOrigin);
  }
  if (primaryType === PROFILE_CMS_PUBLISH_PRIMARY_TYPE) {
    // The domain names the request's chain; a Safe adds its contract, which
    // a browser-wallet profile never has.
    const profileDomain = {
      name: PROFILE_CMS_PUBLISH_DOMAIN_NAME,
      version: PROFILE_CMS_PUBLISH_DOMAIN_VERSION,
      chainId: request.chainId,
    };
    if (
      hasSchema(typedData, profileDomain, PROFILE_CMS_PUBLISH_EIP712_TYPES) &&
      domain["verifyingContract"] === undefined
    ) {
      return describeProfileSitePublish(typedData);
    }
  }
  return refuse("unknown-typed-data");
}

/**
 * Describe a validated request for the browser page, or say why it must be
 * refused. `pageOrigin` is the browser page's own origin, which is also the
 * app's origin.
 */
export function describeWalletRequest(
  request: WalletRequest,
  pageOrigin: string
): DescribedWalletRequest {
  if (request.method === "personal_sign") {
    const text = readWalletMessageText(request.message);
    if (text === null) return refuse("unreadable-message");
    if (isSignInMessage(text)) return refuse("sign-in-message");
    return { ok: true, value: { kind: "message", text } };
  }
  return describeTypedData(request.typedData, request, pageOrigin);
}
