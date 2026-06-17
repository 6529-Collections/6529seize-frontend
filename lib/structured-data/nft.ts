import { publicEnv } from "@/config/env";
import type { DBResponse } from "@/entities/IDBResponse";
import type { BaseNFT } from "@/entities/INFT";
import { fetchUrl } from "@/services/6529api";
import { cache } from "react";
import { organizationNode, webPageNode, websiteNode } from "./site";
import type { JsonLdObject } from "./types";
import {
  buildBreadcrumbList,
  canonicalUrl,
  CC0_LICENSE_URL,
  cleanText,
  compactJsonLdObject,
  graphJsonLd,
  nodeId,
  propertyValue,
  toAbsoluteHttpUrl,
} from "./utils";

export type NftCollectionKind = "memes" | "meme-lab" | "gradient";
type NftStructuredDataApiPath = "nfts" | "nfts_memelab";

const fetchNftForStructuredDataCached = cache(
  async (
    contract: string,
    id: string,
    apiPath: NftStructuredDataApiPath
  ): Promise<BaseNFT | null> => {
    try {
      const params = new URLSearchParams({ contract, id });
      const response = await fetchUrl<DBResponse<BaseNFT>>(
        `${publicEnv.API_ENDPOINT}/api/${apiPath}?${params.toString()}`
      );
      return response.data[0] ?? null;
    } catch (error) {
      console.error("Failed to fetch NFT structured data", {
        contract,
        id,
        error,
      });
      return null;
    }
  }
);

export async function fetchNftForStructuredData({
  contract,
  id,
  apiPath = "nfts",
}: {
  readonly contract: string;
  readonly id: string;
  readonly apiPath?: NftStructuredDataApiPath | undefined;
}): Promise<BaseNFT | null> {
  return fetchNftForStructuredDataCached(contract, id, apiPath);
}

export function buildNftPageJsonLd({
  nft,
  path,
  fallbackName,
  collectionName,
  collectionPath,
  license = CC0_LICENSE_URL,
}: {
  readonly nft: BaseNFT | null;
  readonly path: string;
  readonly fallbackName: string;
  readonly collectionName: string;
  readonly collectionPath: string;
  readonly license?: string | null | undefined;
}): JsonLdObject {
  const name = cleanText(nft?.name) ?? fallbackName;
  const description = cleanText(nft?.description);
  const image = toAbsoluteHttpUrl(nft?.image) ?? toAbsoluteHttpUrl(nft?.scaled);
  const thumbnail =
    toAbsoluteHttpUrl(nft?.thumbnail) ?? toAbsoluteHttpUrl(nft?.icon);
  const artworkId = nodeId(path, "artwork");
  const collectionId = nodeId(collectionPath, "collection");

  const additionalProperty = [
    propertyValue("Contract", nft?.contract),
    propertyValue("Token ID", nft?.id),
    propertyValue("Token Type", nft?.token_type),
    propertyValue("Supply", nft?.supply),
  ].filter((value): value is JsonLdObject => value !== undefined);

  const artwork = compactJsonLdObject({
    "@type": "VisualArtwork",
    "@id": artworkId,
    name,
    description,
    url: canonicalUrl(path),
    image,
    thumbnailUrl: thumbnail,
    license,
    creator: buildCreatorNode(nft),
    artEdition: nft?.supply,
    datePublished: formatDate(nft?.mint_date),
    identifier: nft
      ? [
          propertyValue("Contract", nft.contract),
          propertyValue("Token ID", nft.id),
        ].filter((value): value is JsonLdObject => value !== undefined)
      : undefined,
    isPartOf: { "@id": collectionId },
    additionalProperty,
  });

  const collection = compactJsonLdObject({
    "@type": "Collection",
    "@id": collectionId,
    name: collectionName,
    url: canonicalUrl(collectionPath),
    creator: { "@id": nodeId("/", "organization") },
  });

  return graphJsonLd([
    organizationNode(),
    websiteNode(),
    collection,
    webPageNode({
      path,
      name,
      description,
      mainEntityId: artworkId,
      image,
    }),
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: collectionName, path: collectionPath },
      { name, path },
    ]),
    artwork,
  ]);
}

export function buildCollectionPageJsonLd({
  path,
  name,
  description,
  image,
  license,
}: {
  readonly path: string;
  readonly name: string;
  readonly description: string;
  readonly image?: string | undefined;
  readonly license?: string | undefined;
}): JsonLdObject {
  const collectionId = nodeId(path, "collection");

  return graphJsonLd([
    organizationNode(),
    websiteNode(),
    compactJsonLdObject({
      "@type": "Collection",
      "@id": collectionId,
      name,
      description,
      url: canonicalUrl(path),
      image: toAbsoluteHttpUrl(image),
      license,
      creator: { "@id": nodeId("/", "organization") },
    }),
    webPageNode({
      path,
      name,
      description,
      mainEntityId: collectionId,
      image,
      type: ["CollectionPage", "WebPage"],
    }),
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name, path },
    ]),
  ]);
}

function buildCreatorNode(nft: BaseNFT | null): JsonLdObject | undefined {
  const artist = cleanText(nft?.artist);
  const handle = cleanText(nft?.artist_seize_handle);

  if (!artist && !handle) {
    return undefined;
  }

  return compactJsonLdObject({
    "@type": "Person",
    name: artist ?? handle,
    alternateName: handle,
    url: handle ? canonicalUrl(`/${handle.replace(/^@/, "")}`) : undefined,
  });
}

function formatDate(
  value: Date | string | number | null | undefined
): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}
