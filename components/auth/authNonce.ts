import { isAddress } from "viem";
import type { ApiSessionNonceResponse } from "@/generated/models/ApiSessionNonceResponse";
import { isAllowedGrantDomain } from "@/lib/device-signing/grant-message";
import {
  getSessionClientType,
  getSessionNonce,
} from "@/services/auth/session-v2.utils";
import { getWalletSignatureAudience } from "@/services/wallet-signatures/structured-wallet-signatures";
import {
  AuthenticationNonceError,
  InvalidSignerAddressError,
  NonceResponseValidationError,
} from "./authErrors";

const SIWE_HEADER_SUFFIX = " wants you to sign in with your Ethereum account:";
const RESOURCES_LINE = "Resources:";
const MAINNET_CHAIN_ID = "1";
// The server issues challenges valid for five minutes; allow for change.
const MAX_CHALLENGE_LIFETIME_MS = 60 * 60 * 1000;
// The longest statement today (a combined grant) is about 500 characters.
const MAX_TEXT_LENGTH = 2000;
const MAX_TOKEN_LENGTH = 200;
// Printable text on one line: no control characters (line breaks included).
const CONTROL_CHARACTER = /\p{Cc}/u;
const WHITESPACE = /\s/u;
// RFC 3339: a date and time, an optional fraction, then Z or an offset.
const RFC3339_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const RFC3339_FRACTION = /^\.\d{1,9}/;
const RFC3339_OFFSET = /^[+-]\d{2}:\d{2}$/;

/** Whether the text after the seconds is an optional fraction and a zone. */
const isFractionAndZone = (value: string): boolean => {
  const fraction = RFC3339_FRACTION.exec(value)?.[0] ?? "";
  const zone = value.slice(fraction.length);
  return zone === "Z" || RFC3339_OFFSET.test(zone);
};
const LOOPBACK_HOSTNAMES: ReadonlySet<string> = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
]);

/**
 * "ordinary": a plain sign-in that grants nothing. "grant": a sign-in that
 * also carries the device-grant resources this client asked for; their
 * statement and resources are checked by the device-grant parser.
 */
type SignInChallengeKind = "ordinary" | "grant";

interface PageLocation {
  readonly origin: string;
  readonly host: string;
  readonly hostname: string;
  readonly protocol: string;
  readonly port: string;
}

const readPageLocation = (): PageLocation | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const { location } = window;
  return location.origin && location.origin !== "null" ? location : null;
};

const isSameAddress = (value: string | undefined, signerAddress: string) =>
  value !== undefined &&
  isAddress(value, { strict: false }) &&
  value.toLowerCase() === signerAddress.toLowerCase();

/** Printable text on one line, at most MAX_TEXT_LENGTH characters. */
const isSingleLineText = (value: string | undefined): value is string =>
  value !== undefined &&
  value.trim().length > 0 &&
  value.length <= MAX_TEXT_LENGTH &&
  !CONTROL_CHARACTER.test(value);

/** A non-empty value without whitespace, such as a nonce or request id. */
const isToken = (value: string | undefined): value is string =>
  value !== undefined &&
  value.length > 0 &&
  value.length <= MAX_TOKEN_LENGTH &&
  !WHITESPACE.test(value) &&
  !CONTROL_CHARACTER.test(value);

const readTimestamp = (value: string | undefined): number | null => {
  if (
    value === undefined ||
    !RFC3339_DATE_TIME.test(value) ||
    !isFractionAndZone(value.slice(19))
  ) {
    return null;
  }
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
};

/** Issued before it expires, for at most MAX_CHALLENGE_LIFETIME_MS. */
const hasBoundedLifetime = (fields: ReadonlyMap<string, string>): boolean => {
  const issuedAt = readTimestamp(fields.get("Issued At"));
  const expiresAt = readTimestamp(fields.get("Expiration Time"));
  return (
    issuedAt !== null &&
    expiresAt !== null &&
    expiresAt > issuedAt &&
    expiresAt - issuedAt <= MAX_CHALLENGE_LIFETIME_MS
  );
};

/**
 * `Key: value` lines as a map, or null when a line is not one, names a key
 * outside `allowed`, repeats a key, or a `required` key is missing.
 */
