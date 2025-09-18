import type { WikimediaSource } from "@/types/wikimedia";

const TRACKING_PARAMS = [/^utm_/i, /^gclid$/i, /^fbclid$/i, /^mc_eid$/i];

const disallowedNamespaces = new Set([
  "special",
  "user",
  "user talk",
  "talk",
  "file talk",
  "category talk",
  "wikipedia",
  "mediawiki",
  "template",
  "template talk",
  "help",
  "portal",
  "draft",
  "timedtext",
  "module",
  "module talk",
]);

const decodeTitle = (value: string): string => {
  const replaced = value.replace(/_/g, " ");
  try {
    return decodeURIComponent(replaced);
  } catch {
    return replaced;
  }
};

const htmlEntityPattern = /&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g;

const decodeHtmlEntities = (value: string): string => {
  return value.replace(htmlEntityPattern, (_, entity: string) => {
    if (!entity) {
      return "";
    }
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    }
    if (entity.startsWith("#")) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    }
    switch (entity.toLowerCase()) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return '"';
      case "apos":
        return "'";
      case "nbsp":
        return " ";
      default:
        return "";
    }
  });
};

const encodeTitle = (value: string): string => {
  const normalized = value.replace(/\s+/g, " ").trim().replace(/ /g, "_");
  return encodeURI(normalized);
};

const stripTrackingParams = (url: URL): void => {
  for (const key of Array.from(url.searchParams.keys())) {
    if (TRACKING_PARAMS.some((pattern) => pattern.test(key))) {
      url.searchParams.delete(key);
    }
  }
};

const resolveWikipediaLanguage = (host: string): string => {
  const segments = host.split(".");
  const wikipediaIndex = segments.findIndex((segment) => segment === "wikipedia");
  if (wikipediaIndex <= 0) {
    return "en";
  }

  const prefixSegments = segments.slice(0, wikipediaIndex);
  const filtered = prefixSegments.filter((segment) =>
    !["www", "m"].includes(segment.toLowerCase())
  );

  if (filtered.length === 0) {
    const candidate = prefixSegments.find((segment) => segment.toLowerCase() !== "www");
    return candidate ?? "en";
  }

  return filtered[filtered.length - 1];
};

const getSectionFromHash = (hash: string): string | null => {
  if (!hash.startsWith("#")) {
    return null;
  }
  const fragment = hash.slice(1);
  if (!fragment) {
    return null;
  }
  try {
    const decoded = decodeURIComponent(fragment.replace(/_/g, " "));
    return decoded.trim() ? decoded.trim() : null;
  } catch {
    return fragment.replace(/_/g, " ");
  }
};

const normalizeWikipedia = (url: URL) => {
  const lang = resolveWikipediaLanguage(url.hostname.toLowerCase());
  let title: string | null = null;
  let curid: string | null = null;
  let oldid: string | null = null;

  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (pathSegments[0]?.toLowerCase() === "wiki" && pathSegments.length >= 2) {
    const rawTitle = pathSegments.slice(1).join("/");
    title = decodeTitle(rawTitle);
  } else if (pathSegments[0]?.toLowerCase() === "w") {
    const subPath = pathSegments.slice(1).join("/");
    if (subPath.toLowerCase() === "index.php") {
      const titleParam = url.searchParams.get("title");
      if (titleParam) {
        title = decodeTitle(titleParam);
      }
      const curidParam = url.searchParams.get("curid");
      if (curidParam) {
        curid = curidParam.trim();
      }
      const oldidParam = url.searchParams.get("oldid");
      if (oldidParam) {
        oldid = oldidParam.trim();
      }
    }
  }

  if (title) {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      title = null;
    } else {
      const namespace = normalizedTitle.split(":")[0]?.toLowerCase() ?? "";
      if (disallowedNamespaces.has(namespace)) {
        title = null;
      }
    }
  }

  stripTrackingParams(url);

  const section = getSectionFromHash(url.hash);

  const canonical = new URL(`https://${lang}.wikipedia.org/wiki/Main_Page`);
  if (title) {
    canonical.pathname = `/wiki/${encodeTitle(title)}`;
  } else if (curid) {
    canonical.pathname = `/wiki/${curid}`;
  }

  if (oldid) {
    canonical.searchParams.set("oldid", oldid);
  }

  const canonicalUrl = canonical.toString() + (section ? `#${encodeURI(section.replace(/ /g, "_"))}` : "");

  return {
    kind: "article" as const,
    source: "wikipedia" as WikimediaSource,
    lang,
    title: title ?? null,
    curid,
    oldid,
    section,
    canonicalUrl,
  };
};

