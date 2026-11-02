import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import {
  asRecord,
  isTokenNumber,
  text,
  withOgApiJson,
  type FetchOgApiJson,
  type JsonRecord,
} from "@/app/api/og-metadata/_lib/apiMetadata";
import { shortenAddress } from "@/app/api/og-metadata/_lib/imageUtils";

const COLLECTIONS = [
  { contract: MEMES_CONTRACT, name: "The Memes", endpoint: "nfts" },
  { contract: GRADIENT_CONTRACT, name: "6529 Gradient", endpoint: "nfts" },
  { contract: MEMELAB_CONTRACT, name: "Meme Lab", endpoint: "nfts_memelab" },
];
const MAX_IMAGE_URL_LENGTH = 8192;

export const NFT_CONTRACT_PATTERN = /^0x[0-9a-fA-F]{40}$/;
// ReMeme token IDs may be any ERC-721 token ID (up to 78 decimal digits).
export const NFT_TOKEN_ID_PATTERN = /^\d{1,78}$/;

export interface NftCardMetadata {
  readonly title: string;
  readonly artist: string | null;
  readonly collection: string;
  readonly badge: string;
  readonly displayId: string | null;
  readonly imageUrl: string | null;
}

async function fetchNextgenMetadata(
  id: number,
  fetchMetadata: FetchOgApiJson
): Promise<NftCardMetadata | null> {
  const token = asRecord(
    await fetchMetadata(["nextgen", "tokens", String(id)])
  );
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
    await fetchMetadata([
      "nextgen",
      "collections",
      String(token["collection_id"]),
    ]).catch(() => null)
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
      text(token["image_url"], MAX_IMAGE_URL_LENGTH) ??
      text(token["thumbnail_url"], MAX_IMAGE_URL_LENGTH),
  };
}

const getRememeMediaImage = (media: unknown): string | null => {
  if (Array.isArray(media)) {
    for (const item of media) {
      const gateway = text(asRecord(item)?.["gateway"], MAX_IMAGE_URL_LENGTH);
      if (gateway !== null) return gateway;
    }
    return null;
  }
  const record = asRecord(media);
  return (
    text(record?.["thumbnailUrl"], MAX_IMAGE_URL_LENGTH) ??
    text(record?.["cachedUrl"], MAX_IMAGE_URL_LENGTH) ??
    text(record?.["pngUrl"], MAX_IMAGE_URL_LENGTH) ??
    text(record?.["originalUrl"], MAX_IMAGE_URL_LENGTH)
  );
};

const getRememeImage = (
  rememe: JsonRecord,
  openSeaData: JsonRecord | null
): string | null =>
  text(rememe["s3_image_scaled"], MAX_IMAGE_URL_LENGTH) ??
  text(rememe["s3_image_original"], MAX_IMAGE_URL_LENGTH) ??
  text(rememe["image"], MAX_IMAGE_URL_LENGTH) ??
  getRememeMediaImage(rememe["media"]) ??
  text(openSeaData?.["imageUrl"], MAX_IMAGE_URL_LENGTH);

async function fetchRememeMetadata(
  contract: string,
  id: string,
  fetchMetadata: FetchOgApiJson
): Promise<NftCardMetadata | null> {
  const response = asRecord(await fetchMetadata(["rememes"], { contract, id }));
  const data = response?.["data"];
  const rememe = Array.isArray(data)
    ? data
        .map(asRecord)
        .find(
          (item) =>
            text(item?.["contract"])?.toLowerCase() === contract &&
            String(item?.["id"]) === id
        )
    : null;
  if (rememe === null || rememe === undefined) return null;
  const openSeaData = asRecord(rememe["contract_opensea_data"]);
  return {
    title:
      text(asRecord(rememe["metadata"])?.["name"]) ??
      `${shortenAddress(contract)} #${id}`,
    artist: null,
    collection: text(openSeaData?.["collectionName"]) ?? "ReMemes",
    badge: "ReMemes",
    displayId: null,
    imageUrl: getRememeImage(rememe, openSeaData),
  };
}

const NEXTGEN_COLLECTION_NAME = "NextGen";

/**
 * Neutral card details for a known collection whose token lookup failed.
 * Derived from the fixed collection registry; null for any other contract.
 */
export function getFallbackNftCardMetadata(
  contract: string,
  id: string
): NftCardMetadata | null {
  const normalizedContract = contract.toLowerCase();
  const name =
    COLLECTIONS.find(
      (entry) => entry.contract.toLowerCase() === normalizedContract
    )?.name ??
    (normalizedContract === NEXTGEN_CONTRACT.toLowerCase()
      ? NEXTGEN_COLLECTION_NAME
      : null);
  return name === null
    ? null
    : {
        title: `${name} #${id}`,
        artist: null,
        collection: name,
        badge: name,
        displayId: null,
        imageUrl: null,
      };
}

/**
 * Resolve card text and artwork only from the configured collection API.
 * Returns null when the token cannot be found, so callers render a neutral card.
 */
export async function fetchNftCardMetadata(
  contract: string,
  id: string,
  signal?: AbortSignal,
  options: { readonly timeoutMs?: number } = {}
): Promise<NftCardMetadata | null> {
  if (!NFT_CONTRACT_PATTERN.test(contract) || !NFT_TOKEN_ID_PATTERN.test(id)) {
    return null;
  }
  const normalizedContract = contract.toLowerCase();
  const collection = COLLECTIONS.find(
    (entry) => entry.contract.toLowerCase() === normalizedContract
  );
  const isNextgen = normalizedContract === NEXTGEN_CONTRACT.toLowerCase();
  if ((collection !== undefined || isNextgen) && !isTokenNumber(Number(id))) {
    return null;
  }

  try {
    return await withOgApiJson(
      signal,
      async (fetchMetadata) => {
        if (isNextgen) return fetchNextgenMetadata(Number(id), fetchMetadata);
        if (collection === undefined) {
          return fetchRememeMetadata(normalizedContract, id, fetchMetadata);
        }
        const response = asRecord(
          await fetchMetadata([collection.endpoint], {
            contract: collection.contract,
            id,
          })
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
            text(nft["scaled"], MAX_IMAGE_URL_LENGTH) ??
            text(nft["image"], MAX_IMAGE_URL_LENGTH) ??
            text(nft["thumbnail"], MAX_IMAGE_URL_LENGTH),
        };
      },
      options
    );
  } catch {
    return null;
  }
}
