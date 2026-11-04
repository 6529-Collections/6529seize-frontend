import type { InteractiveMediaProvider } from "@/components/waves/memes/submission/constants/media";
import type { InteractiveMediaValidationResult } from "@/components/waves/memes/submission/constants/security";

export const INTERACTIVE_PREVIEW_ENDPOINT = "/api/interactive-preview";

interface InteractivePreviewRequest {
  readonly provider: InteractiveMediaProvider;
  readonly path: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * Asks the same-origin route whether a hosted interactive artwork answers as
 * an HTML document. Throws when the check itself could not run (network,
 * rate limit, rejected request), so callers can tell "invalid" from "unknown".
 */
export async function requestInteractivePreviewValidation({
  provider,
  path,
}: InteractivePreviewRequest): Promise<InteractiveMediaValidationResult> {
  const response = await fetch(INTERACTIVE_PREVIEW_ENDPOINT, {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ provider, path }),
  });
  if (!response.ok) {
    throw new Error(
      `Interactive preview check failed with status ${response.status}`
    );
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || typeof payload["ok"] !== "boolean") {
    throw new Error("Interactive preview check returned an unexpected body");
  }
  const contentType = payload["contentType"];
  return {
    ok: payload["ok"],
    reason: optionalString(payload["reason"]),
    finalUrl: optionalString(payload["finalUrl"]),
    contentType: typeof contentType === "string" ? contentType : null,
  };
}
