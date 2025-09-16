import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const CACHE_HEADERS = {
  "Cache-Control": "no-store, max-age=0, must-revalidate"
} as const;

interface MetaTagAttributes {
  name?: string;
  property?: string;
  content?: string;
}

const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " "
};

const META_TAG_PATTERN = /<meta\b[^>]*>/gi;
const ATTRIBUTE_PATTERN = /([a-zA-Z0-9:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^"'\s>]+))/gi;
const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]+/g;

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z0-9]+);/g, (match, entity) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }

    if (entity.startsWith("#")) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }

    const replacement = NAMED_HTML_ENTITIES[entity.toLowerCase()];
    return replacement ?? match;
  });
}

function sanitizeText(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const decoded = decodeHtmlEntities(value);
  const withoutTags = decoded.replace(/<[^>]*>/g, " ");
  const withoutControls = withoutTags.replace(CONTROL_CHAR_PATTERN, " ");
  const normalized = withoutControls.replace(/\s+/g, " ").trim();
  return normalized || undefined;
}

function sanitizeUrl(value: string | undefined, baseUrl: URL): string | undefined {
  if (!value) {
    return undefined;
  }

  const decoded = decodeHtmlEntities(value).trim();
  if (!decoded) {
    return undefined;
  }

  try {
    const resolved = new URL(decoded, baseUrl);
    if (resolved.protocol === "http:" || resolved.protocol === "https:") {
      return resolved.toString();
    }
  } catch (error) {
    return undefined;
  }

  return undefined;
}

function extractMetaTags(html: string): MetaTagAttributes[] {
  const tags: MetaTagAttributes[] = [];

  let match: RegExpExecArray | null;
  while ((match = META_TAG_PATTERN.exec(html)) !== null) {
    const tag = match[0];
    const attributes: Record<string, string> = {};

    let attributeMatch: RegExpExecArray | null;
    ATTRIBUTE_PATTERN.lastIndex = 0;
    while ((attributeMatch = ATTRIBUTE_PATTERN.exec(tag)) !== null) {
      const attributeName = attributeMatch[1].toLowerCase();
      const attributeValue = attributeMatch[2] ?? attributeMatch[3] ?? attributeMatch[4] ?? "";
      attributes[attributeName] = attributeValue;
    }

    if (Object.keys(attributes).length > 0) {
      tags.push({
        name: attributes.name,
        property: attributes.property,
        content: attributes.content
      });
    }
  }

  return tags;
}

function findMetaContent(metaTags: MetaTagAttributes[], keys: string[]): string | undefined {
  for (const key of keys) {
    const normalizedKey = key.toLowerCase();
    const tag = metaTags.find(meta => {
      const property = meta.property?.toLowerCase();
      const name = meta.name?.toLowerCase();
      return property === normalizedKey || name === normalizedKey;
    });

    if (tag?.content) {
      return tag.content;
    }
  }

  return undefined;
}

function extractTitleTag(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1];
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json(
      { error: 'Missing required "url" query parameter.' },
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
    if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'The "url" query parameter must be a valid HTTP or HTTPS URL.' },
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  let response: Response;
  try {
    response = await fetch(targetUrl.toString(), {
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "6529seize-metadata-fetcher/1.0"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch the provided URL." },
      { status: 502, headers: CACHE_HEADERS }
    );
  }

  if (!response.ok) {
    const status = response.status === 404 ? 404 : 502;
    return NextResponse.json(
      { error: `Upstream responded with status ${response.status}.` },
      { status, headers: CACHE_HEADERS }
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
    return NextResponse.json(
      { error: "The provided URL does not return HTML content." },
      { status: 415, headers: CACHE_HEADERS }
    );
  }

  const html = await response.text();
  const metaTags = extractMetaTags(html);

  const titleRaw =
    findMetaContent(metaTags, ["og:title", "twitter:title"]) ??
    extractTitleTag(html);
  const descriptionRaw = findMetaContent(metaTags, [
    "og:description",
    "description",
    "twitter:description"
  ]);
  const imageRaw = findMetaContent(metaTags, [
    "og:image",
    "og:image:url",
    "twitter:image",
    "twitter:image:src"
  ]);
  const urlRaw = findMetaContent(metaTags, ["og:url"]);

  const title = sanitizeText(titleRaw) ?? targetUrl.hostname;
  const description = sanitizeText(descriptionRaw);
  const image = sanitizeUrl(imageRaw, targetUrl);
  const url = sanitizeUrl(urlRaw, targetUrl) ?? targetUrl.toString();

  return NextResponse.json(
    {
      title,
      description: description ?? null,
      image: image ?? null,
      url
    },
    { headers: CACHE_HEADERS }
  );
}
