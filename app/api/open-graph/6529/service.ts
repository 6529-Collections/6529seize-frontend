import { createHash } from "node:crypto";

import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import type { PreviewPlan } from "@/app/api/open-graph/compound/service";
import {
  MANIFOLD_LAZY_CLAIM_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "@/constants/constants";
import { publicEnv } from "@/config/env";
import type {
  BaseNFT,
  LabExtendedData,
  LabNFT,
  NFT,
  Rememe,
} from "@/entities/INFT";
import type {
  NextGenCollection,
  NextGenToken,
  NextGenTrait,
} from "@/entities/INextgen";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";
import type {
  LinkPreviewMedia,
  SeizeCollectionLinkPreview,
  SeizeCollectionPreviewFact,
  SeizeCollectionPreviewKind,
  SeizeCollectionPreviewPerson,
  SeizeCollectionPreviewTrait,
} from "@/services/api/link-preview-api";
import { createPublicClient, fallback, http } from "viem";
import { mainnet } from "viem/chains";

const CACHE_TTL_MS = 5 * 60 * 1000;
const FIRST_PARTY_HOST = "6529.io";
const PUBLIC_API_BASE = "https://api.6529.io";
const MAINNET_RPC_TIMEOUT_MS = 5_000;
const NEXTGEN_TOKEN_ID_MULTIPLIER = 10_000_000_000;
const NEXTGEN_SHORT_TOKEN_LOOKUP_MAX_COLLECTIONS = 5;

const mainnetPublicClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http("https://rpc1.6529.io", { timeout: MAINNET_RPC_TIMEOUT_MS }),
    http("https://ethereum.publicnode.com", {
      timeout: MAINNET_RPC_TIMEOUT_MS,
    }),
  ]),
});

type ApiContext = {
  readonly apiAuth?: string | null | undefined;
};

type ApiPage<T> = {
  readonly data?: readonly T[] | null | undefined;
};

type NftRecord = Partial<BaseNFT> &
  Partial<NFT> &
  Partial<LabNFT> & {
    readonly edition_size_floor?: number | null | undefined;
    readonly owner?: string | null | undefined;
    readonly owner_display?: string | null | undefined;
  };

type MemesRecord = NftRecord & Partial<ApiMemesExtendedData>;
type LabRecord = NftRecord & Partial<LabExtendedData>;

type MintingClaimRecord = {
  readonly name?: string | null | undefined;
  readonly image_url?: string | null | undefined;
  readonly attributes?: readonly AttributeRecord[] | null | undefined;
};

type AttributeRecord = {
  readonly trait_type?: string | null | undefined;
  readonly value?: string | number | null | undefined;
};

type ResolvedTarget =
  | { readonly kind: "the-memes"; readonly id: string }
  | { readonly kind: "meme-lab"; readonly id: string }
  | { readonly kind: "6529-gradient"; readonly id: string }
  | { readonly kind: "nextgen-token"; readonly tokenId: string }
  | {
      readonly kind: "rememes";
      readonly contract: string;
      readonly id: string;
    };

type PreviewBuildInput = {
  readonly kind: SeizeCollectionPreviewKind;
  readonly requestUrl: URL;
  readonly title: string;
  readonly kicker?: string | null | undefined;
  readonly people?: readonly SeizeCollectionPreviewPerson[] | undefined;
  readonly facts?: readonly SeizeCollectionPreviewFact[] | undefined;
  readonly traits?: readonly SeizeCollectionPreviewTrait[] | undefined;
  readonly imageUrl?: string | null | undefined;
};

type IdentityResponse = {
  readonly handle?: string | null | undefined;
  readonly normalised_handle?: string | null | undefined;
  readonly display?: string | null | undefined;
  readonly primary_wallet?: string | null | undefined;
};

function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") {
    end -= 1;
  }

  return value.slice(0, end);
}

function trimLeadingSlashes(value: string): string {
  let start = 0;
  while (start < value.length && value[start] === "/") {
    start += 1;
  }

  return value.slice(start);
}

function getApiBase(): string {
  const base = publicEnv.API_ENDPOINT?.trim();
  if (!base) {
    throw new Error("API endpoint is not configured.");
  }
  return trimTrailingSlashes(base);
}

