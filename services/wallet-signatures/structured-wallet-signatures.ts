import { publicEnv } from "@/config/env";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { DropHasher } from "@/utils/drop-hasher";
import { sha256 } from "js-sha256";
import { v4 as uuidv4 } from "uuid";

const STRUCTURED_WALLET_SIGNATURE_VERSION = 2;
const STRUCTURED_WALLET_SIGNATURE_TTL_SECONDS = 5 * 60;

type StructuredWalletSignatureAction =
  | "login"
  | "create_drop"
  | "add_rememe"
  | "nextgen_admin";

type StructuredWalletSignatureKind = "authentication" | "action";

type StructuredWalletSignatureSessionType =
  | "first_party_web"
  | "external_client"
  | "native";

interface StructuredWalletSignatureResult {
  readonly message: string;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expirationTime: string;
  readonly payloadHash?: string | undefined;
}

interface BuildStructuredWalletSignatureMessageParams {
  readonly kind: StructuredWalletSignatureKind;
  readonly address: string;
  readonly action: StructuredWalletSignatureAction;
  readonly purpose: string;
  readonly payloadHash?: string | null | undefined;
  readonly audience?: string | undefined;
  readonly domain?: string | undefined;
  readonly clientOrigin?: string | null | undefined;
  readonly sessionType?:
    | StructuredWalletSignatureSessionType
    | null
    | undefined;
  readonly chainId?: number | undefined;
  readonly nonce?: string | undefined;
  readonly issuedAt?: Date | undefined;
  readonly expirationTime?: Date | undefined;
}

export function isStructuredSignaturesEnabled(): boolean {
  return publicEnv.AUTH_STRUCTURED_SIGNATURES_ENABLED === "true";
}

export function getWalletSignatureAudience(): string {
  return new URL(publicEnv.API_ENDPOINT).host.toLowerCase();
}

export function getWalletSignatureDomain(): string {
  if (
    typeof globalThis.window !== "undefined" &&
    globalThis.window.location.host
  ) {
    return globalThis.window.location.host.toLowerCase();
  }
  return new URL(publicEnv.BASE_ENDPOINT).host.toLowerCase();
}

export function getWalletSignatureClientOrigin(): string | null {
  if (
    typeof globalThis.window !== "undefined" &&
    globalThis.window.location.origin
  ) {
    const origin = globalThis.window.location.origin.toLowerCase();
    return origin === "null" ? null : origin;
  }
  return new URL(publicEnv.BASE_ENDPOINT).origin.toLowerCase();
}

function compareJsonKeys(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

export function buildStructuredWalletSignatureMessage({
  kind,
  address,
  action,
  purpose,
  payloadHash,
  audience = getWalletSignatureAudience(),
  domain = getWalletSignatureDomain(),
  clientOrigin = getWalletSignatureClientOrigin(),
  sessionType,
  chainId = 1,
  nonce = uuidv4(),
  issuedAt = new Date(),
  expirationTime = new Date(
    issuedAt.getTime() + STRUCTURED_WALLET_SIGNATURE_TTL_SECONDS * 1000
  ),
}: BuildStructuredWalletSignatureMessageParams): StructuredWalletSignatureResult {
  const lines: string[] = [
    kind === "authentication" ? "6529 Authentication" : "6529 Action",
    `Version: ${STRUCTURED_WALLET_SIGNATURE_VERSION}`,
    `Audience: ${audience}`,
    `Domain: ${domain}`,
  ];

  if (clientOrigin) {
    lines.push(`Client Origin: ${clientOrigin}`);
  }

  if (sessionType) {
    lines.push(`Session Type: ${sessionType}`);
  }

  lines.push(
    `Wallet: ${address}`,
    `Chain ID: ${chainId}`,
    `Issued At: ${issuedAt.toISOString()}`,
    `Expiration Time: ${expirationTime.toISOString()}`,
    `Nonce: ${nonce}`,
    `Action: ${action}`
  );

  if (payloadHash) {
    lines.push(`Payload Hash: ${payloadHash}`);
  }

  lines.push(`Purpose: ${purpose}`);

  return {
    message: lines.join("\n"),
    nonce,
    issuedAt: issuedAt.toISOString(),
    expirationTime: expirationTime.toISOString(),
    ...(payloadHash ? { payloadHash } : {}),
  };
}

export function canonicalJSONStringify(value: unknown): string {
  if (typeof value !== "object" || value === null) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((it) => canonicalJSONStringify(it)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keyValuePairs = Object.keys(record)
    .sort(compareJsonKeys)
    .filter((key) => record[key] !== undefined)
    .map(
      (key) => `${JSON.stringify(key)}:${canonicalJSONStringify(record[key])}`
    );
  return `{${keyValuePairs.join(",")}}`;
}

export function hashStructuredWalletSignaturePayload(payload: unknown): string {
  return sha256(canonicalJSONStringify(payload));
}

export function buildDropSignatureMessage({
  address,
  drop,
  termsOfService,
}: {
  readonly address: string;
  readonly drop: ApiCreateDropRequest;
  readonly termsOfService: string | null;
}): StructuredWalletSignatureResult {
  const payloadHash = new DropHasher().hash({ drop, termsOfService });
  return buildStructuredWalletSignatureMessage({
    kind: "action",
    address,
    action: "create_drop",
    payloadHash,
    purpose: "Sign this message to create a 6529 drop.",
  });
}

export function buildRememeSignatureMessage({
  address,
  rememe,
}: {
  readonly address: string;
  readonly rememe: unknown;
}): StructuredWalletSignatureResult {
  return buildStructuredWalletSignatureMessage({
    kind: "action",
    address,
    action: "add_rememe",
    payloadHash: hashStructuredWalletSignaturePayload(rememe),
    purpose: "Sign this message to add a 6529 ReMeme.",
  });
}

export function buildNextgenAdminSignatureMessage({
  address,
  chainId = 1,
  payload,
}: {
  readonly address: string;
  readonly chainId?: number | undefined;
  readonly payload: unknown;
}): StructuredWalletSignatureResult {
  return buildStructuredWalletSignatureMessage({
    kind: "action",
    address,
    chainId,
    action: "nextgen_admin",
    payloadHash: hashStructuredWalletSignaturePayload(payload),
    purpose: "Sign this message to perform a 6529 NextGen admin action.",
  });
}
