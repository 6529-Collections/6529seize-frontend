import { NextRequest, NextResponse } from "next/server";

const ALLOWED_PROTOCOLS = new Set(["https:", "http:"]);
const YOUTUBE_OEMBED_ENDPOINT = "https://www.youtube.com/oembed";

interface YouTubeOEmbedResponse {
  title?: unknown;
  author_name?: unknown;
  thumbnail_url?: unknown;
  html?: unknown;
}

function isYouTubeHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "youtu.be" ||
    normalized.endsWith(".youtu.be") ||
    normalized === "youtube.com" ||
    normalized.endsWith(".youtube.com") ||
    normalized === "youtube-nocookie.com" ||
    normalized.endsWith(".youtube-nocookie.com")
  );
}

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\0-\x1F\x7F]/g, "").trim();
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/[&"'<>]/g, char => {
    switch (char) {
      case "&":
        return "&amp;";
      case "\"":
        return "&quot;";
      case "'":
        return "&#39;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      default:
        return char;
    }
  });
}

function sanitizeThumbnailUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "https:") {
      return null;
    }

    parsed.username = "";
    parsed.password = "";
    parsed.hash = "";

    return parsed.toString();
  } catch {
    return null;
  }
}

function sanitizeEmbedHtml(html: unknown): string | null {
  if (typeof html !== "string") {
    return null;
  }

  const iframeMatch = html.match(/<iframe\b([^>]*)><\/iframe>/i);

  if (!iframeMatch) {
    return null;
  }

  const attributesString = iframeMatch[1] ?? "";
  const sanitizedAttributes: string[] = [];
  const seenAttributes = new Set<string>();
  let sanitizedSrc: string | null = null;

  const attributeRegex = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gi;
  let attributeMatch: RegExpExecArray | null;

  while ((attributeMatch = attributeRegex.exec(attributesString)) !== null) {
    const attributeName = attributeMatch[1]?.toLowerCase();

    if (!attributeName || seenAttributes.has(attributeName)) {
      continue;
    }

    const rawValue = attributeMatch[2] ?? attributeMatch[3] ?? attributeMatch[4] ?? "";

    switch (attributeName) {
      case "src": {
        const trimmedValue = rawValue.trim();

        if (!trimmedValue) {
          return null;
        }

        try {
          const parsedSrc = new URL(trimmedValue, "https://www.youtube.com");

          if (!ALLOWED_PROTOCOLS.has(parsedSrc.protocol)) {
            return null;
          }

          if (!isYouTubeHostname(parsedSrc.hostname)) {
            return null;
          }

          parsedSrc.username = "";
          parsedSrc.password = "";
          parsedSrc.hash = "";

          sanitizedSrc = parsedSrc.toString();
        } catch {
          return null;
        }

        break;
      }

      case "width":
      case "height":
      case "frameborder": {
        const numericValue = Number.parseInt(rawValue, 10);

        if (Number.isNaN(numericValue) || numericValue < 0) {
          break;
        }

        sanitizedAttributes.push(`${attributeName}="${numericValue}"`);
        seenAttributes.add(attributeName);
        break;
      }

      case "allow": {
        const allowValue = rawValue.trim();

        if (!allowValue) {
          break;
        }

        const sanitizedAllow = allowValue.replace(/[^a-z0-9:;._\-\/\s]/gi, "");

        if (!sanitizedAllow) {
          break;
        }

        sanitizedAttributes.push(`allow="${escapeHtmlAttribute(sanitizedAllow)}"`);
        seenAttributes.add(attributeName);
        break;
      }

      case "allowfullscreen": {
        sanitizedAttributes.push("allowfullscreen");
        seenAttributes.add(attributeName);
        break;
      }

      case "referrerpolicy": {
        const policyValue = rawValue.trim().toLowerCase().replace(/[^a-z\-]/g, "");

        if (!policyValue) {
          break;
        }

        sanitizedAttributes.push(`referrerpolicy="${policyValue}"`);
        seenAttributes.add(attributeName);
        break;
      }

      case "title": {
        const sanitizedTitle = sanitizeText(rawValue);

        if (!sanitizedTitle) {
          break;
        }

        sanitizedAttributes.push(`title="${escapeHtmlAttribute(sanitizedTitle)}"`);
        seenAttributes.add(attributeName);
        break;
      }

      case "loading": {
        const loadingValue = rawValue.trim().toLowerCase();

        if (loadingValue === "lazy" || loadingValue === "eager") {
          sanitizedAttributes.push(`loading="${loadingValue}"`);
          seenAttributes.add(attributeName);
        }

        break;
      }

      default:
        break;
    }
  }

  if (!sanitizedSrc) {
    return null;
  }

  sanitizedAttributes.unshift(`src="${escapeHtmlAttribute(sanitizedSrc)}"`);

  if (!sanitizedAttributes.some(attribute => attribute.startsWith("title="))) {
    sanitizedAttributes.push('title="YouTube video player"');
  }

  return `<iframe ${sanitizedAttributes.join(" ")}></iframe>`;
}