function buildApiUrl(
  base: string,
  endpoint: string,
  params?: Record<string, string | number | undefined>
): string {
  const url = new URL(`/api/${trimLeadingSlashes(endpoint)}`, `${base}/`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

function normalizeApiOrigin(base: string): string {
  try {
    const url = new URL(`${trimTrailingSlashes(base)}/`);
    return url.origin.toLowerCase();
  } catch {
    return trimTrailingSlashes(base).toLowerCase();
  }
}

function getApiBases(): readonly string[] {
  const primary = getApiBase();
  if (normalizeApiOrigin(primary) === normalizeApiOrigin(PUBLIC_API_BASE)) {
    return [primary];
  }

  return [primary, PUBLIC_API_BASE];
}

function getCallerApiAuth(context?: ApiContext): string | undefined {
  const apiAuth = context?.apiAuth?.trim();
  return apiAuth || undefined;
}

function getApiAuth(context?: ApiContext): string | undefined {
  return (
    getCallerApiAuth(context) ?? publicEnv.STAGING_API_KEY?.trim() ?? undefined
  );
}

function hashCacheToken(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 24);
}

function getCacheAuthScope(context?: ApiContext): string {
  const callerAuth = getCallerApiAuth(context);
  if (callerAuth) {
    return `auth:${hashCacheToken(callerAuth)}`;
  }

  return publicEnv.STAGING_API_KEY?.trim() ? "staging" : "public";
}

function createApiHeaders(context?: ApiContext): HeadersInit {
  const headers: Record<string, string> = {
    accept: "application/json",
  };
  const apiAuth = getApiAuth(context);

  if (apiAuth) {
    headers["x-6529-auth"] = apiAuth;
  }

  return headers;
}

const PUBLIC_API_HEADERS: HeadersInit = {
  accept: "application/json",
};

function hasApiAuth(context?: ApiContext): boolean {
  return getApiAuth(context) !== undefined;
}

function shouldRetryApiStatus(status: number, context?: ApiContext): boolean {
  if (status >= 500 && status < 600) {
    return true;
  }

  return (status === 401 || status === 403) && !hasApiAuth(context);
}

async function getApiFetch(): Promise<typeof fetch> {
  if (typeof window !== "undefined") {
    return fetch;
  }

  try {
    const { ssrFetch } = await import("@/lib/fetch/ssrFetch");
    return ssrFetch;
  } catch {
    // Preview enrichment should degrade to public API data if server signing is unavailable.
    return fetch;
  }
}

async function fetchApiJson<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
  context?: ApiContext
): Promise<T> {
  const fetchImpl = await getApiFetch();
  const bases = getApiBases();
  let lastStatus: number | undefined;
  let primaryStatus: number | undefined;
  let lastError: unknown;

  for (const [index, base] of bases.entries()) {
    try {
      const response = await fetchImpl(buildApiUrl(base, endpoint, params), {
        headers: index === 0 ? createApiHeaders(context) : PUBLIC_API_HEADERS,
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      lastStatus = response.status;
      if (index === 0) {
        primaryStatus = response.status;
      }

      if (!shouldRetryApiStatus(response.status, context)) {
        break;
      }
    } catch (error) {
      lastError = error;
    }
  }

  const status = primaryStatus ?? lastStatus;
  if (status !== undefined) {
    throw new Error(`6529 API request failed with status ${status}.`);
  }

  throw new Error("6529 API request failed.", {
    cause: lastError,
  });
}

async function fetchOptionalApiJson<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
  context?: ApiContext
): Promise<T | null> {
  try {
    return await fetchApiJson<T>(endpoint, params, context);
  } catch {
    return null;
  }
}

async function fetchFirstPageItem<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
  context?: ApiContext
): Promise<T | null> {
  const page = await fetchOptionalApiJson<ApiPage<T>>(
    endpoint,
    params,
    context
  );
  return page?.data?.[0] ?? null;
}

function isFirstPartyHost(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  if (matchesDomainOrSubdomain(hostname, FIRST_PARTY_HOST)) {
    return true;
  }

  if (!publicEnv.BASE_ENDPOINT) {
    return false;
  }

  try {
    return new URL(publicEnv.BASE_ENDPOINT).hostname.toLowerCase() === hostname;
  } catch {
    return false;
  }
}

