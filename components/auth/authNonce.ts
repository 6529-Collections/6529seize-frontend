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
const SIWE_SIGN_IN_STATEMENT =
  "Sign in to 6529. This request does not create a blockchain transaction, cost gas, or approve tokens.";
const SIWE_NONCE_PATTERN = /^[A-Za-z0-9]{8,128}$/;
const STRUCTURED_LOGIN_PURPOSE = "Sign this message to authenticate with 6529.";
const UUID_NONCE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAINNET_CHAIN_ID_LINE = "Chain ID: 1";
// The server issues challenges valid for five minutes.
const MAX_CHALLENGE_LIFETIME_MS = 10 * 60 * 1000;
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

const isSameAddress = (value: string, signerAddress: string): boolean =>
  isAddress(value, { strict: false }) &&
  value.toLowerCase() === signerAddress.toLowerCase();

/** An ISO timestamp line pair the server rendered with toISOString(). */
const isChallengeLifetime = (
  issuedAtLine: string | undefined,
  expiresAtLine: string | undefined
): boolean => {
  const issuedAt = readIsoTimestamp(issuedAtLine, "Issued At: ");
  const expiresAt = readIsoTimestamp(expiresAtLine, "Expiration Time: ");
  return (
    issuedAt !== null &&
    expiresAt !== null &&
    expiresAt > issuedAt &&
    expiresAt - issuedAt <= MAX_CHALLENGE_LIFETIME_MS
  );
};

const readIsoTimestamp = (
  line: string | undefined,
  prefix: string
): number | null => {
  if (!line?.startsWith(prefix)) {
    return null;
  }
  const value = line.slice(prefix.length);
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value
    ? ms
    : null;
};

const readPrefixed = (
  line: string | undefined,
  prefix: string
): string | null =>
  line?.startsWith(prefix) ? line.slice(prefix.length) : null;

/**
 * The website's Sign-In with Ethereum challenge: issued for this page's
 * origin, which must be a 6529 app host, for the signer on mainnet, with the
 * plain sign-in statement, or with grant resources when one was requested.
 */
const isExpectedSiweChallenge = (
  lines: readonly string[],
  signerAddress: string,
  kind: SignInChallengeKind,
  page: PageLocation
): boolean => {
  const [
    header,
    address,
    beforeStatement,
    statement,
    afterStatement,
    uri,
    version,
    chainId,
    nonce,
    issuedAt,
    expiresAt,
    ...rest
  ] = lines;
  const nonceValue = readPrefixed(nonce, "Nonce: ");
  return (
    isAllowedGrantDomain(page.host) &&
    header === `${page.origin}${SIWE_HEADER_SUFFIX}` &&
    address !== undefined &&
    isSameAddress(address, signerAddress) &&
    beforeStatement === "" &&
    afterStatement === "" &&
    uri === `URI: ${page.origin}` &&
    version === "Version: 1" &&
    chainId === MAINNET_CHAIN_ID_LINE &&
    nonceValue !== null &&
    SIWE_NONCE_PATTERN.test(nonceValue) &&
    isChallengeLifetime(issuedAt, expiresAt) &&
    (kind === "ordinary"
      ? statement === SIWE_SIGN_IN_STATEMENT && rest.length === 0
      : rest[0] === "Resources:")
  );
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

/**
 * The apps' structured "6529 Authentication" login challenge, line by line:
 * this API as audience, the app's own domain, the signer on mainnet, a login
 * action with the fixed purpose, and no other line.
 */
const isExpectedStructuredChallenge = (
  lines: readonly string[],
  signerAddress: string,
  clientType: "native" | "desktop",
  page: PageLocation | null
): boolean => {
  const site = getStructuredChallengeSite(clientType, page);
  if (!site) {
    return false;
  }
  const expectedHead = [
    "6529 Authentication",
    "Version: 2",
    `Audience: ${getWalletSignatureAudience()}`,
    `Domain: ${site.domain}`,
    ...(site.clientOrigin ? [`Client Origin: ${site.clientOrigin}`] : []),
    `Session Type: ${clientType}`,
  ];
  const head = lines.slice(0, expectedHead.length);
  const [
    wallet,
    chainId,
    issuedAt,
    expiresAt,
    nonce,
    action,
    purpose,
    ...rest
  ] = lines.slice(expectedHead.length);
  const walletValue = readPrefixed(wallet, "Wallet: ");
  const nonceValue = readPrefixed(nonce, "Nonce: ");
  return (
    head.every((line, index) => line === expectedHead[index]) &&
    head.length === expectedHead.length &&
    walletValue !== null &&
    isSameAddress(walletValue, signerAddress) &&
    chainId === MAINNET_CHAIN_ID_LINE &&
    isChallengeLifetime(issuedAt, expiresAt) &&
    nonceValue !== null &&
    UUID_NONCE_PATTERN.test(nonceValue) &&
    action === "Action: login" &&
    purpose === `Purpose: ${STRUCTURED_LOGIN_PURPOSE}` &&
    rest.length === 0
  );
};

/**
 * Whether a sign-in challenge is one this client expects before any wallet,
 * including the in-app wallet that shows nothing, is asked to sign it: the
 * format for this client type, this deployment's host, the signer's address,
 * mainnet, and nothing else embedded.
 */
export function isExpectedSignInChallenge(
  message: string,
  signerAddress: string,
  kind: SignInChallengeKind
): boolean {
  const lines = message.split("\n");
  const page = readPageLocation();
  const clientType = getSessionClientType();
  if (clientType === "web") {
    return (
      page !== null && isExpectedSiweChallenge(lines, signerAddress, kind, page)
    );
  }
  // The apps' challenges never carry device grants.
  return (
    kind === "ordinary" &&
    isExpectedStructuredChallenge(lines, signerAddress, clientType, page)
  );
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
