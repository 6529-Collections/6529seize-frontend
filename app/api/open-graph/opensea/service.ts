import type { PreviewPlan } from "@/app/api/open-graph/compound/service";
import { buildResponse } from "@/app/api/open-graph/utils";
import { getAlchemyApiKey } from "@/config/alchemyEnv";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";
import type { LinkPreviewResponse } from "@/services/api/link-preview-api";

import { fetchAlchemyMetadataCandidate } from "./alchemy";
import {
  asNonEmptyString,
  createRequestId,
  getObjectKeys,
  OPEN_SEA_IMAGE_CANDIDATE_SOURCES,
  OPEN_SEA_IMAGE_SOURCE_READERS,
  toObjectRecord,
  truncateForLog,
} from "./shared";

import type {
  AlchemyNftMetadata,
  CreateOpenSeaPlanDeps,
  OpenSeaContext,
  OpenSeaFallbackReason,
  OpenSeaMetadataFetchResult,
  OpenSeaPreviewBuildResult,
  OpenSeaTokenUriImageSource,
  ResolvedOpenSeaImage,
  TokenUriMetadata,
} from "./shared";

const OPENSEA_CACHE_TTL_MS = 5 * 60 * 1000;
const OPENSEA_HOST = "opensea.io";
const OPENSEA_ITEM_PATH_PATTERN =
  /^\/item\/([^/]+)\/(0x[a-f0-9]{40})\/([^/?#]+)\/?$/i;
const OPENSEA_ASSET_PATH_PATTERN =
  /^\/assets\/([^/]+)\/(0x[a-f0-9]{40})\/([^/?#]+)\/?$/i;
const DEFAULT_IPFS_GATEWAY = "https://ipfs.io/ipfs/";
const TOKEN_URI_PREFIXED_PLACEHOLDER_PATTERN = /0x(?:\{id\}|%7Bid%7D)/i;
const TOKEN_URI_FETCH_TIMEOUT_MS = 4000;

const ALCHEMY_NETWORK_BY_OPENSEA_CHAIN: Record<string, string> = {
  arbitrum: "arb-mainnet",
  base: "base-mainnet",
  ethereum: "eth-mainnet",
  linea: "linea-mainnet",
  matic: "polygon-mainnet",
  optimism: "opt-mainnet",
  polygon: "polygon-mainnet",
  zora: "zora-mainnet",
};

const normalizeTokenIdCandidate = (tokenId: string): string => {
  const trimmed = tokenId.trim();
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
    try {
      return `0x${BigInt(trimmed).toString(16)}`;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
};

const toHexTokenId = (tokenId: string): string | null => {
  const trimmed = tokenId.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return `0x${BigInt(trimmed).toString(16)}`;
  } catch {
    return null;
  }
};

const buildTokenIdCandidates = (tokenId: string): string[] => {
  const normalizedPrimary = normalizeTokenIdCandidate(tokenId);
  const candidates = [normalizedPrimary];
  const hexCandidate = toHexTokenId(tokenId);

  if (hexCandidate && !candidates.includes(hexCandidate)) {
    candidates.push(hexCandidate);
  }

  return candidates;
};

const getTokenIdParts = (
  tokenId: string
): {
  readonly decimal: string;
  readonly hexNoPrefix: string;
  readonly hex64NoPrefix: string;
} | null => {
  try {
    const parsed = BigInt(tokenId.trim());
    const hexNoPrefix = parsed.toString(16);
    return {
      decimal: parsed.toString(10),
      hexNoPrefix,
      hex64NoPrefix: hexNoPrefix.padStart(64, "0"),
    };
  } catch {
    return null;
  }
};

const hasTokenIdPlaceholder = (tokenUri: string): boolean =>
  /\{id\}/i.test(tokenUri) || /%7Bid%7D/i.test(tokenUri);

const replaceTokenIdPlaceholders = (tokenUri: string, value: string): string =>
  tokenUri.replaceAll(/\{id\}/gi, value).replaceAll(/%7Bid%7D/gi, value);

const logFallback = (
  requestId: string,
  requestUrl: URL,
  reason: OpenSeaFallbackReason,
  details?: Record<string, unknown>
): void => {
  if (reason === "no_image_candidate") {
    return;
  }

  console.warn(
    `[open-graph:opensea:${requestId}] Unable to resolve OpenSea media (${reason}); returning non-OG preview`,
    {
      requestUrl: requestUrl.toString(),
      reason,
      ...details,
    }
  );
};

const extractOpenSeaContext = (url: URL): OpenSeaContext | null => {
  if (!matchesDomainOrSubdomain(url.hostname.toLowerCase(), OPENSEA_HOST)) {
    return null;
  }

  const itemMatch = OPENSEA_ITEM_PATH_PATTERN.exec(url.pathname);
  if (itemMatch) {
    const chainSegment = itemMatch[1]?.trim().toLowerCase();
    const contractAddress = itemMatch[2]?.trim();
    const tokenId = itemMatch[3]?.trim();

    if (!chainSegment || !contractAddress || !tokenId) {
      return null;
    }

    return {
      chainSegment,
      contractAddress,
      tokenId,
    };
  }

  const assetMatch = OPENSEA_ASSET_PATH_PATTERN.exec(url.pathname);
  if (!assetMatch) {
    return null;
  }

  const chainSegment = assetMatch[1]?.trim().toLowerCase();
  const contractAddress = assetMatch[2]?.trim();
  const tokenId = assetMatch[3]?.trim();

  if (!chainSegment || !contractAddress || !tokenId) {
    return null;
  }

  return {
    chainSegment,
    contractAddress,
    tokenId,
  };
};

const normalizeMediaUrl = (value: string): string => {
  const trimmed = value.trim();

  if (trimmed.startsWith("ipfs://ipfs/")) {
    return `${DEFAULT_IPFS_GATEWAY}${trimmed.slice("ipfs://ipfs/".length)}`;
  }

  if (trimmed.startsWith("ipfs://")) {
    return `${DEFAULT_IPFS_GATEWAY}${trimmed.slice("ipfs://".length)}`;
  }

  if (trimmed.startsWith("ar://")) {
    return `https://arweave.net/${trimmed.slice("ar://".length)}`;
  }

  return trimmed;
};

const isBlockedMarketplaceOverlayUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    const isOpenSeaWebHost =
      matchesDomainOrSubdomain(host, "opensea.io") ||
      matchesDomainOrSubdomain(host, "testnets.opensea.io");
    return isOpenSeaWebHost && path.includes("opengraph");
  } catch {
    return false;
  }
};

const resolveOpenSeaImage = (
  metadata: AlchemyNftMetadata
): ResolvedOpenSeaImage | null => {
  for (const source of OPEN_SEA_IMAGE_CANDIDATE_SOURCES) {
    const value = OPEN_SEA_IMAGE_SOURCE_READERS[source](metadata);
    if (!value) {
      continue;
    }

    return {
      source,
      url: normalizeMediaUrl(value),
    };
  }

  return null;
};

const buildTokenUriCandidates = (
  metadata: AlchemyNftMetadata,
  context: OpenSeaContext
): string[] => {
  const tokenUri =
    asNonEmptyString(metadata.tokenUri) ??
    asNonEmptyString(metadata.raw?.tokenUri);
  if (!tokenUri) {
    return [];
  }

  const normalizedTokenUri = normalizeMediaUrl(tokenUri);
  const tokenIdParts = getTokenIdParts(context.tokenId);

  if (!hasTokenIdPlaceholder(normalizedTokenUri) || !tokenIdParts) {
    return [normalizedTokenUri];
  }

  const usesPrefixedPlaceholder =
    TOKEN_URI_PREFIXED_PLACEHOLDER_PATTERN.test(normalizedTokenUri);
  const replacementCandidates = usesPrefixedPlaceholder
    ? [
        tokenIdParts.hex64NoPrefix,
        tokenIdParts.hexNoPrefix,
        tokenIdParts.decimal,
      ]
    : [
        tokenIdParts.decimal,
        `0x${tokenIdParts.hex64NoPrefix}`,
        `0x${tokenIdParts.hexNoPrefix}`,
        tokenIdParts.hex64NoPrefix,
        tokenIdParts.hexNoPrefix,
      ];

  const expandedCandidates: string[] = [];
  for (const replacement of replacementCandidates) {
    const expanded = normalizeMediaUrl(
      replaceTokenIdPlaceholders(normalizedTokenUri, replacement)
    );
    if (!expandedCandidates.includes(expanded)) {
      expandedCandidates.push(expanded);
    }
  }

  return expandedCandidates;
};

const extractTokenUriMetadata = (
  payload: unknown
): { metadata: TokenUriMetadata | null; topLevelKeys: string[] } => {
  const topLevelKeys = getObjectKeys(payload);
  const record = toObjectRecord(payload);
  if (!record) {
    return { metadata: null, topLevelKeys };
  }

  const nestedNft = toObjectRecord(record["nft"]);
  if (nestedNft) {
    return { metadata: nestedNft, topLevelKeys };
  }

  return { metadata: record, topLevelKeys };
};

const resolveTokenUriImage = (
  metadata: TokenUriMetadata
): ResolvedOpenSeaImage | null => {
  const sourceAndValue: Array<{
    source: OpenSeaTokenUriImageSource;
    value: unknown;
  }> = [
    {
      source: "tokenUri.image_original_url",
      value: metadata.image_original_url,
    },
    {
      source: "tokenUri.image",
      value: metadata.image,
    },
    {
      source: "tokenUri.image_url",
      value: metadata.image_url,
    },
    {
      source: "tokenUri.imageOriginalUrl",
      value: metadata.imageOriginalUrl,
    },
    {
      source: "tokenUri.imageUrl",
      value: metadata.imageUrl,
    },
  ];

  for (const { source, value } of sourceAndValue) {
    const candidate = asNonEmptyString(value);
    if (!candidate) {
      continue;
    }

    return {
      source,
      url: normalizeMediaUrl(candidate),
    };
  }

  return null;
};

const tryParseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const fetchTokenUriMetadataCandidate = async (
  candidateUrl: URL,
  deps: CreateOpenSeaPlanDeps
): Promise<TokenUriMetadata | null> => {
  try {
    await deps.assertPublicUrl(candidateUrl);
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    TOKEN_URI_FETCH_TIMEOUT_MS
  );

  let response: Response;
  try {
    response = await fetch(candidateUrl.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return null;
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    return null;
  }

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    return null;
  }

  return extractTokenUriMetadata(payload).metadata;
};

async function resolveTokenUriFallbackImage(
  metadata: AlchemyNftMetadata,
  context: OpenSeaContext,
  deps: CreateOpenSeaPlanDeps
): Promise<{ image: ResolvedOpenSeaImage; metadata: TokenUriMetadata } | null> {
  const tokenUriCandidates = buildTokenUriCandidates(metadata, context);
  if (tokenUriCandidates.length === 0) {
    return null;
  }

  for (const candidate of tokenUriCandidates) {
    const candidateUrl = tryParseUrl(candidate);
    if (!candidateUrl) {
      continue;
    }

    const tokenUriMetadata = await fetchTokenUriMetadataCandidate(
      candidateUrl,
      deps
    );
    if (!tokenUriMetadata) {
      continue;
    }

    const resolvedImage = resolveTokenUriImage(tokenUriMetadata);
    if (!resolvedImage || isBlockedMarketplaceOverlayUrl(resolvedImage.url)) {
      continue;
    }

    return {
      image: resolvedImage,
      metadata: tokenUriMetadata,
    };
  }

  return null;
}

const resolveOpenSeaTitle = (
  metadata: AlchemyNftMetadata,
  context: OpenSeaContext
): string => {
  const tokenName =
    asNonEmptyString(metadata.raw?.metadata?.name) ??
    asNonEmptyString(metadata.name) ??
    asNonEmptyString(metadata.title);
  const collectionName =
    asNonEmptyString(metadata.collection?.name) ??
    asNonEmptyString(metadata.contract?.name);

  if (tokenName) {
    return tokenName;
  }

  if (collectionName) {
    return `${collectionName} #${context.tokenId}`;
  }

  return `NFT #${context.tokenId}`;
};

const resolveOpenSeaDescription = (
  metadata: AlchemyNftMetadata
): string | undefined =>
  asNonEmptyString(metadata.metadata?.description) ??
  asNonEmptyString(metadata.rawMetadata?.description) ??
  asNonEmptyString(metadata.raw?.metadata?.description) ??
  asNonEmptyString(metadata.description);

const buildPreviewImageEntry = (
  image: { url: string; type?: string | undefined } | null
): { url: string; type?: string | undefined } | null => {
  if (!image?.url) {
    return null;
  }

  if (image.type) {
    return { url: image.url, type: image.type };
  }

  return { url: image.url };
};

const buildOpenSeaPreviewPayload = (
  requestUrl: URL,
  context: OpenSeaContext,
  metadata: AlchemyNftMetadata | undefined,
  image: { url: string; type?: string | undefined } | null
): LinkPreviewResponse => {
  const title = metadata
    ? resolveOpenSeaTitle(metadata, context)
    : `NFT #${context.tokenId}`;
  const description = metadata
    ? resolveOpenSeaDescription(metadata)
    : undefined;
  const imageEntry = buildPreviewImageEntry(image);

  return {
    type: "opensea.nft",
    requestUrl: requestUrl.toString(),
    url: requestUrl.toString(),
    title,
    description,
    siteName: "OpenSea",
    mediaType: "website",
    contentType: null,
    image: imageEntry,
    images: imageEntry ? [imageEntry] : [],
  };
};

const resolveOpenGraphImage = (
  preview: LinkPreviewResponse
): { url: string; type?: string | undefined } | null => {
  const primaryImage = preview.image;
  const fallbackImage = preview.images?.[0];
  const imageUrl =
    asNonEmptyString(primaryImage?.url) ??
    asNonEmptyString(primaryImage?.secureUrl) ??
    asNonEmptyString(fallbackImage?.url) ??
    asNonEmptyString(fallbackImage?.secureUrl);
  if (!imageUrl) {
    return null;
  }

  const imageType =
    asNonEmptyString(primaryImage?.type) ??
    asNonEmptyString(fallbackImage?.type);

  if (imageType) {
    return {
      url: normalizeMediaUrl(imageUrl),
      type: imageType,
    };
  }

  return {
    url: normalizeMediaUrl(imageUrl),
  };
};

async function buildOpenSeaOpenGraphFallbackPreview(
  requestUrl: URL,
  context: OpenSeaContext,
  deps: CreateOpenSeaPlanDeps,
  metadata?: AlchemyNftMetadata
): Promise<LinkPreviewResponse | null> {
  let htmlResult: Awaited<ReturnType<CreateOpenSeaPlanDeps["fetchHtml"]>>;
  try {
    htmlResult = await deps.fetchHtml(requestUrl);
  } catch {
    return null;
  }

  let finalUrl: URL;
  try {
    finalUrl = new URL(htmlResult.finalUrl);
    await deps.assertPublicUrl(finalUrl);
  } catch {
    return null;
  }

  const openGraphPreview = buildResponse(
    finalUrl,
    htmlResult.html,
    htmlResult.contentType,
    htmlResult.finalUrl
  );

  const openGraphTitle = asNonEmptyString(openGraphPreview.title);
  const openGraphDescription = asNonEmptyString(openGraphPreview.description);
  const openGraphImageEntry = buildPreviewImageEntry(
    resolveOpenGraphImage(openGraphPreview)
  );
  if (!openGraphTitle && !openGraphDescription && !openGraphImageEntry) {
    return null;
  }

  const basePreview = buildOpenSeaPreviewPayload(
    requestUrl,
    context,
    metadata,
    null
  );

  return {
    ...basePreview,
    url: asNonEmptyString(openGraphPreview.url) ?? basePreview.url,
    title: openGraphTitle ?? basePreview.title,
    description: openGraphDescription ?? basePreview.description,
    contentType: openGraphPreview.contentType ?? basePreview.contentType,
    image: openGraphImageEntry ?? basePreview.image,
    images: openGraphImageEntry ? [openGraphImageEntry] : basePreview.images,
  };
}

async function fetchOpenSeaNftMetadata(
  context: OpenSeaContext
): Promise<OpenSeaMetadataFetchResult> {
  const network = ALCHEMY_NETWORK_BY_OPENSEA_CHAIN[context.chainSegment];
  if (!network) {
    return {
      kind: "fallback",
      reason: "unsupported_chain",
    };
  }

  let apiKey: string;
  try {
    apiKey = getAlchemyApiKey();
  } catch {
    return {
      kind: "fallback",
      reason: "missing_api_key",
    };
  }

  const tokenIdCandidates = buildTokenIdCandidates(context.tokenId);
  let lastHttpStatus: number | undefined;
  let lastHttpTokenId: string | undefined;
  let lastJsonError: string | undefined;
  let lastJsonTokenId: string | undefined;
  let lastTopLevelKeys: string[] = [];

  for (const tokenIdCandidate of tokenIdCandidates) {
    const candidateResult = await fetchAlchemyMetadataCandidate(
      network,
      apiKey,
      context.contractAddress,
      tokenIdCandidate
    );

    if (candidateResult.kind === "success") {
      return {
        kind: "success",
        metadata: candidateResult.metadata,
        network,
        requestedTokenId: tokenIdCandidate,
        payloadTopLevelKeys: candidateResult.topLevelKeys,
      };
    }

    if (candidateResult.kind === "http_error") {
      lastHttpStatus = candidateResult.status;
      lastHttpTokenId = tokenIdCandidate;
      continue;
    }

    if (candidateResult.kind === "json_error") {
      lastJsonError = candidateResult.errorMessage;
      lastJsonTokenId = tokenIdCandidate;
      continue;
    }

    if (candidateResult.kind === "metadata_missing") {
      lastTopLevelKeys = candidateResult.topLevelKeys;
      continue;
    }

    return {
      kind: "fallback",
      reason: "unexpected_error",
      network,
      requestedTokenId: tokenIdCandidate,
      errorMessage: candidateResult.errorMessage,
    };
  }

  if (lastHttpStatus !== undefined) {
    return {
      kind: "fallback",
      reason: "alchemy_http_error",
      network,
      status: lastHttpStatus,
      requestedTokenId: lastHttpTokenId,
    };
  }

  if (lastJsonError) {
    return {
      kind: "fallback",
      reason: "alchemy_json_error",
      network,
      requestedTokenId: lastJsonTokenId,
      errorMessage: lastJsonError,
    };
  }

  return {
    kind: "fallback",
    reason: "no_image_candidate",
    network,
    requestedTokenId: tokenIdCandidates.at(-1),
    errorMessage:
      lastTopLevelKeys.length > 0
        ? `metadata_not_found_in_payload:${lastTopLevelKeys.join(",")}`
        : "metadata_not_found_in_payload",
  };
}

async function buildOpenSeaPreview(
  requestUrl: URL,
  context: OpenSeaContext,
  deps: CreateOpenSeaPlanDeps
): Promise<OpenSeaPreviewBuildResult> {
  try {
    const metadataResult = await fetchOpenSeaNftMetadata(context);
    if (metadataResult.kind === "fallback") {
      const openGraphFallbackPreview =
        await buildOpenSeaOpenGraphFallbackPreview(requestUrl, context, deps);

      return {
        kind: "fallback",
        reason: metadataResult.reason,
        details: {
          network: metadataResult.network,
          requestedTokenId: metadataResult.requestedTokenId,
          status: metadataResult.status,
          errorMessage: metadataResult.errorMessage,
        },
        preview: openGraphFallbackPreview ?? undefined,
      };
    }

    const metadata = metadataResult.metadata;
    const resolvedImage = resolveOpenSeaImage(metadata);
    if (!resolvedImage) {
      const tokenUriFallback = await resolveTokenUriFallbackImage(
        metadata,
        context,
        deps
      );
      if (tokenUriFallback) {
        return {
          kind: "success",
          preview: buildOpenSeaPreviewPayload(requestUrl, context, metadata, {
            url: tokenUriFallback.image.url,
          }),
        };
      }

      const openGraphFallbackPreview =
        await buildOpenSeaOpenGraphFallbackPreview(
          requestUrl,
          context,
          deps,
          metadata
        );

      return {
        kind: "fallback",
        reason: "no_image_candidate",
        details: {
          candidatesChecked: OPEN_SEA_IMAGE_CANDIDATE_SOURCES,
          requestedTokenId: metadataResult.requestedTokenId,
          payloadTopLevelKeys: metadataResult.payloadTopLevelKeys,
        },
        preview:
          openGraphFallbackPreview ??
          buildOpenSeaPreviewPayload(requestUrl, context, metadata, null),
      };
    }

    if (isBlockedMarketplaceOverlayUrl(resolvedImage.url)) {
      const openGraphFallbackPreview =
        await buildOpenSeaOpenGraphFallbackPreview(
          requestUrl,
          context,
          deps,
          metadata
        );

      return {
        kind: "fallback",
        reason: "no_image_candidate",
        details: {
          blockedImageUrl: truncateForLog(resolvedImage.url),
          blockedImageSource: resolvedImage.source,
        },
        preview:
          openGraphFallbackPreview ??
          buildOpenSeaPreviewPayload(requestUrl, context, metadata, null),
      };
    }

    const imageType = asNonEmptyString(metadata.image?.contentType);
    return {
      kind: "success",
      preview: buildOpenSeaPreviewPayload(requestUrl, context, metadata, {
        url: resolvedImage.url,
        type: imageType,
      }),
    };
  } catch (error) {
    return {
      kind: "fallback",
      reason: "unexpected_error",
      details: {
        errorMessage: error instanceof Error ? error.message : "unknown",
      },
    };
  }
}

export function createOpenSeaPlan(
  url: URL,
  deps: CreateOpenSeaPlanDeps
): PreviewPlan | null {
  const requestContext = extractOpenSeaContext(url);
  if (!requestContext) {
    return null;
  }

  return {
    cacheKey: `opensea:nft:v3:${url.toString()}`,
    execute: async () => {
      const requestId = createRequestId();
      const openSeaPreview = await buildOpenSeaPreview(
        url,
        requestContext,
        deps
      );
      if (openSeaPreview.kind === "success") {
        return { data: openSeaPreview.preview, ttl: OPENSEA_CACHE_TTL_MS };
      }

      logFallback(
        requestId,
        url,
        openSeaPreview.reason,
        openSeaPreview.details
      );
      if (openSeaPreview.preview) {
        return { data: openSeaPreview.preview, ttl: OPENSEA_CACHE_TTL_MS };
      }
      const fallbackPreview = buildOpenSeaPreviewPayload(
        url,
        requestContext,
        undefined,
        null
      );
      return { data: fallbackPreview, ttl: OPENSEA_CACHE_TTL_MS };
    },
  };
}