function readNumericPathSegment(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized && /^\d+$/.test(normalized) ? normalized : null;
}

function readContractSegment(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized && /^0x[a-f0-9]{40}$/i.test(normalized) ? normalized : null;
}

function resolveTarget(url: URL): ResolvedTarget | null {
  if (!isFirstPartyHost(url)) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const [root, first, second] = segments;

  if (root === "the-memes") {
    const id = readNumericPathSegment(first);
    return id ? { kind: "the-memes", id } : null;
  }

  if (root === "meme-lab") {
    const id = readNumericPathSegment(first);
    return id ? { kind: "meme-lab", id } : null;
  }

  if (root === "6529-gradient") {
    const id = readNumericPathSegment(first);
    return id ? { kind: "6529-gradient", id } : null;
  }

  if (root === "nextgen" && first === "token") {
    const tokenId = readNumericPathSegment(second);
    return tokenId ? { kind: "nextgen-token", tokenId } : null;
  }

  if (root === "rememes") {
    const contract = readContractSegment(first);
    const id = readNumericPathSegment(second);
    return contract && id ? { kind: "rememes", contract, id } : null;
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function parseMetadata(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }

  return asRecord(value);
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function readNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readPositiveNumber(value: unknown): number | undefined {
  const parsed = readNumber(value);
  return parsed !== undefined && parsed > 0 ? parsed : undefined;
}

function readTheMemesTdhRateValue(
  hodlRate: unknown,
  recordedInTdh: boolean | null | undefined
): string | undefined {
  if (recordedInTdh === false) {
    return "Pending";
  }

  const tdhRate = readPositiveNumber(hodlRate);
  if (tdhRate === undefined) {
    return undefined;
  }
  return formatDecimal(tdhRate);
}

function readMetadataString(
  metadata: Record<string, unknown> | null,
  key: string
): string | undefined {
  return metadata ? readString(metadata[key]) : undefined;
}

function readAttributes(
  metadata: Record<string, unknown> | null
): readonly AttributeRecord[] {
  const attributes = metadata?.["attributes"];
  return Array.isArray(attributes) ? (attributes as AttributeRecord[]) : [];
}

function normalizeTraitType(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replaceAll(/\s+/g, " ");
}

function readAttributeValue(
  attributes: readonly AttributeRecord[],
  traitType: string
): string | undefined {
  const normalizedTrait = normalizeTraitType(traitType);
  const match = attributes.find(
    (attribute) => normalizeTraitType(attribute.trait_type) === normalizedTrait
  );

  return readString(match?.value);
}

function firstNonEmptyString(
  ...values: readonly unknown[]
): string | undefined {
  for (const value of values) {
    const stringValue = readString(value);
    if (stringValue) {
      return stringValue;
    }
  }

  return undefined;
}

function firstPositiveNumber(
  ...values: readonly unknown[]
): number | undefined {
  for (const value of values) {
    const numberValue = readPositiveNumber(value);
    if (numberValue !== undefined) {
      return numberValue;
    }
  }

  return undefined;
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMintDate(value: unknown): string | undefined {
  const raw = readString(value);
  if (!raw) {
    return undefined;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function createFact(
  label: string,
  value: string | number | undefined
): SeizeCollectionPreviewFact | null {
  const stringValue = readString(value);
  return stringValue ? { label, value: stringValue } : null;
}

function compactFacts(
  facts: readonly (SeizeCollectionPreviewFact | null | undefined)[]
): SeizeCollectionPreviewFact[] {
  return facts.filter(
    (fact): fact is SeizeCollectionPreviewFact =>
      fact !== null && fact !== undefined
  );
}

function normalizeHttpsImageUrl(value: unknown): string | undefined {
  const url = readString(value);
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url, "https://6529.io");
    return parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

function selectHttpsImageUrl(
  ...values: readonly unknown[]
): string | undefined {
  for (const value of values) {
    const url = normalizeHttpsImageUrl(value);
    if (url) {
      return url;
    }
  }

  return undefined;
}

function createImageMedia(url: string | undefined): LinkPreviewMedia | null {
  const normalizedUrl = normalizeHttpsImageUrl(url);
  return normalizedUrl
    ? { url: normalizedUrl, secureUrl: normalizedUrl }
    : null;
}

function buildPreview(input: PreviewBuildInput): SeizeCollectionLinkPreview {
  const image = createImageMedia(input.imageUrl ?? undefined);
  const descriptionParts = [
    input.kicker,
    ...(input.people ?? []).map((person) =>
      person.label ? `${person.label} ${person.name}` : person.name
    ),
    ...(input.facts ?? []).map((fact) => `${fact.label} ${fact.value}`),
  ].filter((part): part is string => Boolean(part));

  return {
    type: "6529.collection",
    kind: input.kind,
    requestUrl: input.requestUrl.toString(),
    url: input.requestUrl.toString(),
    title: input.title,
    description:
      descriptionParts.length > 0 ? descriptionParts.join(" | ") : null,
    siteName: "6529",
    mediaType: null,
    contentType: null,
    favicon: null,
    favicons: [],
    image,
    images: image ? [image] : [],
    kicker: input.kicker ?? null,
    people: input.people ?? [],
    facts: input.facts ?? [],
    traits: input.traits ?? [],
  };
}

function firstHandle(value: string | null | undefined): string | undefined {
  return value
    ?.split(",")
    .map((handle) => handle.trim().replace(/^@/, ""))
    .find((handle) => handle.length > 0);
}

function profileHrefForHandle(
  value: string | null | undefined
): string | undefined {
  const handle = firstHandle(value);
  return handle ? `/${handle}` : undefined;
}

function createPerson({
  label,
  name,
  href,
}: {
  readonly label?: string | null | undefined;
  readonly name?: string | null | undefined;
  readonly href?: string | null | undefined;
}): SeizeCollectionPreviewPerson | null {
  const displayName = readString(name);
  if (!displayName) {
    return null;
  }

  const normalizedHref = readString(href);

  return {
    ...(label ? { label } : {}),
    name: displayName,
    ...(normalizedHref ? { href: normalizedHref } : {}),
  };
}

function compactPeople(
  people: readonly (SeizeCollectionPreviewPerson | null | undefined)[]
): SeizeCollectionPreviewPerson[] {
  return people.filter(
    (person): person is SeizeCollectionPreviewPerson =>
      person !== null && person !== undefined
  );
}

function profileLookupCandidate(value: unknown): string | null {
  const normalized = readString(value)?.replace(/^@/, "");
  if (!normalized || normalized.includes(",") || normalized.includes(" ")) {
    return null;
  }

  return normalized;
}

function identityProfileHandle(
  profile: IdentityResponse | null | undefined
): string | undefined {
  return firstNonEmptyString(profile?.handle, profile?.normalised_handle);
}

function identityProfileHref(
  profile: IdentityResponse | null | undefined
): string | undefined {
  const handle = identityProfileHandle(profile);
  return handle ? `/${handle.replace(/^@/, "")}` : undefined;
}

function identityProfileDisplay(
  profile: IdentityResponse | null | undefined
): string | undefined {
  return firstNonEmptyString(
    profile?.display,
    profile?.handle,
    profile?.normalised_handle
  );
}

async function resolveProfileHref(
  value: unknown,
  context?: ApiContext
): Promise<string | undefined> {
  const candidate = profileLookupCandidate(value);
  if (!candidate) {
    return undefined;
  }

  const profile = await resolveIdentityProfile(candidate, context);
  return identityProfileHref(profile);
}

async function resolveIdentityProfile(
  value: unknown,
  context?: ApiContext
): Promise<IdentityResponse | null> {
  const candidate = profileLookupCandidate(value);
  if (!candidate) {
    return null;
  }

  return await fetchOptionalApiJson<IdentityResponse>(
    `identities/${encodeURIComponent(candidate.toLowerCase())}`,
    undefined,
    context
  );
}

function readMemeSeason(
  nft: MemesRecord,
  metadata: Record<string, unknown> | null
): number | undefined {
  return firstPositiveNumber(
    nft.season,
    readAttributeValue(readAttributes(metadata), "Type - Season")
  );
}

function readFinalizedMemeEditionSize(
  source: MemesRecord,
  extended: MemesRecord | null
): number | undefined {
  const actualEditionSize = firstPositiveNumber(
    extended?.edition_size,
    source.supply
  );
  const editionSizeFloor = readPositiveNumber(source.edition_size_floor);

  if (actualEditionSize === undefined) {
    return editionSizeFloor;
  }
  if (editionSizeFloor === undefined) {
    return actualEditionSize;
  }
  return Math.max(actualEditionSize, editionSizeFloor);
}

function readManifoldClaimTotalMax(data: unknown): number | undefined {
  if (Array.isArray(data)) {
    return readPositiveNumber(asRecord(data[1])?.["totalMax"]);
  }

  const dataRecord = asRecord(data);
  const claim = asRecord(dataRecord?.["claim"] ?? data);
  return readPositiveNumber(claim?.["totalMax"]);
}

async function fetchTheMemesManifoldEditionSize(
  id: string
): Promise<number | undefined> {
  const decimalTokenId = readNumericPathSegment(id);
  if (!decimalTokenId) {
    return undefined;
  }

  const tokenId = BigInt(decimalTokenId);

  try {
    const data = await mainnetPublicClient.readContract({
      address: MANIFOLD_LAZY_CLAIM_CONTRACT,
      abi: MEMES_MANIFOLD_PROXY_ABI,
      functionName: "getClaimForToken",
      args: [MEMES_CONTRACT, tokenId],
    });

    return readManifoldClaimTotalMax(data);
  } catch {
    return undefined;
  }
}

async function fetchTheMemesPreview(
  id: string,
  requestUrl: URL,
  context?: ApiContext
): Promise<SeizeCollectionLinkPreview> {
  const [nft, extended, claim] = await Promise.all([
    fetchFirstPageItem<MemesRecord>(
      "nfts",
      { contract: MEMES_CONTRACT, id },
      context
    ),
    fetchFirstPageItem<MemesRecord>("memes_extended_data", { id }, context),
    fetchOptionalApiJson<MintingClaimRecord>(
      `minting-claims/${encodeURIComponent(MEMES_CONTRACT)}/claims/${id}`,
      undefined,
      context
    ),
  ]);

  const source = nft ?? extended;
  if (!source) {
    throw new Error("The Memes card was not found.");
  }

  const metadata = parseMetadata(source.metadata);
  const attributes = readAttributes(metadata);
  const explicitArtistHandle = firstNonEmptyString(
    source.artist_seize_handle,
    readAttributeValue(attributes, "SEIZE Artist Profile")
  );
  const title = firstNonEmptyString(
    claim?.name,
    source.name,
    `The Memes #${id}`
  )!;
  const isLiveMeme = extended?.recorded_in_tdh === false;
  const manifoldEditionSize = isLiveMeme
    ? await fetchTheMemesManifoldEditionSize(id)
    : undefined;
  const finalizedEditionSize = readFinalizedMemeEditionSize(source, extended);
  const editionSize = isLiveMeme ? manifoldEditionSize : finalizedEditionSize;
  const season = readMemeSeason(source, metadata);
  const tdhRateValue = readTheMemesTdhRateValue(
    source.hodl_rate,
    extended?.recorded_in_tdh
  );
  const mintDate = formatMintDate(source.mint_date);
  const artistName = firstNonEmptyString(
    explicitArtistHandle,
    source.artist,
    readAttributeValue(attributes, "Artist")
  );

  return buildPreview({
    kind: "the-memes",
    requestUrl,
    title,
    kicker: `The Memes #${id}`,
    people: compactPeople([
      createPerson({
        label: "by",
        name: artistName,
        href: profileHrefForHandle(explicitArtistHandle),
      }),
    ]),
    facts: compactFacts([
      createFact(
        "Edition size",
        editionSize !== undefined ? formatInteger(editionSize) : undefined
      ),
      createFact("TDH rate", tdhRateValue),
      createFact(
        "Season",
        season !== undefined ? formatInteger(season) : undefined
      ),
      createFact("Mint date", mintDate),
    ]),
    imageUrl: selectHttpsImageUrl(
      source.thumbnail,
      source.scaled,
      source.image,
      claim?.image_url,
      readMetadataString(metadata, "image_url"),
      readMetadataString(metadata, "image")
    ),
  });
}

async function fetchMemeLabPreview(
  id: string,
  requestUrl: URL,
  context?: ApiContext
): Promise<SeizeCollectionLinkPreview> {
  const [nft, extended] = await Promise.all([
    fetchFirstPageItem<LabRecord>(
      "nfts_memelab",
      { contract: MEMELAB_CONTRACT, id },
      context
    ),
    fetchFirstPageItem<LabRecord>("lab_extended_data", { id }, context),
  ]);

  const source = nft ?? extended;
  if (!source) {
    throw new Error("Meme Lab card was not found.");
  }

  const metadata = parseMetadata(source.metadata);
  const attributes = readAttributes(metadata);
  const artistHandle = firstNonEmptyString(
    source.artist_seize_handle,
    readAttributeValue(attributes, "SEIZE Artist Profile")
  );
  const artistName = firstNonEmptyString(artistHandle, source.artist);
  const editionSize = firstPositiveNumber(
    extended?.edition_size,
    source.supply
  );
  const mintDate = formatMintDate(source.mint_date);

  return buildPreview({
    kind: "meme-lab",
    requestUrl,
    title: firstNonEmptyString(source.name, `Meme Lab #${id}`)!,
    kicker: `Meme Lab #${id}`,
    people: compactPeople([
      createPerson({
        label: "by",
        name: artistName,
        href: profileHrefForHandle(artistHandle),
      }),
    ]),
    facts: compactFacts([
      createFact(
        "Edition size",
        editionSize !== undefined ? formatInteger(editionSize) : undefined
      ),
      createFact("Mint date", mintDate),
    ]),
    imageUrl: selectHttpsImageUrl(
      source.thumbnail,
      source.scaled,
      source.image,
      readMetadataString(metadata, "image_url"),
      readMetadataString(metadata, "image")
    ),
  });
}

async function fetchGradientPreview(
  id: string,
  requestUrl: URL,
  context?: ApiContext
): Promise<SeizeCollectionLinkPreview> {
  const nft = await fetchFirstPageItem<NftRecord>(
    "nfts/gradients",
    { id, page_size: 1 },
    context
  );

  if (!nft) {
    throw new Error("6529 Gradient was not found.");
  }

  const metadata = parseMetadata(nft.metadata);
  const artistHandle = firstHandle(nft.artist_seize_handle);
  const ownerDisplay = readString(nft.owner_display);
  const collectorHref = await resolveProfileHref(
    firstNonEmptyString(ownerDisplay, nft.owner),
    context
  );
  const tdhRate = readPositiveNumber(nft.hodl_rate);
  const mintDate = formatMintDate(nft.mint_date);

  return buildPreview({
    kind: "6529-gradient",
    requestUrl,
    title: firstNonEmptyString(nft.name, `6529 Gradient #${id}`)!,
    people: compactPeople([
      createPerson({
        label: "Artist",
        name: firstNonEmptyString(artistHandle, nft.artist),
        href: profileHrefForHandle(artistHandle),
      }),
      createPerson({
        label: "Collector",
        name: ownerDisplay,
        href: collectorHref,
      }),
    ]),
    facts: compactFacts([
      createFact(
        "TDH rate",
        tdhRate !== undefined ? formatDecimal(tdhRate) : undefined
      ),
      createFact("Mint date", mintDate),
    ]),
    imageUrl: selectHttpsImageUrl(
      nft.thumbnail,
      nft.scaled,
      nft.image,
      readMetadataString(metadata, "image")
    ),
  });
}

function sortNextGenTraits(
  traits: readonly NextGenTrait[]
): readonly NextGenTrait[] {
  return [...traits]
    .filter((trait) => {
      const traitName = trait.trait?.trim();
      const value = trait.value?.trim();
      return (
        traitName &&
        value &&
        traitName.toLowerCase() !== "collection name" &&
        value.toLowerCase() !== "none"
      );
    })
    .sort((left, right) => {
      const valueCountDelta =
        (left.value_count || Number.MAX_SAFE_INTEGER) -
        (right.value_count || Number.MAX_SAFE_INTEGER);
      if (valueCountDelta !== 0) {
        return valueCountDelta;
      }

      return (
        (left.trait_count || Number.MAX_SAFE_INTEGER) -
        (right.trait_count || Number.MAX_SAFE_INTEGER)
      );
    });
}

async function fetchNextGenToken(
  tokenId: string,
  context?: ApiContext
): Promise<NextGenToken | null> {
  const token = await fetchOptionalApiJson<NextGenToken>(
    `nextgen/tokens/${tokenId}`,
    undefined,
    context
  );

  return token && !token.pending ? token : null;
}

async function fetchNextGenCollections(
  context?: ApiContext
): Promise<readonly NextGenCollection[]> {
  const page = await fetchOptionalApiJson<ApiPage<NextGenCollection>>(
    "nextgen/collections",
    { page_size: NEXTGEN_SHORT_TOKEN_LOOKUP_MAX_COLLECTIONS },
    context
  );

  return page?.data ?? [];
}

async function resolveNextGenToken(
  tokenId: string,
  context?: ApiContext
): Promise<NextGenToken | null> {
  const directToken = await fetchNextGenToken(tokenId, context);
  if (directToken) {
    return directToken;
  }

  const normalizedTokenId = readNumber(tokenId);
  if (
    normalizedTokenId === undefined ||
    !Number.isInteger(normalizedTokenId) ||
    normalizedTokenId < 0 ||
    normalizedTokenId >= NEXTGEN_TOKEN_ID_MULTIPLIER
  ) {
    return null;
  }

  const tokenCandidates = await Promise.all(
    (await fetchNextGenCollections(context))
      .slice(0, NEXTGEN_SHORT_TOKEN_LOOKUP_MAX_COLLECTIONS)
      .map(async (collection) => {
        const expandedTokenId =
          collection.id * NEXTGEN_TOKEN_ID_MULTIPLIER + normalizedTokenId;
        return fetchNextGenToken(String(expandedTokenId), context);
      })
  );

  return (
    tokenCandidates.find(
      (token) => token?.normalised_id === normalizedTokenId
    ) ?? null
  );
}

async function fetchNextGenPreview(
  tokenId: string,
  requestUrl: URL,
  context?: ApiContext
): Promise<SeizeCollectionLinkPreview> {
  const token = await resolveNextGenToken(tokenId, context);

  if (!token) {
    throw new Error("NextGen token was not found.");
  }

  const [traits, collection] = await Promise.all([
    fetchOptionalApiJson<NextGenTrait[]>(
      `nextgen/tokens/${token.id}/traits`,
      undefined,
      context
    ),
    fetchOptionalApiJson<NextGenCollection>(
      `nextgen/collections/${token.collection_id}`,
      undefined,
      context
    ),
  ]);
  const collectionSupply = firstPositiveNumber(
    traits?.[0]?.token_count,
    collection?.total_supply,
    collection?.final_supply_after_mint
  );
  const rarityRank = readPositiveNumber(token.rarity_score_rank);
  const mintDate = formatMintDate(token.mint_date);
  const [artistHref, collectorProfile] = await Promise.all([
    resolveProfileHref(collection?.artist, context),
    resolveIdentityProfile(readString(token.owner), context),
  ]);
  const collectorHref = identityProfileHref(collectorProfile);
  const collectorDisplay = identityProfileDisplay(collectorProfile);
  const canonicalRequestUrl = new URL(
    `/nextgen/token/${token.id}`,
    requestUrl.origin
  );

  return buildPreview({
    kind: "nextgen-token",
    requestUrl: canonicalRequestUrl,
    title: firstNonEmptyString(token.name, `NextGen #${tokenId}`)!,
    kicker: `NextGen \u00b7 ${firstNonEmptyString(collection?.name, token.collection_name, "Collection")}`,
    people: compactPeople([
      createPerson({
        label: "by",
        name: collection?.artist,
        href: artistHref,
      }),
      createPerson({
        label: "Collector",
        name: collectorDisplay,
        href: collectorHref,
      }),
    ]),
    facts: compactFacts([
      createFact(
        "Rarity",
        rarityRank !== undefined && collectionSupply !== undefined
          ? `#${formatInteger(rarityRank)} / ${formatInteger(collectionSupply)}`
          : undefined
      ),
      createFact("Mint date", mintDate),
    ]),
    traits: sortNextGenTraits(traits ?? [])
      .slice(0, 3)
      .map((trait) => ({ label: trait.trait, value: trait.value })),
    imageUrl: selectHttpsImageUrl(
      token.thumbnail_url,
      token.icon_url,
      token.image_url
    ),
  });
}

function readRememeArtist(rememe: Rememe): string | undefined {
  const metadata = parseMetadata(rememe.metadata);
  const attributes = readAttributes(metadata);
  return firstNonEmptyString(
    readAttributeValue(attributes, "SEIZE Artist Profile"),
    readAttributeValue(attributes, "Artist"),
    readAttributeValue(attributes, "ARTIST"),
    readAttributeValue(attributes, "Creator"),
    readMetadataString(metadata, "created_by"),
    rememe.added_by
  );
}

function readRememeEditionSize(rememe: Rememe): number | undefined {
  const metadata = parseMetadata(rememe.metadata);
  const attributes = readAttributes(metadata);
  const editionAttribute = attributes.find((attribute) =>
    /edition/i.test(attribute.trait_type ?? "")
  );

  return firstPositiveNumber(
    (metadata as Record<string, unknown> | null)?.["edition_size"],
    (metadata as Record<string, unknown> | null)?.["editionSize"],
    editionAttribute?.value
  );
}

async function fetchReMemesPreview(
  contract: string,
  id: string,
  requestUrl: URL,
  context?: ApiContext
): Promise<SeizeCollectionLinkPreview> {
  const rememe = await fetchFirstPageItem<Rememe>(
    "rememes",
    { contract, id },
    context
  );

  if (!rememe) {
    throw new Error("ReMeme was not found.");
  }

  const metadata = parseMetadata(rememe.metadata);
  const artist = readRememeArtist(rememe);
  const artistHref = await resolveProfileHref(artist, context);
  const references = Array.isArray(rememe.meme_references)
    ? rememe.meme_references
    : [];
  const replicasCount = Array.isArray(rememe.replicas)
    ? rememe.replicas.length
    : 0;
  const editionSize = readRememeEditionSize(rememe);
  const referenceLabels = references
    .map((reference) => `#${reference}`)
    .join(", ");
  const referencesValue =
    referenceLabels.length > 0 ? `The Memes ${referenceLabels}` : undefined;

  return buildPreview({
    kind: "rememes",
    requestUrl,
    title: firstNonEmptyString(
      readMetadataString(metadata, "name"),
      `${contract} #${id}`
    )!,
    kicker: "ReMemes",
    people: compactPeople([
      createPerson({
        label: "by",
        name: artist,
        href: artistHref,
      }),
    ]),
    facts: compactFacts([
      createFact("References", referencesValue),
      createFact(
        "Edition size",
        editionSize !== undefined ? formatInteger(editionSize) : undefined
      ),
      createFact(
        "Replicas",
        replicasCount > 1 ? formatInteger(replicasCount) : undefined
      ),
    ]),
    imageUrl: selectHttpsImageUrl(
      rememe.s3_image_thumbnail,
      rememe.s3_image_scaled,
      rememe.s3_image_original,
      rememe.image,
      readMetadataString(metadata, "image_url"),
      readMetadataString(metadata, "image")
    ),
  });
}

async function executeTarget(
  target: ResolvedTarget,
  requestUrl: URL,
  context?: ApiContext
): Promise<SeizeCollectionLinkPreview> {
  switch (target.kind) {
    case "the-memes":
      return fetchTheMemesPreview(target.id, requestUrl, context);
    case "meme-lab":
      return fetchMemeLabPreview(target.id, requestUrl, context);
    case "6529-gradient":
      return fetchGradientPreview(target.id, requestUrl, context);
    case "nextgen-token":
      return fetchNextGenPreview(target.tokenId, requestUrl, context);
    case "rememes":
      return fetchReMemesPreview(
        target.contract,
        target.id,
        requestUrl,
        context
      );
  }
}

export function createFirstParty6529Plan(
  url: URL,
  context?: ApiContext
): PreviewPlan | null {
  const target = resolveTarget(url);
  if (!target) {
    return null;
  }

  return {
    cacheKey: `6529:${getCacheAuthScope(context)}:${target.kind}:${url.pathname.toLowerCase()}`,
    execute: async () => {
      const data = await executeTarget(target, url, context);
      return { data, ttl: CACHE_TTL_MS };
    },
  };
}
