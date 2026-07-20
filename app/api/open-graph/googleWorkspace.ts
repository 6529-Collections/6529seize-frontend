import { load } from "cheerio";

import { fetchPublicUrl } from "@/lib/security/urlGuard";
import type {
  GoogleDocsLinkPreview,
  GoogleSheetsLinkPreview,
  GoogleSlidesLinkPreview,
  GoogleWorkspaceLinkPreview,
} from "@/services/api/link-preview-api";
import {
  HTML_ACCEPT_HEADER,
  LINK_PREVIEW_USER_AGENT,
  extractFirstMetaContent,
  extractTitleTag,
} from "./utils";

const TITLE_KEYS = ["og:title", "twitter:title", "title"] as const;
const GOOGLE_DOCS_HOST = "docs.google.com";
const GOOGLE_THUMBNAIL_BASE = "https://drive.google.com/thumbnail";
const GOOGLE_PREVIEW_TIMEOUT_MS = 3000;
const GOOGLE_PREVIEW_BYTE_LIMIT = 64 * 1024;
const GOOGLE_TITLE_MAX_LENGTH = 160;
const GOOGLE_PREVIEW_HOST_POLICY = {
  allowedHosts: [GOOGLE_DOCS_HOST],
} as const;
type GoogleWorkspaceKind = "docs" | "sheets" | "slides";
const GOOGLE_RESOURCE_KIND: Record<string, GoogleWorkspaceKind | undefined> = {
  document: "docs",
  spreadsheets: "sheets",
  presentation: "slides",
};

const GOOGLE_TYPE_INFO: Record<
  GoogleWorkspaceKind,
  {
    readonly type: GoogleWorkspaceLinkPreview["type"];
    readonly label: string;
    readonly fallbackTitle: string;
    readonly resource: string;
  }
> = {
  docs: {
    type: "google.docs",
    label: "Google Docs",
    fallbackTitle: "Untitled Doc",
    resource: "document",
  },
  sheets: {
    type: "google.sheets",
    label: "Google Sheets",
    fallbackTitle: "Untitled Sheet",
    resource: "spreadsheets",
  },
  slides: {
    type: "google.slides",
    label: "Google Slides",
    fallbackTitle: "Untitled Slides",
    resource: "presentation",
  },
};

type GoogleWorkspaceAvailability = GoogleWorkspaceLinkPreview["availability"];

interface GoogleWorkspaceNormalization {
  readonly kind: GoogleWorkspaceKind;
  readonly fileId: string;
  readonly canonicalBase: string;
  readonly gid?: string | undefined;
  readonly range?: string | undefined;
  readonly widget?: string | undefined;
  readonly headers?: string | undefined;
  readonly chrome?: string | undefined;
  readonly isPublished: boolean;
}

const GOOGLE_ACCESS_DENIED_PATTERNS = [
  "you need permission",
  "request access",
  "sign in to continue",
  "sign in - google accounts",
  "accounts.google.com/signin",
  "ask for access",
  "this document is unavailable",
  "this presentation is unavailable",
  "this file is not available",
];

interface GooglePreviewRule {
  readonly kind: GoogleWorkspaceKind;
  readonly pattern: RegExp;
  readonly allowedParams: ReadonlySet<string>;
  readonly requiredParams?: ReadonlySet<string> | undefined;
}

const GOOGLE_PREVIEW_RULES: readonly GooglePreviewRule[] = [
  {
    kind: "docs",
    pattern: /^\/document\/d\/[A-Z0-9_-]+\/preview$/i,
    allowedParams: new Set<string>(),
  },
  {
    kind: "slides",
    pattern: /^\/presentation\/d\/[A-Z0-9_-]+\/preview$/i,
    allowedParams: new Set<string>(),
  },
  {
    kind: "sheets",
    pattern: /^\/spreadsheets\/d\/[A-Z0-9_-]+\/htmlview$/i,
    allowedParams: new Set<string>(["gid", "range"]),
    requiredParams: new Set<string>(["gid"]),
  },
];

