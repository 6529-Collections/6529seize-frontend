import type { LinkPreviewResponse } from "@/services/api/link-preview-api";

import { ensureUrlIsPublic } from "./utils";

type OfficeFileKind = "word" | "excel" | "powerpoint";
type OfficeAvailability = "public" | "unavailable";

type OfficeSource = "sharepoint" | "onedrive" | "viewer";

interface OfficeUrlSelection {
  readonly openUrl: URL;
  readonly source: OfficeSource;
  readonly viewerUrl?: URL;
}

interface BuildOfficePreviewParams {
  readonly originalUrl: URL;
  readonly finalUrl: URL;
  readonly html: string;
  readonly contentType: string | null;
  readonly baseResponse: LinkPreviewResponse;
}

interface OfficeLinks {
  readonly open: string;
  readonly preview: string | null;
  readonly officeViewer?: string | null;
  readonly exportPdf?: string | null;
}

type OfficePreviewResult = LinkPreviewResponse & {
  readonly type: `office.${OfficeFileKind}`;
  readonly title: string;
  readonly canonicalUrl: string;
  readonly thumbnail: string | null;
  readonly links: OfficeLinks;
  readonly availability: OfficeAvailability;
  readonly excel?: { readonly allowInteractivity: boolean };
};

const OFFICE_VIEWER_HOST = "view.officeapps.live.com";
const ONEDRIVE_HOST = "onedrive.live.com";

const LOGIN_HOST_SUFFIXES = [
  "login.microsoftonline.com",
  "login.live.com",
  "account.microsoft.com",
  "account.live.com",
];

const SHAREPOINT_SUFFIX = ".sharepoint.com";
const SHAREPOINT_MY_SUFFIX = "-my.sharepoint.com";

const SHAREPOINT_TYPE_HINTS: ReadonlyArray<[string, OfficeFileKind]> = [
  ["/:w:/", "word"],
  ["/:x:/", "excel"],
  ["/:p:/", "powerpoint"],
];

