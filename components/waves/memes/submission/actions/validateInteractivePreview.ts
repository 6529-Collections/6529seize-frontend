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

  return fetch(url, {
    method,
    cache: "no-store",
    redirect: "follow",
    headers,
  });
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

  const targetUrl = buildGatewayUrl(provider, path);

  let response: Response;

  try {
    response = await performGatewayRequest(targetUrl, "HEAD");
  } catch (error) {
    return {
      ok: false,
      reason: "Unable to reach the content gateway.",
    };
  }

  if (
    response.status === 405 ||
    response.status === 403 ||
    response.status === 400 ||
    response.status === 501
  ) {
    try {
      response = await performGatewayRequest(targetUrl, "GET");
    } catch (error) {
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
