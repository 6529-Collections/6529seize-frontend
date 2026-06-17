import manifestJson from "@/content/delegation/manifest.json";
import { sha256 } from "js-sha256";

export interface DelegationContentArticle {
  readonly title: string;
  readonly summary: string;
  readonly group: string;
  readonly path: string;
  readonly sourceUrl: string;
  readonly sourceUri: string | null;
  readonly sha256: string;
}

interface DelegationContentAsset {
  readonly path: string;
  readonly sourceUrl: string | null;
  readonly sha256: string;
  readonly bytes: number;
}

export interface DelegationContentManifest {
  readonly version: string;
  readonly generatedAt: string;
  readonly canonicalStorage: {
    readonly type: "ipfs";
    readonly rootCid: string | null;
  };
  readonly acceleration: {
    readonly primaryGatewayBaseUrl: string;
    readonly fallbackGatewayBaseUrls: readonly string[];
    readonly cloudFrontBaseUrl: string | null;
  };
  readonly localBasePath: string;
  readonly assets: Readonly<Record<string, DelegationContentAsset>>;
  readonly articles: Readonly<Record<string, DelegationContentArticle>>;
}

type DelegationArticleResponse = Pick<Response, "ok" | "status" | "text"> & {
  readonly body?: ReadableStream<Uint8Array> | null;
  readonly headers?: Pick<Headers, "get">;
};

type DelegationArticleFetch = (
  url: string
) => Promise<DelegationArticleResponse>;

export const MAX_DELEGATION_ARTICLE_BYTES = 512 * 1024;

export interface DelegationArticleHtmlResult {
  readonly article: DelegationContentArticle;
  readonly html: string;
  readonly url: string;
}

export const delegationContentManifest =
  manifestJson as DelegationContentManifest;

export const delegationArticleSlugs = Object.keys(
  delegationContentManifest.articles
);

export const DELEGATION_TOP_LEVEL_ARTICLE_SLUGS = [
  "reference-overview-wallet-architecture",
  "delegation-faq",
  "consolidation-use-cases",
] as const;

function normalizeUrlPart(part: string) {
  let start = 0;
  let end = part.length;

  while (start < end && part[start] === "/") {
    start++;
  }

  while (end > start && part[end - 1] === "/") {
    end--;
  }

  return part.slice(start, end);
}

function removeTrailingSlashes(value: string) {
  let end = value.length;

  while (end > 0 && value[end - 1] === "/") {
    end--;
  }

  return value.slice(0, end);
}

function joinUrl(baseUrl: string, path: string) {
  return `${removeTrailingSlashes(baseUrl)}/${normalizeUrlPart(path)}`;
}

function uniqueUrls(urls: string[]) {
  return [...new Set(urls)];
}

export function getDelegationArticle(
  slug: string | undefined
): DelegationContentArticle | undefined {
  if (!slug) {
    return undefined;
  }

  return delegationContentManifest.articles[slug];
}

export function getDelegationArticleSlugAt(index: number): string | undefined {
  return delegationArticleSlugs[index];
}

export function getDelegationArticleIndex(slug: string) {
  return delegationArticleSlugs.indexOf(slug);
}

export function isDelegationFaqChildArticle(slug: string | undefined) {
  return (
    !!slug &&
    !!getDelegationArticle(slug) &&
    !DELEGATION_TOP_LEVEL_ARTICLE_SLUGS.includes(
      slug as (typeof DELEGATION_TOP_LEVEL_ARTICLE_SLUGS)[number]
    )
  );
}

export function buildDelegationArticleUrls(
  article: DelegationContentArticle,
  manifest: DelegationContentManifest = delegationContentManifest
): string[] {
  const urls: string[] = [];
  const rootCid = manifest.canonicalStorage.rootCid?.trim();
  const cloudFrontBaseUrl = manifest.acceleration.cloudFrontBaseUrl?.trim();

  if (rootCid && cloudFrontBaseUrl) {
    urls.push(joinUrl(cloudFrontBaseUrl, article.path));
  }

  if (rootCid) {
    urls.push(
      joinUrl(
        `${manifest.acceleration.primaryGatewayBaseUrl}/${rootCid}`,
        article.path
      )
    );

    for (const gateway of manifest.acceleration.fallbackGatewayBaseUrls) {
      urls.push(joinUrl(`${gateway}/${rootCid}`, article.path));
    }
  }

  urls.push(joinUrl(manifest.localBasePath, article.path));

  return uniqueUrls(urls);
}