function validateGooglePreviewUrl(rawUrl: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.protocol.toLowerCase() !== "https:") {
    return null;
  }

  const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  if (hostname !== GOOGLE_DOCS_HOST) {
    return null;
  }

  if (parsed.hash) {
    return null;
  }

  const matchingRule = GOOGLE_PREVIEW_RULES.find((rule) =>
    rule.pattern.test(parsed.pathname)
  );
  if (!matchingRule) {
    return null;
  }

  for (const key of Array.from(parsed.searchParams.keys())) {
    if (!matchingRule.allowedParams.has(key)) {
      return null;
    }
  }

  if (matchingRule.requiredParams) {
    for (const key of Array.from(matchingRule.requiredParams)) {
      if (!parsed.searchParams.get(key)) {
        return null;
      }
    }
  }

  return parsed;
}

function parseHashParams(hash: string): URLSearchParams {
  if (!hash) {
    return new URLSearchParams();
  }

  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(normalized);
}

function normalizeGoogleWorkspaceUrl(
  url: URL
): GoogleWorkspaceNormalization | null {
  const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (hostname !== GOOGLE_DOCS_HOST) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 3) {
    return null;
  }

  const [resource, marker, fileId, ...rest] = segments;
  if (marker !== "d" || !fileId || !resource) {
    return null;
  }

  const kind = GOOGLE_RESOURCE_KIND[resource.toLowerCase()];
  if (!kind) {
    return null;
  }

  const canonicalBase = `https://${GOOGLE_DOCS_HOST}/${resource.toLowerCase()}/d/${fileId}`;
  const searchParams = url.searchParams;
  const hashParams = parseHashParams(url.hash);

  const gid = searchParams.get("gid") ?? hashParams.get("gid") ?? undefined;
  const range =
    searchParams.get("range") ?? hashParams.get("range") ?? undefined;
  const widget = searchParams.get("widget") ?? undefined;
  const headers = searchParams.get("headers") ?? undefined;
  const chrome = searchParams.get("chrome") ?? undefined;

  const isPublished =
    rest.some((segment) => segment.toLowerCase().startsWith("pub")) ||
    searchParams.get("output") === "html" ||
    widget !== undefined ||
    headers !== undefined ||
    chrome !== undefined;

  return {
    kind,
    fileId,
    canonicalBase,
    gid: gid && gid.length > 0 ? gid : undefined,
    range: range && range.length > 0 ? range : undefined,
    widget: widget && widget.length > 0 ? widget : undefined,
    headers: headers && headers.length > 0 ? headers : undefined,
    chrome: chrome && chrome.length > 0 ? chrome : undefined,
    isPublished,
  };
}

function buildSheetsPreviewUrl(
  base: string,
  gid: string,
  range?: string
): string {
  const preview = new URL(`${base}/htmlview`);
  preview.searchParams.set("gid", gid);
  if (range) {
    preview.searchParams.set("range", range);
  }
  return preview.toString();
}

function buildSheetsEmbedUrl(
  normalization: GoogleWorkspaceNormalization,
  gid: string
): string {
  const embed = new URL(`${normalization.canonicalBase}/pubhtml`);
  embed.searchParams.set("widget", normalization.widget ?? "true");
  embed.searchParams.set("headers", normalization.headers ?? "false");
  embed.searchParams.set("gid", gid);
  if (normalization.range) {
    embed.searchParams.set("range", normalization.range);
  }
  if (normalization.chrome) {
    embed.searchParams.set("chrome", normalization.chrome);
  }
  return embed.toString();
}

function buildGoogleThumbnailUrl(fileId: string): string {
  return `${GOOGLE_THUMBNAIL_BASE}?id=${encodeURIComponent(fileId)}&sz=w1000`;
}

