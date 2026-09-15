import type {
  MuseumArtist,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";
import { organizationNode, webPageNode, websiteNode } from "./site";
import type { JsonLdObject } from "./types";
import {
  buildBreadcrumbList,
  canonicalUrl,
  compactJsonLdObject,
  graphJsonLd,
  nodeId,
  toAbsoluteHttpUrl,
} from "./utils";

const MUSEUM_NETWORK_PATH = "/museum/network";
const MUSEUM_NAME = "6529 Network Museum";

/**
 * Builds schema from the public Work projection only. In particular, a Work
 * record is not a token, and its accession, custody, and rights records stay
 * separate from this public artwork description.
 */
export function buildMuseumWorkPageJsonLd({
  work,
  path,
}: {
  readonly work: MuseumPublicWork;
  readonly path: string;
}): JsonLdObject {
  const artworkId = nodeId(path, "museum-work");
  const image = workImage(work);

  return graphJsonLd([
    organizationNode(),
    websiteNode(),
    webPageNode({
      path,
      name: work.title,
      mainEntityId: artworkId,
      image,
    }),
    buildBreadcrumbList([
      { name: MUSEUM_NAME, path: MUSEUM_NETWORK_PATH },
      { name: "Works", path: "/museum/network/works" },
      { name: work.title, path },
    ]),
    compactJsonLdObject({
      "@type": "VisualArtwork",
      "@id": artworkId,
      name: work.title,
      url: canonicalUrl(path),
      image,
      artMedium: work.medium,
    }),
  ]);
}

/**
 * Artist records do not establish that a named artist is a natural person or
 * organization. Model the governed record as a Thing rather than inferring
 * either classification.
 */
export function buildMuseumArtistPageJsonLd({
  artist,
  path,
}: {
  readonly artist: MuseumArtist;
  readonly path: string;
}): JsonLdObject {
  const artistId = museumArtistNodeId(artist.id);

  return graphJsonLd([
    organizationNode(),
    websiteNode(),
    webPageNode({
      path,
      name: artist.preferredName,
      mainEntityId: artistId,
    }),
    buildBreadcrumbList([
      { name: MUSEUM_NAME, path: MUSEUM_NETWORK_PATH },
      { name: "Artists", path: "/museum/network/artists" },
      { name: artist.preferredName, path },
    ]),
    museumArtistNode(artist),
  ]);
}

function museumArtistNode(artist: MuseumArtist): JsonLdObject {
  const path = `/museum/network/artists/${encodeURIComponent(artist.slug)}`;
  return compactJsonLdObject({
    "@type": "Thing",
    "@id": museumArtistNodeId(artist.id),
    name: artist.preferredName,
    url: canonicalUrl(path),
  });
}

function museumArtistNodeId(artistId: string): string {
  return `${canonicalUrl(MUSEUM_NETWORK_PATH)}#artist-${encodeURIComponent(
    artistId
  )}`;
}

function workImage(work: MuseumPublicWork): string | undefined {
  const stillMedia = work.media.find(
    (media) => media.kind === "still" && media.role === "source"
  );
  return toAbsoluteHttpUrl(stillMedia?.url);
}