function toRenderedUrl(reference: string, baseUrl: string) {
  if (
    reference.startsWith("#") ||
    reference.startsWith("/") ||
    /^[a-z][a-z0-9+.-]*:/i.test(reference)
  ) {
    return reference;
  }

  const localOrigin = "https://delegation-content.local";
  const base = baseUrl.startsWith("/")
    ? new URL(baseUrl, localOrigin)
    : new URL(baseUrl);
  const resolved = new URL(reference, base);

  if (resolved.origin === localOrigin) {
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  }

  return resolved.toString();
}

export function resolveDelegationArticleAssetUrls(
  html: string,
  articleUrl: string
) {
  // Article body URL rewriting is intentionally browser-only today. Metadata
  // paths read the manifest but do not fetch or render HTML bodies server-side.
  const document =
    globalThis.document?.implementation?.createHTMLDocument(
      "delegation article"
    );

  if (!document) {
    throw new Error("Delegation article URL rewriting requires a DOM document");
  }

  const template = document.createElement("template");
  template.innerHTML = html;

  for (const attribute of ["src", "href"]) {
    for (const element of Array.from(
      template.content.querySelectorAll(`[${attribute}]`)
    )) {
      const reference = element.getAttribute(attribute);
      if (reference) {
        element.setAttribute(attribute, toRenderedUrl(reference, articleUrl));
      }
    }
  }

  return template.innerHTML;
}

function getResponseContentLength(response: DelegationArticleResponse) {
  const value = response.headers?.get("content-length");

  if (!value) {
    return undefined;
  }

  const length = Number(value);
  return Number.isFinite(length) && length >= 0 ? length : undefined;
}

function assertArticleByteLength(byteLength: number, url: string) {
  if (byteLength > MAX_DELEGATION_ARTICLE_BYTES) {
    throw new Error(
      `${url} exceeded ${MAX_DELEGATION_ARTICLE_BYTES} byte article limit`
    );
  }
}

async function readArticleResponseText(
  response: DelegationArticleResponse,
  url: string
) {
  const contentLength = getResponseContentLength(response);

  if (typeof contentLength === "number") {
    assertArticleByteLength(contentLength, url);
  }

  const reader = response.body?.getReader();

  if (!reader) {
    const text = await response.text();
    assertArticleByteLength(new TextEncoder().encode(text).byteLength, url);
    return text;
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    totalBytes += value.byteLength;

    if (totalBytes > MAX_DELEGATION_ARTICLE_BYTES) {
      await reader.cancel();
      assertArticleByteLength(totalBytes, url);
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(bytes);
}

export async function fetchDelegationArticleHtml(
  slug: string,
  fetchArticle: DelegationArticleFetch = fetch
): Promise<DelegationArticleHtmlResult> {
  const article = getDelegationArticle(slug);

  if (!article) {
    throw new Error(`Unknown delegation article: ${slug}`);
  }

  const errors: string[] = [];
  const urls = buildDelegationArticleUrls(article);

  for (const url of urls) {
    try {
      const response = await fetchArticle(url);
      if (!response.ok) {
        errors.push(`${url} returned ${response.status}`);
        continue;
      }

      const html = await readArticleResponseText(response, url);
      const digest = sha256(html);
      if (digest !== article.sha256) {
        errors.push(`${url} hash ${digest} did not match ${article.sha256}`);
        continue;
      }

      return {
        article,
        html: resolveDelegationArticleAssetUrls(html, url),
        url,
      };
    } catch (error) {
      errors.push(`${url} failed: ${(error as Error).message}`);
    }
  }

  throw new Error(
    `Unable to load delegation article ${slug}. ${errors.join("; ")}`
  );
}