function clampGoogleTitle(
  value: string | undefined | null,
  fallback: string
): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  const base = trimmed.length > 0 ? trimmed : fallback;
  if (base.length <= GOOGLE_TITLE_MAX_LENGTH) {
    return base;
  }
  return `${base.slice(0, GOOGLE_TITLE_MAX_LENGTH - 1).trimEnd()}…`;
}

function isGoogleAccessRestricted(html: string | null | undefined): boolean {
  if (!html) {
    return false;
  }

  const normalized = html.toLowerCase();
  return GOOGLE_ACCESS_DENIED_PATTERNS.some((pattern) =>
    normalized.includes(pattern)
  );
}

function truncateToLimit(value: string, byteLimit: number): string {
  return value.length > byteLimit ? value.slice(0, byteLimit) : value;
}

async function readTextResponse(
  response: Response,
  byteLimit: number
): Promise<string> {
  const text = await response.text();
  return truncateToLimit(text, byteLimit);
}

async function cancelReader(
  reader: ReadableStreamDefaultReader<Uint8Array>
): Promise<void> {
  try {
    await reader.cancel();
  } catch {
    // ignore cancellation errors
  }
}

async function readStreamResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  byteLimit: number
): Promise<string> {
  const decoder = new TextDecoder();
  let total = 0;
  let result = "";

  while (total < byteLimit) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    total += value.byteLength;
    result += decoder.decode(value, { stream: true });

    if (total >= byteLimit) {
      await cancelReader(reader);
      break;
    }
  }

  result += decoder.decode();
  return truncateToLimit(result, byteLimit);
}

async function readLimitedResponse(
  response: Response,
  byteLimit: number
): Promise<string> {
  if (!response.body) {
    return readTextResponse(response, byteLimit);
  }

  const reader = response.body.getReader();
  return readStreamResponse(reader, byteLimit);
}

async function fetchGooglePreviewHtml(url: string): Promise<{
  html: string | null;
  ok: boolean;
}> {
  const validatedUrl = validateGooglePreviewUrl(url);
  if (!validatedUrl) {
    return { html: null, ok: false };
  }

  try {
    const response = await fetchPublicUrl(
      validatedUrl,
      {
        headers: {
          accept: HTML_ACCEPT_HEADER,
        },
      },
      {
        maxRedirects: 0,
        policy: GOOGLE_PREVIEW_HOST_POLICY,
        timeoutMs: GOOGLE_PREVIEW_TIMEOUT_MS,
        userAgent: LINK_PREVIEW_USER_AGENT,
      }
    );

    if (!response.ok) {
      return { html: null, ok: false };
    }

    const html = await readLimitedResponse(response, GOOGLE_PREVIEW_BYTE_LIMIT);
    return { html, ok: true };
  } catch {
    return { html: null, ok: false };
  }
}

function deriveGoogleAvailability(
  previewResult: { html: string | null; ok: boolean },
  initialHtml: string
): GoogleWorkspaceAvailability {
  if (!previewResult.ok) {
    return "restricted";
  }

  if (
    isGoogleAccessRestricted(previewResult.html) ||
    isGoogleAccessRestricted(initialHtml)
  ) {
    return "restricted";
  }

  return "public";
}

function buildTitleCandidates(html: string | null): Array<string | undefined> {
  if (!html) {
    return [];
  }
  const $ = load(html);

  return [extractFirstMetaContent($, TITLE_KEYS), extractTitleTag($)];
}

function pickGoogleTitle(
  previewHtml: string | null,
  initialHtml: string,
  fallback: string
): string {
  const candidates = [
    ...buildTitleCandidates(previewHtml),
    ...buildTitleCandidates(initialHtml),
  ];

  const selected = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0
  );

  return clampGoogleTitle(selected, fallback);
}