const readFields = (
  lines: readonly string[],
  allowed: ReadonlySet<string>,
  required: readonly string[]
): Map<string, string> | null => {
  const fields = new Map<string, string>();
  for (const line of lines) {
    const separator = line.indexOf(": ");
    const key = separator > 0 ? line.slice(0, separator) : "";
    if (!allowed.has(key) || fields.has(key)) {
      return null;
    }
    fields.set(key, line.slice(separator + 2));
  }
  return required.every((key) => fields.has(key)) ? fields : null;
};

const SIWE_REQUIRED_FIELDS = [
  "URI",
  "Version",
  "Chain ID",
  "Nonce",
  "Issued At",
  "Expiration Time",
] as const;
const SIWE_FIELDS: ReadonlySet<string> = new Set([
  ...SIWE_REQUIRED_FIELDS,
  "Not Before",
  "Request ID",
]);

/**
 * Why a challenge was refused, for logs: one short code and nothing from the
 * challenge itself.
 */
export type SignInChallengeProblem =
  | "shape"
  | "origin"
  | "address"
  | "chain"
  | "nonce"
  | "timestamps"
  | "resources";

/** The first failed check, in order, or null when every check passed. */
const firstProblem = (
  checks: ReadonlyArray<readonly [SignInChallengeProblem, () => boolean]>
): SignInChallengeProblem | null =>
  checks.find(([, passes]) => !passes())?.[0] ?? null;

/** Optional fields, when present, are well formed. */
const hasWellFormedOptionalFields = (
  fields: ReadonlyMap<string, string>
): boolean => {
  const notBefore = fields.get("Not Before");
  const requestId = fields.get("Request ID");
  return (
    (notBefore === undefined || readTimestamp(notBefore) !== null) &&
    (requestId === undefined || isToken(requestId))
  );
};

/**
 * The website's Sign-In with Ethereum challenge: issued for this page's
 * origin, which must be a 6529 app host, for the signer on mainnet, with a
 * one-line statement, a nonce and a bounded lifetime. An ordinary sign-in
 * carries no resources; a grant sign-in's resources go to the grant parser.
 */
const getSiweChallengeProblem = (
  lines: readonly string[],
  signerAddress: string,
  kind: SignInChallengeKind,
  page: PageLocation
): SignInChallengeProblem | null => {
  const [header, address, beforeStatement, statement, afterStatement] = lines;
  const resourcesIndex = lines.indexOf(RESOURCES_LINE);
  const fields = readFields(
    lines.slice(5, resourcesIndex < 0 ? undefined : resourcesIndex),
    SIWE_FIELDS,
    SIWE_REQUIRED_FIELDS
  );
  if (fields === null) {
    return "shape";
  }
  return firstProblem([
    [
      "shape",
      () =>
        header?.endsWith(SIWE_HEADER_SUFFIX) === true &&
        beforeStatement === "" &&
        isSingleLineText(statement) &&
        afterStatement === "" &&
        fields.get("Version") === "1" &&
        hasWellFormedOptionalFields(fields),
    ],
    [
      "origin",
      () =>
        isAllowedGrantDomain(page.host) &&
        header === `${page.origin}${SIWE_HEADER_SUFFIX}` &&
        fields.get("URI") === page.origin,
    ],
    ["address", () => isSameAddress(address, signerAddress)],
    ["chain", () => fields.get("Chain ID") === MAINNET_CHAIN_ID],
    ["nonce", () => isToken(fields.get("Nonce"))],
    ["timestamps", () => hasBoundedLifetime(fields)],
    [
      "resources",
      () => (kind === "ordinary" ? resourcesIndex < 0 : resourcesIndex > 5),
    ],
  ]);
};

/**
 * The domain and client origin an app challenge must name: "native" for the
 * mobile app; this page's loopback origin for the desktop app.
 */
const getStructuredChallengeSite = (
  clientType: "native" | "desktop",
  page: PageLocation | null
): { readonly domain: string; readonly clientOrigin: string | null } | null => {
  if (clientType === "native") {
    return { domain: "native", clientOrigin: null };
  }
  if (
    page?.protocol !== "http:" ||
    !page.port ||
    !LOOPBACK_HOSTNAMES.has(page.hostname)
  ) {
    return null;
  }
  return { domain: page.host, clientOrigin: page.origin };
};

const STRUCTURED_REQUIRED_FIELDS = [
  "Version",
  "Audience",
  "Domain",
  "Session Type",
  "Wallet",
  "Chain ID",
  "Issued At",
  "Expiration Time",
  "Nonce",
  "Action",
  "Purpose",
] as const;
const STRUCTURED_FIELDS: ReadonlySet<string> = new Set([
  ...STRUCTURED_REQUIRED_FIELDS,
  "Client Origin",
]);

