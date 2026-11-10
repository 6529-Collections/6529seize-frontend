import { getAddress } from "viem";
import { getWalletSignatureAudience } from "@/services/wallet-signatures/structured-wallet-signatures";

/** The plain sign-in statement the API issues for the website. */
export const SIWE_SIGN_IN_STATEMENT =
  "Sign in to 6529. This request does not create a blockchain transaction, cost gas, or approve tokens.";

const ISSUED_AT = "2026-11-10T14:32:52.000Z";
const EXPIRES_AT = "2026-11-10T14:37:52.000Z";

/**
 * The website's Sign-In with Ethereum challenge as the API renders it
 * (SIWE with the page origin as scheme and domain, checksummed address).
 */
export const siweSignInChallenge = ({
  address,
  origin = globalThis.location.origin,
  statement = SIWE_SIGN_IN_STATEMENT,
  chainId = 1,
  resources = [],
}: {
  readonly address: string;
  readonly origin?: string;
  readonly statement?: string;
  readonly chainId?: number;
  readonly resources?: readonly string[];
}): string =>
  [
    `${origin} wants you to sign in with your Ethereum account:`,
    getAddress(address),
    "",
    statement,
    "",
    `URI: ${origin}`,
    "Version: 1",
    `Chain ID: ${chainId}`,
    "Nonce: 251566deb966204ff0646078ebf6a8f9",
    `Issued At: ${ISSUED_AT}`,
    `Expiration Time: ${EXPIRES_AT}`,
    ...(resources.length > 0
      ? ["Resources:", ...resources.map((resource) => `- ${resource}`)]
      : []),
  ].join("\n");

/**
 * The apps' structured login challenge as the API renders it: domain
 * "native" for 6529 Mobile, the loopback page origin for 6529 Desktop.
 */
export const appSignInChallenge = ({
  address,
  clientType = "native",
  origin = globalThis.location.origin,
  audience = getWalletSignatureAudience(),
  chainId = 1,
  extraLines = [],
}: {
  readonly address: string;
  readonly clientType?: "native" | "desktop";
  readonly origin?: string;
  readonly audience?: string;
  readonly chainId?: number;
  readonly extraLines?: readonly string[];
}): string =>
  [
    "6529 Authentication",
    "Version: 2",
    `Audience: ${audience}`,
    ...(clientType === "native"
      ? ["Domain: native"]
      : [`Domain: ${new URL(origin).host}`, `Client Origin: ${origin}`]),
    `Session Type: ${clientType}`,
    `Wallet: ${address.toLowerCase()}`,
    `Chain ID: ${chainId}`,
    `Issued At: ${ISSUED_AT}`,
    `Expiration Time: ${EXPIRES_AT}`,
    "Nonce: ab6edf48-fd9f-4809-a2ce-185f0235288c",
    "Action: login",
    "Purpose: Sign this message to authenticate with 6529.",
    ...extraLines,
  ].join("\n");
