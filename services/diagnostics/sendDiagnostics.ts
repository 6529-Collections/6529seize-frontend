import type { FlightSnapshot } from "./flightRecorder";

/**
 * Sends a diagnostics bundle the person chose to send (R14 §4.3) to the
 * backend's `POST /e/diag`, which stores it encrypted for 14 days and
 * returns a short code for support.
 */

export const DIAGNOSTICS_ENDPOINT = "/e/diag";
/** The backend's limit on the decoded `data` field. */
const MAX_ENCODED_BYTES = 256 * 1024;

export type DiagnosticsBundle = FlightSnapshot & {
  /** `data:image/jpeg;base64,...`, only when the person attached one. */
  readonly screenshot?: string;
};

export type SendResult =
  | { readonly ok: true; readonly code: string; readonly expiresAt: string }
  | {
      readonly ok: false;
      readonly reason:
        | "too_large"
        | "rate_limited"
        | "unavailable"
        | "offline"
        | "failed";
    };

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk)
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === "undefined") return null;
  try {
    const stream = new Blob([bytes as BlobPart])
      .stream()
      .pipeThrough(new CompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

/** The request body for `/e/diag`, gzip-compressed when the browser can. */
export async function encodeBundle(bundle: DiagnosticsBundle): Promise<{
  readonly body: string;
  readonly decodedBytes: number;
}> {
  const raw = new TextEncoder().encode(JSON.stringify(bundle));
  const compressed = await gzip(raw);
  const bytes = compressed ?? raw;
  return {
    body: JSON.stringify({
      v: 1,
      encoding: compressed ? "gzip" : "identity",
      data: toBase64(bytes),
    }),
    decodedBytes: bytes.length,
  };
}

export async function sendDiagnostics(
  bundle: DiagnosticsBundle
): Promise<SendResult> {
  const { body, decodedBytes } = await encodeBundle(bundle);
  if (decodedBytes > MAX_ENCODED_BYTES)
    return { ok: false, reason: "too_large" };
  let response: Response;
  try {
    response = await fetch(DIAGNOSTICS_ENDPOINT, {
      method: "POST",
      body,
      credentials: "omit",
      headers: { "content-type": "application/json" },
    });
  } catch {
    return { ok: false, reason: "offline" };
  }
  if (response.status === 413) return { ok: false, reason: "too_large" };
  if (response.status === 429) return { ok: false, reason: "rate_limited" };
  if (response.status === 503) return { ok: false, reason: "unavailable" };
  if (!response.ok) return { ok: false, reason: "failed" };
  try {
    const result = (await response.json()) as {
      code?: unknown;
      expires_at?: unknown;
    };
    return typeof result.code === "string" &&
      /^D-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(result.code)
      ? {
          ok: true,
          code: result.code,
          expiresAt:
            typeof result.expires_at === "string" ? result.expires_at : "",
        }
      : { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