/**
 * The apps' structured "6529 Authentication" login challenge: this API as
 * audience, the app's own domain, client origin and session type, the signer
 * on mainnet, a login action, a nonce, a bounded lifetime and a one-line
 * purpose, and no other field.
 */
const getStructuredChallengeProblem = (
  lines: readonly string[],
  signerAddress: string,
  clientType: "native" | "desktop",
  page: PageLocation | null
): SignInChallengeProblem | null => {
  const site = getStructuredChallengeSite(clientType, page);
  const fields = readFields(
    lines.slice(1),
    STRUCTURED_FIELDS,
    STRUCTURED_REQUIRED_FIELDS
  );
  if (fields === null || lines[0] !== "6529 Authentication") {
    return "shape";
  }
  return firstProblem([
    [
      "shape",
      () =>
        fields.get("Version") === "2" &&
        fields.get("Session Type") === clientType &&
        fields.get("Action") === "login" &&
        isSingleLineText(fields.get("Purpose")),
    ],
    [
      "origin",
      () =>
        site !== null &&
        fields.get("Audience") === getWalletSignatureAudience() &&
        fields.get("Domain") === site.domain &&
        fields.get("Client Origin") === (site.clientOrigin ?? undefined),
    ],
    ["address", () => isSameAddress(fields.get("Wallet"), signerAddress)],
    ["chain", () => fields.get("Chain ID") === MAINNET_CHAIN_ID],
    ["nonce", () => isToken(fields.get("Nonce"))],
    ["timestamps", () => hasBoundedLifetime(fields)],
  ]);
};

/**
 * Checks a sign-in challenge before any wallet, including the in-app wallet,
 * is asked to sign it: the format for this client type, this deployment's
 * host, the signer's address, mainnet, and nothing else embedded. Returns the
 * first failed check, or null when the challenge may be signed. The contract
 * is documented in
 * ops/docs/developer/wallet-auth-final-structure-and-merge-rationale.md
 * ("Sign-in challenge contract").
 */
export function getSignInChallengeProblem(
  message: string,
  signerAddress: string,
  kind: SignInChallengeKind
): SignInChallengeProblem | null {
  const lines = message.split("\n");
  if (lines.some((line) => CONTROL_CHARACTER.test(line))) {
    return "shape";
  }
  const page = readPageLocation();
  const clientType = getSessionClientType();
  if (clientType === "web") {
    return page === null
      ? "origin"
      : getSiweChallengeProblem(lines, signerAddress, kind, page);
  }
  // The apps' challenges never carry device grants.
  return kind === "grant"
    ? "resources"
    : getStructuredChallengeProblem(lines, signerAddress, clientType, page);
}

// The declared response type is non-null, but an empty body still arrives.
const assertNonceResponse = (
  response: ApiSessionNonceResponse | null | undefined
): ApiSessionNonceResponse => {
  if (!response) {
    throw new NonceResponseValidationError(
      "Nonce API returned null or undefined response"
    );
  }

  if (
    !response.signable_message ||
    typeof response.signable_message !== "string" ||
    response.signable_message.length === 0
  ) {
    throw new NonceResponseValidationError(
      "Invalid signable_message in API response",
      response
    );
  }

  if (
    !response.server_signature ||
    typeof response.server_signature !== "string" ||
    response.server_signature.trim().length === 0
  ) {
    throw new NonceResponseValidationError(
      "Invalid server_signature in API response",
      response
    );
  }

  return response;
};

/** Fetches and validates the server's sign-in challenge for a wallet. */
export const getAuthNonce = async ({
  signerAddress,
  deviceGrant,
}: Parameters<typeof getSessionNonce>[0]): Promise<ApiSessionNonceResponse> => {
  if (!signerAddress || typeof signerAddress !== "string") {
    throw new InvalidSignerAddressError(signerAddress);
  }

  if (!isAddress(signerAddress)) {
    throw new InvalidSignerAddressError(signerAddress);
  }

  try {
    return assertNonceResponse(
      await getSessionNonce({ signerAddress, deviceGrant })
    );
  } catch (error) {
    if (
      error instanceof NonceResponseValidationError ||
      error instanceof InvalidSignerAddressError
    ) {
      throw error;
    }

    throw new AuthenticationNonceError(
      "Failed to obtain authentication nonce from server",
      error
    );
  }
};
