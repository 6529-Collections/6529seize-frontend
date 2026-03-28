import { PRIVILEGED_ACTION_TTL_SECONDS } from "@/utils/signing/privileged-typed-data";
import { isAddress } from "viem";

export type PrivilegedActionChallenge = {
  readonly nonce: string;
  readonly serverSignature: string;
  readonly expiresAt: number; // unix seconds
};

export async function getPrivilegedActionChallenge({
  signerAddress,
  ttlSeconds = PRIVILEGED_ACTION_TTL_SECONDS,
}: {
  readonly signerAddress: string;
  readonly ttlSeconds?: number;
}): Promise<PrivilegedActionChallenge> {
  if (!isAddress(signerAddress)) {
    throw new Error("Invalid signer address");
  }

  const url = new URL("/api/signing/nonce", window.location.origin);
  url.searchParams.set("signer_address", signerAddress);
  url.searchParams.set("ttl_seconds", String(ttlSeconds));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `Failed to fetch signing nonce (${res.status})`);
  }

  const json = (await res.json()) as Partial<PrivilegedActionChallenge>;

  if (!json.nonce || typeof json.nonce !== "string") {
    throw new Error("Invalid nonce response");
  }
  if (!json.serverSignature || typeof json.serverSignature !== "string") {
    throw new Error("Invalid server signature response");
  }
  if (
    json.expiresAt === undefined ||
    typeof json.expiresAt !== "number" ||
    !Number.isFinite(json.expiresAt)
  ) {
    throw new Error("Invalid expiry response");
  }

  return {
    nonce: json.nonce,
    serverSignature: json.serverSignature,
    expiresAt: json.expiresAt,
  };
}