function createNoStoreResponse(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestedUrl = request.nextUrl.searchParams.get("url");

  if (!requestedUrl) {
    return createNoStoreResponse(
      { error: 'Missing required "url" query parameter.' },
      { status: 400 }
    );
  }

  let parsedVideoUrl: URL;

  try {
    parsedVideoUrl = new URL(requestedUrl);
  } catch {
    return createNoStoreResponse(
      { error: 'The provided "url" is not a valid URL.' },
      { status: 400 }
    );
  }

  if (!ALLOWED_PROTOCOLS.has(parsedVideoUrl.protocol)) {
    return createNoStoreResponse(
      { error: "Only HTTP(S) URLs are supported." },
      { status: 400 }
    );
  }

  if (!isYouTubeHostname(parsedVideoUrl.hostname)) {
    return createNoStoreResponse(
      { error: "Only YouTube URLs are supported." },
      { status: 422 }
    );
  }

  parsedVideoUrl.username = "";
  parsedVideoUrl.password = "";
  parsedVideoUrl.hash = "";

  const oEmbedUrl = new URL(YOUTUBE_OEMBED_ENDPOINT);
  oEmbedUrl.searchParams.set("format", "json");
  oEmbedUrl.searchParams.set("url", parsedVideoUrl.toString());

  let oEmbedResponse: Response;

  try {
    oEmbedResponse = await fetch(oEmbedUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch {
    return createNoStoreResponse(
      { error: "Failed to reach the YouTube oEmbed service." },
      { status: 502 }
    );
  }

  if (!oEmbedResponse.ok) {
    let errorMessage = `YouTube oEmbed request failed with status ${oEmbedResponse.status}.`;

    if (oEmbedResponse.status === 404) {
      errorMessage = "The requested YouTube video could not be found.";
    } else if (oEmbedResponse.status === 401 || oEmbedResponse.status === 403) {
      errorMessage = "YouTube oEmbed request was not authorized.";
    } else if (oEmbedResponse.status >= 500) {
      errorMessage = "YouTube oEmbed service encountered an internal error.";
    }

    return createNoStoreResponse(
      { error: errorMessage },
      { status: oEmbedResponse.status }
    );
  }

  let oEmbedData: YouTubeOEmbedResponse;

  try {
    oEmbedData = (await oEmbedResponse.json()) as YouTubeOEmbedResponse;
  } catch {
    return createNoStoreResponse(
      { error: "Invalid response received from the YouTube oEmbed service." },
      { status: 502 }
    );
  }

  const sanitizedResponse = {
    title: sanitizeText(oEmbedData.title),
    author: sanitizeText(oEmbedData.author_name),
    thumbnailUrl: sanitizeThumbnailUrl(oEmbedData.thumbnail_url),
    embedHtml: sanitizeEmbedHtml(oEmbedData.html),
    url: parsedVideoUrl.toString(),
  };

  return createNoStoreResponse(sanitizedResponse, { status: 200 });
}
