import { publicEnv } from "@/config/env";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import { getUsableText } from "@/app/api/og-metadata/_lib/imageUtils";
import {
  assertContentType,
  isJsonContentType,
  readLimitedJson,
} from "@/lib/fetch/limitedBody";

const MAX_METADATA_BYTES = 256 * 1024;
const METADATA_TIMEOUT_MS = 5_000;
const STAGING_API_ORIGIN = "https://api.staging.6529.io";
const PUBLIC_API_ORIGIN = "https://api.6529.io";
const COLLECTIONS = [
  { contract: MEMES_CONTRACT, name: "The Memes", endpoint: "nfts" },
  { contract: GRADIENT_CONTRACT, name: "6529 Gradient", endpoint: "nfts" },
  { contract: MEMELAB_CONTRACT, name: "Meme Lab", endpoint: "nfts_memelab" },
];

export interface NftCardMetadata {
  readonly title: string;
  readonly artist: string | null;
  readonly collection: string;
  readonly badge: string;
  readonly displayId: string | null;
  readonly imageUrl: string | null;
}

type JsonRecord = Record<string, unknown>;
type FetchMetadata = (path: string) => Promise<unknown>;

const asRecord = (value: unknown): JsonRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;

const text = (value: unknown, maxLength = 180): string | null =>
  typeof value === "string"
    ? (getUsableText(value)?.slice(0, maxLength) ?? null)
    : null;

const isTokenNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

async function fetchNextgenMetadata(
  id: number,
  fetchMetadata: FetchMetadata
): Promise<NftCardMetadata | null> {
  const token = asRecord(await fetchMetadata(`nextgen/tokens/${id}`));
  if (
    token === null ||
    token["pending"] === true ||
    !isTokenNumber(token["id"]) ||
    token["id"] !== id ||
    !isTokenNumber(token["collection_id"])
  ) {
    return null;
  }
  const collection = asRecord(
    await fetchMetadata(`nextgen/collections/${token["collection_id"]}`).catch(
      () => null
    )
  );
  const matchingCollection =
    collection?.["id"] === token["collection_id"] ? collection : null;
  const collectionName =
    text(matchingCollection?.["name"]) ??
    text(token["collection_name"]) ??
    "NextGen";
  const displayId = isTokenNumber(token["normalised_id"])
    ? String(token["normalised_id"])
    : null;
  return {
    title: text(token["name"]) ?? `${collectionName} #${displayId ?? id}`,
    artist: text(matchingCollection?.["artist"]),
    collection: collectionName,
    badge: "NextGen",
    displayId,
    imageUrl:
      text(token["image_url"], 8192) ?? text(token["thumbnail_url"], 8192),
  };
}

/** Resolve missing preview parameters only from the configured collection API. */
export async function fetchNftCardMetadata(
  contract: string,
  id: string,
  signal?: AbortSignal
): Promise<NftCardMetadata | null> {
  if (!/^\d{1,16}$/.test(id) || !isTokenNumber(Number(id))) return null;
  const normalizedContract = contract.toLowerCase();
  const collection = COLLECTIONS.find(
    (entry) => entry.contract.toLowerCase() === normalizedContract
  );
  const isNextgen = normalizedContract === NEXTGEN_CONTRACT.toLowerCase();
  if (collection === undefined && !isNextgen) return null;

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, METADATA_TIMEOUT_MS);
  const apiAuth = getUsableText(publicEnv.STAGING_API_KEY);
  const mayUsePublicApi =
    new URL(publicEnv.API_ENDPOINT).origin === STAGING_API_ORIGIN;
  let usePublicApi = false;
  const requestMetadata = (path: string): Promise<Response> =>
    fetch(
      `${usePublicApi ? PUBLIC_API_ORIGIN : publicEnv.API_ENDPOINT}/api/${path}`,
      {
        signal: controller.signal,
        redirect: "error",
        headers: {
          Accept: "application/json",
          ...(apiAuth === null || usePublicApi
            ? {}
            : { "x-6529-auth": apiAuth }),
        },
        next: { revalidate: 3600 },
      }
    );
  const fetchMetadata: FetchMetadata = async (path) => {
    // Only fixed API routes above supply paths; never follow response redirects.
    let response = await requestMetadata(path);
    if (
      mayUsePublicApi &&
      !usePublicApi &&
      (response.status === 401 || response.status === 403)
    ) {
      await response.body?.cancel();
      // These collections are public. Keep the token and its collection on the
      // public API after one staging-access fallback, without forwarding auth.
      usePublicApi = true;
      response = await requestMetadata(path);
    }
    if (!response.ok) throw new Error("NFT preview metadata is unavailable.");
    assertContentType(response.headers, isJsonContentType, "application/json");
    return readLimitedJson<unknown>(response, MAX_METADATA_BYTES);
  };
  try {
    if (isNextgen) return await fetchNextgenMetadata(Number(id), fetchMetadata);
    if (collection === undefined) return null;
    const query = new URLSearchParams({ contract: collection.contract, id });
    const response = asRecord(
      await fetchMetadata(`${collection.endpoint}?${query.toString()}`)
    );
    const data = response?.["data"];
    const nft = Array.isArray(data)
      ? data
          .map(asRecord)
          .find(
            (item) =>
              item?.["id"] === Number(id) &&
              text(item["contract"])?.toLowerCase() === normalizedContract
          )
      : null;
    if (nft === null || nft === undefined) return null;
    return {
      title: text(nft["name"]) ?? `${collection.name} #${id}`,
      artist: text(nft["artist"]),
      collection: collection.name,
      badge: collection.name,
      displayId: null,
      imageUrl:
        text(nft["scaled"], 8192) ??
        text(nft["image"], 8192) ??
        text(nft["thumbnail"], 8192),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
    controller.abort();
  }
}
