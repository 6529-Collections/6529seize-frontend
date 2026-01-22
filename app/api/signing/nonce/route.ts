import { publicEnv } from "@/config/env";
import type { ApiNonceResponse } from "@/generated/models/ApiNonceResponse";
import { PRIVILEGED_ACTION_TTL_SECONDS } from "@/utils/signing/privileged-typed-data";
import { isAddress } from "viem";

export const runtime = "nodejs";

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const signerAddress = url.searchParams.get("signer_address") ?? "";
  const ttlSeconds = parsePositiveInt(
    url.searchParams.get("ttl_seconds"),
    PRIVILEGED_ACTION_TTL_SECONDS
  );

  if (!isAddress(signerAddress)) {
    return Response.json(
      { error: "Invalid signer_address" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const nonceUrl = new URL("/api/auth/nonce", publicEnv.API_ENDPOINT);
  nonceUrl.searchParams.set("signer_address", signerAddress);
  nonceUrl.searchParams.set("short_nonce", "true");

  const nonceRes = await fetch(nonceUrl.toString(), { method: "GET" });
  if (!nonceRes.ok) {
    const body = await nonceRes.text().catch(() => "");
    return Response.json(
      { error: body || `Nonce fetch failed (${nonceRes.status})` },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  const nonceJson = (await nonceRes.json()) as Partial<ApiNonceResponse>;
  if (!nonceJson?.nonce || !nonceJson?.server_signature) {
    return Response.json(
      { error: "Invalid nonce response" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + Math.min(ttlSeconds, PRIVILEGED_ACTION_TTL_SECONDS);

  return Response.json(
    {
      nonce: nonceJson.nonce,
      serverSignature: nonceJson.server_signature,
      expiresAt,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

