import type {
  NextGenCollection,
  NextGenToken,
  NextGenTrait,
} from "@/entities/INextgen";
import { formatNameForUrl } from "@/helpers/nextgen-utils";
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
import { organizationNode, webPageNode, websiteNode } from "./site";
import type { JsonLdObject } from "./types";

export function buildNextgenLandingPageJsonLd({
  featuredCollection,
}: {
  readonly featuredCollection: NextGenCollection | null | undefined;
}): JsonLdObject {
  const path = "/nextgen";
  const nextgenId = nodeId(path, "collection");
  const featuredCollectionName = cleanText(featuredCollection?.name);
  const featuredPath = featuredCollectionName
    ? `/nextgen/collection/${formatNameForUrl(featuredCollectionName)}`
    : undefined;

  const nodes: JsonLdObject[] = [
    organizationNode(),
    websiteNode(),
    compactJsonLdObject({
      "@type": "Collection",
      "@id": nextgenId,
      name: "NextGen",
      description:
        "NextGen is the 6529 generative art platform and collection family.",
      url: canonicalUrl(path),
      license: CC0_LICENSE_URL,
      creator: { "@id": nodeId("/", "organization") },
      hasPart: featuredPath
        ? { "@id": nodeId(featuredPath, "collection") }
        : undefined,
    }),
  ];

  if (featuredCollectionName && featuredPath) {
    nodes.push(
      compactJsonLdObject({
          "@type": "Collection",
          "@id": nodeId(featuredPath, "collection"),
          name: featuredCollectionName,
          description: cleanText(featuredCollection?.description),
          url: canonicalUrl(featuredPath),
          image:
            toAbsoluteHttpUrl(featuredCollection?.banner) ??
            toAbsoluteHttpUrl(featuredCollection?.image),
          license: CC0_LICENSE_URL,
          creator: buildNextgenCreator(featuredCollection),
        })
    );
  }

  nodes.push(
    webPageNode({
      path,
      name: "NextGen",
      description: "Explore 6529 NextGen generative art collections.",
      mainEntityId: nextgenId,
      image: featuredCollection?.banner || featuredCollection?.image,
      type: ["CollectionPage", "WebPage"],
    }),
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: "NextGen", path },
    ]),
  );

  return graphJsonLd(nodes);
}

export function buildNextgenCollectionPageJsonLd({
  collection,
  path,
}: {
  readonly collection: NextGenCollection;
  readonly path: string;
}): JsonLdObject {
  const collectionId = nodeId(path, "collection");
  const image =
    toAbsoluteHttpUrl(collection.banner) ?? toAbsoluteHttpUrl(collection.image);

  return graphJsonLd([
    organizationNode(),
    websiteNode(),
    compactJsonLdObject({
      "@type": "Collection",
      "@id": collectionId,
      name: collection.name,
      description: cleanText(collection.description),
      url: canonicalUrl(path),
      image,
      license: CC0_LICENSE_URL,
      creator: buildNextgenCreator(collection),
      numberOfItems:
        collection.total_supply || collection.final_supply_after_mint,
      additionalProperty: [
        propertyValue("Collection ID", collection.id),
        propertyValue("Mint Count", collection.mint_count),
        propertyValue("On Chain", collection.on_chain),
      ].filter((value): value is JsonLdObject => value !== undefined),
    }),
    webPageNode({
      path,
      name: collection.name,
      description: collection.description,
      mainEntityId: collectionId,
      image,
      type: ["CollectionPage", "WebPage"],
    }),
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: "NextGen", path: "/nextgen" },
      { name: collection.name, path },
    ]),
  ]);
}

export function buildNextgenTokenPageJsonLd({
  collection,
  token,
  tokenId,
  traits,
  path,
}: {
  readonly collection: NextGenCollection;
  readonly token: NextGenToken | null;
  readonly tokenId: number;
  readonly traits: readonly NextGenTrait[];
  readonly path: string;
}): JsonLdObject {
  const name = cleanText(token?.name) ?? `${collection.name} #${tokenId}`;
  const image =
    toAbsoluteHttpUrl(token?.image_url) ??
    toAbsoluteHttpUrl(token?.thumbnail_url) ??
    toAbsoluteHttpUrl(collection.image);
  const artworkId = nodeId(path, "artwork");
  const collectionPath = `/nextgen/collection/${formatNameForUrl(collection.name)}`;
  const collectionId = nodeId(collectionPath, "collection");

  return graphJsonLd([
    organizationNode(),
    websiteNode(),
    compactJsonLdObject({
      "@type": "Collection",
      "@id": collectionId,
      name: collection.name,
      url: canonicalUrl(collectionPath),
      license: CC0_LICENSE_URL,
      creator: buildNextgenCreator(collection),
    }),
    webPageNode({
      path,
      name,
      description: collection.description,
      mainEntityId: artworkId,
      image,
    }),
    buildBreadcrumbList([
      { name: "Home", path: "/" },
      { name: "NextGen", path: "/nextgen" },
      { name: collection.name, path: collectionPath },
      { name, path },
    ]),
    compactJsonLdObject({
      "@type": "VisualArtwork",
      "@id": artworkId,
      name,
      description: cleanText(collection.description),
      url: canonicalUrl(path),
      image,
      thumbnailUrl: toAbsoluteHttpUrl(token?.thumbnail_url),
      encoding: toAbsoluteHttpUrl(token?.animation_url)
        ? compactJsonLdObject({
            "@type": "MediaObject",
            contentUrl: toAbsoluteHttpUrl(token?.animation_url),
          })
        : undefined,
      license: CC0_LICENSE_URL,
      creator: buildNextgenCreator(collection),
      datePublished: formatDate(token?.mint_date),
      isPartOf: { "@id": collectionId },
      additionalProperty: [
        propertyValue("Token ID", token?.id ?? tokenId),
        propertyValue("Collection ID", collection.id),
        propertyValue("Owner", token?.owner),
        propertyValue("Rarity Score", token?.rarity_score),
        propertyValue("Rarity Rank", token?.rarity_score_rank),
        ...traits.map((trait) => propertyValue(trait.trait, trait.value)),
      ].filter((value): value is JsonLdObject => value !== undefined),
    }),
  ]);
}

function buildNextgenCreator(collection: NextGenCollection): JsonLdObject {
  return compactJsonLdObject({
    "@type": "Person",
    name: cleanText(collection.artist) ?? "6529",
    identifier: collection.artist_address,
  });
}

function formatDate(
  value: Date | string | number | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}
