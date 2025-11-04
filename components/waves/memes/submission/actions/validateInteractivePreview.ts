'use server';

import {
  INTERACTIVE_MEDIA_ALLOWED_CONTENT_TYPES,
  INTERACTIVE_MEDIA_GATEWAY_BASE_URL,
  InteractiveMediaValidationResult,
  isInteractiveMediaAllowedHost,
} from "../constants/security";
import { InteractiveMediaProvider } from "../constants/media";

type GatewayRequestMethod = "HEAD" | "GET";

interface ValidateInteractivePreviewArgs {
  readonly provider: InteractiveMediaProvider;
  readonly path: string;
}

const MAX_BYTES_TO_PEEK = 1024;

// Guard against SSRF by ensuring the gateway path is a plain relative fragment.
const isSafeRelativePath = (path: string): boolean => {
  if (typeof path !== "string") {
    return false;
  }

  const trimmed = path.trim();

  if (!trimmed || trimmed !== path) {
    return false;
  }

  const lower = trimmed.toLowerCase();

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("\\") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("\\\\") ||
    lower.startsWith("http:") ||
    lower.startsWith("https:") ||
    lower.includes("://") ||
    trimmed.includes("..") ||
    trimmed.includes("\n") ||
    trimmed.includes("\r")
  ) {
    return false;
  }

  return true;
};

const isAllowedContentType = (contentType: string | null): boolean => {
  if (!contentType) {
    return false;
  }

  const normalized = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
  return INTERACTIVE_MEDIA_ALLOWED_CONTENT_TYPES.some((allowed) =>
    normalized.startsWith(allowed)
  );
};

const ensureAllowedHost = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return isInteractiveMediaAllowedHost(parsed.hostname);
  } catch {
    return false;
  }
};

const performGatewayRequest = async (
  url: string,
  method: GatewayRequestMethod
): Promise<Response> => {
  const headers: Record<string, string> = {};
  if (method === "GET") {
    headers.Range = `bytes=0-${MAX_BYTES_TO_PEEK}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    return await fetch(url, {
      method,
      cache: "no-store",
      redirect: "follow",
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const buildGatewayUrl = (
  provider: InteractiveMediaProvider,
  path: string
): string => {
  const base = INTERACTIVE_MEDIA_GATEWAY_BASE_URL[provider];
  // URL constructor handles duplicate slashes gracefully.
  return new URL(path, base).toString();
};

export async function validateInteractivePreview({
  provider,
  path,
}: ValidateInteractivePreviewArgs): Promise<InteractiveMediaValidationResult> {
  if (!path) {
    return { ok: false, reason: "Hash or path is required." };
  }

  if (!isSafeRelativePath(path)) {
    return {
      ok: false,
      reason: "Invalid path: only relative paths under the gateway origin are allowed.",
    };
  }

  const targetUrl = buildGatewayUrl(provider, path);

  // Block requests whose resolved host is not part of the trusted gateways.
  if (!ensureAllowedHost(targetUrl)) {
    return {
      ok: false,
      reason: "Invalid path: resolved target is not permitted under allowed gateway hosts.",
    };
  }

  let response: Response;
  try {
    response = await performGatewayRequest(targetUrl, "HEAD");
  } catch (error) {
    console.error(
      "[validateInteractivePreview] HEAD request failed",
      {
        provider,
        path,
        targetUrl,
        error,
      }
    );
    return {
      ok: false,
      reason: "Unable to reach the content gateway.",
    };
  }

  if (
    response.status === 405 ||
    response.status === 403 ||
    response.status === 501
  ) {
    try {
      response = await performGatewayRequest(targetUrl, "GET");
    } catch (error) {
      console.error(
        "[validateInteractivePreview] Fallback GET request failed",
        {
          provider,
          path,
          targetUrl,
          error,
        }
      );
      return {
        ok: false,
        reason: "Unable to reach the content gateway.",
      };
    }
  }

  if (!response.ok && response.status !== 206) {
    return {
      ok: false,
      reason: `Gateway returned ${response.status}.`,
    };
  }

  // Ensure the final resolved URL is still within the trusted hosts.
  if (!ensureAllowedHost(response.url)) {
    console.warn(
      "[validateInteractivePreview] Blocking redirect to unapproved host",
      {
        resolvedUrl: response.url,
      }
    );
    return {
      ok: false,
      reason: "Gateway redirected to an unapproved host.",
    };
  }

  const contentType = response.headers.get("content-type");
  if (!isAllowedContentType(contentType)) {
    return {
      ok: false,
      reason: "Media must respond with an HTML document.",
    };
  }

  // Best-effort cancellation of the body stream for GET validations.
  try {
    await response.body?.cancel();
  } catch {
    // ignore cancellation errors
  }

  return {
    ok: true,
    finalUrl: response.url,
    contentType,
  };
}