export async function buildGoogleWorkspaceResponse(
  resolvedUrl: URL,
  html: string,
  requestUrl: URL
): Promise<GoogleWorkspaceLinkPreview | null> {
  const normalization = normalizeGoogleWorkspaceUrl(resolvedUrl);
  if (!normalization) {
    return null;
  }

  const info = GOOGLE_TYPE_INFO[normalization.kind];
  const thumbnail = buildGoogleThumbnailUrl(normalization.fileId);

  if (normalization.kind === "docs") {
    const openUrl = `${normalization.canonicalBase}/edit`;
    const previewUrl = `${normalization.canonicalBase}/preview`;
    const preview = await fetchGooglePreviewHtml(previewUrl);
    const availability = deriveGoogleAvailability(preview, html);
    const extractedTitle = pickGoogleTitle(
      preview.html,
      html,
      info.fallbackTitle
    );
    const resolvedTitle =
      availability === "restricted" ? info.fallbackTitle : extractedTitle;

    const response: GoogleDocsLinkPreview = {
      type: "google.docs",
      requestUrl: requestUrl.toString(),
      url: openUrl,
      title: resolvedTitle,
      description: null,
      siteName: info.label,
      mediaType: null,
      contentType: null,
      favicon: null,
      favicons: [],
      image: null,
      images: [],
      thumbnail,
      fileId: normalization.fileId,
      availability,
      links: {
        open: openUrl,
        preview: previewUrl,
        exportPdf: `${normalization.canonicalBase}/export?format=pdf`,
      },
    };

    return response;
  }

  if (normalization.kind === "slides") {
    const openUrl = `${normalization.canonicalBase}/edit`;
    const previewUrl = `${normalization.canonicalBase}/preview`;
    const preview = await fetchGooglePreviewHtml(previewUrl);
    const availability = deriveGoogleAvailability(preview, html);
    const extractedTitle = pickGoogleTitle(
      preview.html,
      html,
      info.fallbackTitle
    );
    const resolvedTitle =
      availability === "restricted" ? info.fallbackTitle : extractedTitle;

    const response: GoogleSlidesLinkPreview = {
      type: "google.slides",
      requestUrl: requestUrl.toString(),
      url: openUrl,
      title: resolvedTitle,
      description: null,
      siteName: info.label,
      mediaType: null,
      contentType: null,
      favicon: null,
      favicons: [],
      image: null,
      images: [],
      thumbnail,
      fileId: normalization.fileId,
      availability,
      links: {
        open: openUrl,
        preview: previewUrl,
        exportPdf: `${normalization.canonicalBase}/export/pdf`,
      },
    };

    return response;
  }

  const resolvedGid = normalization.gid ?? "0";
  const openUrl = `${normalization.canonicalBase}/edit#gid=${resolvedGid}`;
  const previewUrl = buildSheetsPreviewUrl(
    normalization.canonicalBase,
    resolvedGid,
    normalization.range
  );
  const preview = await fetchGooglePreviewHtml(previewUrl);
  const availability = deriveGoogleAvailability(preview, html);
  const extractedTitle = pickGoogleTitle(
    preview.html,
    html,
    info.fallbackTitle
  );
  const resolvedTitle =
    availability === "restricted" ? info.fallbackTitle : extractedTitle;
  const embedPub = normalization.isPublished
    ? buildSheetsEmbedUrl(normalization, resolvedGid)
    : undefined;

  const response: GoogleSheetsLinkPreview = {
    type: "google.sheets",
    requestUrl: requestUrl.toString(),
    url: openUrl,
    title: resolvedTitle,
    description: null,
    siteName: info.label,
    mediaType: null,
    contentType: null,
    favicon: null,
    favicons: [],
    image: null,
    images: [],
    thumbnail,
    fileId: normalization.fileId,
    availability,
    gid: resolvedGid,
    links: {
      open: openUrl,
      preview: previewUrl,
      ...(embedPub ? { embedPub } : {}),
    },
  };

  return response;
}