const FILE_EXTENSION_HINTS: ReadonlyArray<[RegExp, OfficeFileKind]> = [
  [/\.docx?(?:$|[?#])/i, "word"],
  [/\.docm(?:$|[?#])/i, "word"],
  [/\.dotx?(?:$|[?#])/i, "word"],
  [/\.rtf(?:$|[?#])/i, "word"],
  [/\.xlsx?(?:$|[?#])/i, "excel"],
  [/\.xlsm?(?:$|[?#])/i, "excel"],
  [/\.xlsb(?:$|[?#])/i, "excel"],
  [/\.csv(?:$|[?#])/i, "excel"],
  [/\.pptx?(?:$|[?#])/i, "powerpoint"],
  [/\.pptm(?:$|[?#])/i, "powerpoint"],
  [/\.ppsx?(?:$|[?#])/i, "powerpoint"],
];

const DEFAULT_TITLES: Record<OfficeFileKind, string> = {
  word: "Untitled Word document",
  excel: "Untitled Excel workbook",
  powerpoint: "Untitled PowerPoint presentation",
};

const OFFICE_USER_AGENT =
  "6529seize-link-preview/1.0 (+https://6529.io; Microsoft 365 preview fetch)";

const DIRECT_FETCH_TIMEOUT_MS = 3000;
const MAX_DIRECT_REDIRECTS = 3;
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

const isLoginHost = (hostname: string): boolean => {
  const lower = hostname.toLowerCase();
  return LOGIN_HOST_SUFFIXES.some((suffix) =>
    lower === suffix || lower.endsWith(`.${suffix}`)
  );
};

const cloneAndNormalizeUrl = (url: URL): URL => {
  const normalized = new URL(url.toString());
  normalized.hash = "";
  if (normalized.hostname.startsWith("www.")) {
    normalized.hostname = normalized.hostname.slice(4);
  }
  return normalized;
};

const safeParseUrl = (value: string | null | undefined): URL | null => {
  if (!value) {
    return null;
  }
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const decodeMaybeEncodedUrl = (value: string | null): URL | null => {
  if (!value) {
    return null;
  }

  let decoded = value;
  for (let i = 0; i < 2; i += 1) {
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      break;
    }
  }

  return safeParseUrl(decoded) ?? safeParseUrl(value);
};

const extractViewerSource = (url: URL): URL | null => {
  if (url.hostname.toLowerCase() !== OFFICE_VIEWER_HOST) {
    return null;
  }
  return decodeMaybeEncodedUrl(url.searchParams.get("src"));
};

const classifyOfficeSource = (url: URL): OfficeSource | null => {
  const hostname = url.hostname.toLowerCase();
  if (hostname === ONEDRIVE_HOST) {
    return "onedrive";
  }
  if (hostname.endsWith(SHAREPOINT_SUFFIX) || hostname.endsWith(SHAREPOINT_MY_SUFFIX)) {
    return "sharepoint";
  }
  if (hostname === OFFICE_VIEWER_HOST) {
    return "viewer";
  }
  return null;
};

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const clampString = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
};

const detectKindFromSharePointPath = (path: string): OfficeFileKind | null => {
  for (const [hint, kind] of SHAREPOINT_TYPE_HINTS) {
    if (path.includes(hint)) {
      return kind;
    }
  }
  return null;
};

const detectKindFromExtension = (value: string): OfficeFileKind | null => {
  for (const [pattern, kind] of FILE_EXTENSION_HINTS) {
    if (pattern.test(value)) {
      return kind;
    }
  }
  return null;
};

const detectKindFromIthint = (value: string | null): OfficeFileKind | null => {
  if (!value) {
    return null;
  }
  const normalized = decodeURIComponent(value).toLowerCase();
  if (normalized.includes("doc")) {
    return "word";
  }
  if (normalized.includes("xls") || normalized.includes("excel")) {
    return "excel";
  }
  if (normalized.includes("ppt") || normalized.includes("powerpoint")) {
    return "powerpoint";
  }
  return null;
};

const detectKindFromTitle = (title: string | null): OfficeFileKind | null => {
  if (!title) {
    return null;
  }
  const normalized = title.toLowerCase();
  if (normalized.includes("powerpoint")) {
    return "powerpoint";
  }
  if (normalized.includes("excel")) {
    return "excel";
  }
  if (normalized.includes("word")) {
    return "word";
  }
  return detectKindFromExtension(normalized);
};

const resolveOfficeKind = (
  openUrl: URL,
  selection: OfficeUrlSelection,
  baseResponse: LinkPreviewResponse,
  contentType: string | null
): OfficeFileKind | null => {
  const { searchParams, pathname } = openUrl;
  return (
    detectKindFromSharePointPath(pathname) ??
    detectKindFromExtension(pathname) ??
    detectKindFromIthint(searchParams.get("ithint")) ??
    (selection.viewerUrl
      ? detectKindFromExtension(selection.viewerUrl.pathname)
      : null) ??
    detectKindFromTitle(readString(baseResponse.title)) ??
    detectKindFromExtension(readString(baseResponse.url ?? undefined) ?? "") ??
    detectKindFromExtension(readString(baseResponse.requestUrl ?? undefined) ?? "") ??
    (contentType ? detectKindFromExtension(contentType) : null)
  );
};

const pickThumbnail = (baseResponse: LinkPreviewResponse): string | null => {
  const image = baseResponse.image;
  if (image && typeof image === "object") {
    const secureUrl = readString((image as Record<string, unknown>)["secureUrl"]);
    if (secureUrl) {
      return secureUrl;
    }
    const url = readString((image as Record<string, unknown>)["url"]);
    if (url) {
      return url;
    }
  }

  const images = Array.isArray(baseResponse.images) ? baseResponse.images : [];
  for (const entry of images) {
    if (entry && typeof entry === "object") {
      const secureUrl = readString((entry as Record<string, unknown>)["secureUrl"]);
      if (secureUrl) {
        return secureUrl;
      }
      const url = readString((entry as Record<string, unknown>)["url"]);
      if (url) {
        return url;
      }
    }
  }

  const thumbnail = readString((baseResponse as Record<string, unknown>)["thumbnail"]);
  if (thumbnail) {
    return thumbnail;
  }

  return null;
};

const selectOfficeUrls = (
  originalUrl: URL,
  finalUrl: URL,
  baseResponse: LinkPreviewResponse
): OfficeUrlSelection | null => {
  const candidates: Array<{ url: URL; source: OfficeSource }> = [];
  const viewerUrls: URL[] = [];

  const addCandidate = (url: URL | null) => {
    if (!url) {
      return;
    }
    const normalized = cloneAndNormalizeUrl(url);
    if (isLoginHost(normalized.hostname)) {
      return;
    }
    const source = classifyOfficeSource(normalized);
    if (!source) {
      return;
    }
    if (source === "viewer") {
      viewerUrls.push(normalized);
      const viewerSource = extractViewerSource(normalized);
      if (viewerSource) {
        addCandidate(viewerSource);
      }
      return;
    }
    candidates.push({ url: normalized, source });
  };

  const candidateStrings: Array<string | null | undefined> = [
    readString(baseResponse.url),
    readString(baseResponse.requestUrl),
  ];

  candidateStrings.push(originalUrl.toString(), finalUrl.toString());

  for (const value of candidateStrings) {
    addCandidate(safeParseUrl(value ?? undefined));
  }

  if (candidates.length > 0) {
    const { url, source } = candidates[0];
    return {
      openUrl: url,
      source,
      viewerUrl: viewerUrls[0],
    };
  }

  if (viewerUrls.length > 0) {
    const viewerUrl = viewerUrls[0];
    return { openUrl: viewerUrl, source: "viewer", viewerUrl };
  }

  return null;
};

const createDownloadUrl = (url: URL): URL => {
  const downloadUrl = new URL(url.toString());
  downloadUrl.searchParams.set("download", "1");
  return downloadUrl;
};

const isLikelyHtmlContent = (contentType: string | null): boolean => {
  if (!contentType) {
    return false;
  }
  return contentType.toLowerCase().includes("text/html");
};

const fetchWithTimeout = async (
  url: URL,
  method: "HEAD" | "GET"
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DIRECT_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url.toString(), {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": OFFICE_USER_AGENT,
        accept:
          "application/octet-stream,application/vnd.ms-excel,application/vnd.ms-powerpoint,application/msword,*/*;q=0.1",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
};

const resolveDirectFileUrl = async (
  url: URL
): Promise<string | null> => {
  let currentUrl = createDownloadUrl(url);
  const visited = new Set<string>();

  for (let redirectCount = 0; redirectCount < MAX_DIRECT_REDIRECTS; redirectCount += 1) {
    try {
      await ensureUrlIsPublic(currentUrl);
    } catch {
      return null;
    }

    let response: Response;
    try {
      response = await fetchWithTimeout(currentUrl, "HEAD");
    } catch {
      return null;
    }

    if (response.status === 405 || response.status === 501) {
      try {
        response = await fetchWithTimeout(currentUrl, "GET");
      } catch {
        return null;
      }
    }

    if (REDIRECT_STATUS_CODES.has(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        return null;
      }
      const nextUrl = new URL(location, currentUrl);
      if (isLoginHost(nextUrl.hostname)) {
        return null;
      }
      const key = nextUrl.toString();
      if (visited.has(key)) {
        return null;
      }
      visited.add(key);
      currentUrl = nextUrl;
      continue;
    }

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (isLikelyHtmlContent(contentType)) {
      return null;
    }

    return currentUrl.toString();
  }

  return null;
};

const buildViewerUrl = (source: string): string => {
  return `https://${OFFICE_VIEWER_HOST}/op/embed.aspx?src=${encodeURIComponent(source)}`;
};

const convertToEmbedViewer = (url: URL): string => {
  const embedUrl = new URL(url.toString());
  const segments = embedUrl.pathname.split("/");
  if (segments.length > 0) {
    segments[segments.length - 1] = "embed.aspx";
    embedUrl.pathname = segments.join("/");
  }
  return embedUrl.toString();
};

const buildExcelPreviewLink = (url: URL): { url: string; allow: boolean } => {
  const preview = new URL(url.toString());
  if (!preview.searchParams.has("action")) {
    preview.searchParams.set("action", "embedview");
  }
  return { url: preview.toString(), allow: true };
};

const determineAvailability = (
  finalUrl: URL,
  html: string
): OfficeAvailability => {
  if (isLoginHost(finalUrl.hostname)) {
    return "unavailable";
  }
  const normalizedHtml = html.toLowerCase();
  if (normalizedHtml.includes("signin") && normalizedHtml.includes("microsoft")) {
    return "unavailable";
  }
  return "public";
};

const buildLinksForKind = async (
  selection: OfficeUrlSelection,
  kind: OfficeFileKind,
  availability: OfficeAvailability
): Promise<OfficeLinks> => {
  const open = selection.openUrl.toString();

  if (availability === "unavailable") {
    return { open, preview: null, officeViewer: null, exportPdf: null };
  }

  if (selection.source === "viewer") {
    return {
      open,
      preview: convertToEmbedViewer(selection.openUrl),
      officeViewer: convertToEmbedViewer(selection.openUrl),
      exportPdf: null,
    };
  }

  const directUrl = await resolveDirectFileUrl(selection.openUrl);

  if (kind === "excel") {
    const embed = buildExcelPreviewLink(selection.openUrl);
    const officeViewer = directUrl ? buildViewerUrl(directUrl) : null;
    return {
      open,
      preview: embed.url,
      officeViewer,
      exportPdf: null,
    };
  }

  if (directUrl) {
    return {
      open,
      preview: buildViewerUrl(directUrl),
      officeViewer: buildViewerUrl(directUrl),
      exportPdf: null,
    };
  }

  if (selection.viewerUrl) {
    return {
      open,
      preview: convertToEmbedViewer(selection.viewerUrl),
      officeViewer: convertToEmbedViewer(selection.viewerUrl),
      exportPdf: null,
    };
  }

  return { open, preview: null, officeViewer: null, exportPdf: null };
};

const normalizeTitle = (
  baseResponse: LinkPreviewResponse,
  kind: OfficeFileKind
): string => {
  const candidate = readString(baseResponse.title);
  if (!candidate) {
    return DEFAULT_TITLES[kind];
  }
  return clampString(candidate, 200);
};

export const buildOffice365Preview = async (
  params: BuildOfficePreviewParams
): Promise<OfficePreviewResult | null> => {
  const selection = selectOfficeUrls(
    params.originalUrl,
    params.finalUrl,
    params.baseResponse
  );

  if (!selection) {
    return null;
  }

  const kind = resolveOfficeKind(
    selection.openUrl,
    selection,
    params.baseResponse,
    params.contentType
  );

  if (!kind) {
    return null;
  }

  const availability = determineAvailability(params.finalUrl, params.html);
  const links = await buildLinksForKind(selection, kind, availability);

  if (!links.preview && availability === "public") {
    if (kind !== "excel") {
      return null;
    }
  }

  const thumbnail = pickThumbnail(params.baseResponse);
  const title = normalizeTitle(params.baseResponse, kind);
  const canonicalUrl = selection.openUrl.toString();

  const excelInfo =
    kind === "excel"
      ? { allowInteractivity: links.preview !== links.officeViewer }
      : undefined;

  const result: OfficePreviewResult = {
    type: `office.${kind}`,
    title,
    canonicalUrl,
    thumbnail,
    links,
    availability,
    requestUrl: params.originalUrl.toString(),
    url: canonicalUrl,
    ...(excelInfo ? { excel: excelInfo } : {}),
  };

  return result;
};