const extractCommonsFileName = (url: URL): string | null => {
  const path = url.pathname;
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  if (segments[0].toLowerCase() === "wiki" && segments[1]) {
    const rawTitle = segments.slice(1).join("/");
    const decoded = decodeTitle(rawTitle);
    if (decoded.toLowerCase().startsWith("file:")) {
      return decoded.slice(5);
    }
    return decoded;
  }

  const lastSegment = segments[segments.length - 1];
  const sanitized = decodeTitle(lastSegment);
  if (!sanitized) {
    return null;
  }
  if (sanitized.includes("px-")) {
    const originalSegment = segments[segments.length - 2];
    return originalSegment ? decodeTitle(originalSegment) : sanitized;
  }
  return sanitized;
};

const normalizeCommons = (url: URL) => {
  stripTrackingParams(url);
  const fileName = extractCommonsFileName(url);
  const canonical = new URL("https://commons.wikimedia.org/wiki/Main_Page");
  const normalizedFile = fileName ? encodeTitle(`File:${fileName}`) : null;
  if (normalizedFile) {
    canonical.pathname = `/wiki/${normalizedFile}`;
  }

  return {
    kind: "commons-file" as const,
    source: "commons" as WikimediaSource,
    fileName,
    canonicalUrl: canonical.toString(),
  };
};

const normalizeWikidata = (url: URL) => {
  stripTrackingParams(url);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const id = pathSegments[1] ?? pathSegments[0] ?? "";
  const normalizedId = id.toUpperCase();
  const canonical = new URL(`https://www.wikidata.org/wiki/${encodeURIComponent(normalizedId)}`);
  return {
    kind: "wikidata" as const,
    source: "wikidata" as WikimediaSource,
    id: normalizedId,
    canonicalUrl: canonical.toString(),
  };
};

export type NormalizedTarget =
  | (ReturnType<typeof normalizeWikipedia> & { originalUrl: string })
  | (ReturnType<typeof normalizeCommons> & { originalUrl: string })
  | (ReturnType<typeof normalizeWikidata> & { originalUrl: string });

export const normalizeWikimediaTarget = (input: string): NormalizedTarget | null => {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (host === "w.wiki") {
    // Short links resolved elsewhere; leave to caller.
    return null;
  }

  if (host.endsWith(".wikipedia.org")) {
    return { ...normalizeWikipedia(url), originalUrl: input };
  }

  if (host === "commons.wikimedia.org" || host === "upload.wikimedia.org") {
    return { ...normalizeCommons(url), originalUrl: input };
  }

  if (host === "www.wikidata.org" || host === "wikidata.org") {
    return { ...normalizeWikidata(url), originalUrl: input };
  }

  if (host.endsWith(".wiktionary.org") || host.endsWith(".wikivoyage.org") || host.endsWith(".wikisource.org")) {
    return { ...normalizeWikipedia(url), originalUrl: input };
  }

  return null;
};

export const resolveWWiki = async (
  url: URL,
  signal?: AbortSignal
): Promise<URL | null> => {
  const response = await fetch(url.toString(), {
    method: "HEAD",
    redirect: "manual",
    signal,
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (location) {
      try {
        return new URL(location, url);
      } catch {
        return null;
      }
    }
  }

  if (response.status >= 200 && response.status < 300) {
    return url;
  }

  return null;
};

export const sanitizePlainText = (value: string | null | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const decoded = decodeHtmlEntities(trimmed);
  return decoded.replace(/\s+/g, " ").trim();
};
