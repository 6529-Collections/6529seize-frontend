import type { MuseumCorpus, MuseumDocument } from "./types";
import {
  isMuseumCollectionArtwork,
  type MuseumPublication,
  type MuseumPublicDocument,
  type MuseumUpstreamMedia,
} from "./publication/types";

export const CASEY_ACCESSION_ID = "6529NM.2026.001";
export const CASEY_ARTIST_SLUG = "casey-reas";
export const CASEY_ARTIST_NAME = "Casey Reas";

export interface CaseyArtwork {
  readonly objectId: string;
  readonly title: string;
  readonly project: string;
  readonly projectSlug: string;
  readonly year: number;
  readonly medium: string;
  readonly caip19: string;
  readonly imageUrl: string;
  readonly generatorUrl: string;
  readonly visualDescription: string;
  readonly observedImageSha256: string;
  readonly creditLine: string;
  readonly rightsLabel: string;
  readonly rightsUrl?: string | undefined;
  readonly status: "accessioned";
  readonly mediaRetention: "upstream_not_retained";
}

function displayCreditWithoutRepeatedLicense(
  creditLine: string,
  rightsLabel: string
): string {
  const creditWithoutTerminalPunctuation = creditLine
    .trim()
    .replace(/[.\s]+$/u, "");
  const labelWithoutTerminalPunctuation = rightsLabel
    .trim()
    .replace(/[.\s]+$/u, "");
  const creditLower = creditWithoutTerminalPunctuation.toLocaleLowerCase();
  const candidates = [
    labelWithoutTerminalPunctuation,
    `Licensed ${labelWithoutTerminalPunctuation}`,
  ];

  const duplicate = candidates.find((candidate) =>
    creditLower.endsWith(candidate.toLocaleLowerCase())
  );
  if (duplicate === undefined) {
    return creditLine.trim();
  }

  return creditWithoutTerminalPunctuation
    .slice(0, -duplicate.length)
    .trim()
    .replace(/[;,]+$/u, "");
}

const COMMON_MEDIUM =
  "On-chain generative software associated with an ERC-721 token on Ethereum; displayed from the official Art Blocks presentation source.";
const CASEY_RIGHTS_LABEL = "Licensed CC BY-NC 4.0.";

export const CASEY_ARTWORKS: readonly CaseyArtwork[] = [
  {
    objectId: "6529NM.2026.001.01",
    title: "CENTURY #31",
    project: "CENTURY",
    projectSlug: "century",
    year: 2021,
    medium: COMMON_MEDIUM,
    caip19:
      "eip155:1/erc721:0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000031",
    imageUrl:
      "https://media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000031.png",
    generatorUrl:
      "https://generator.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000031",
    visualDescription:
      "Dark blue-charcoal circular field with cream semicircles, diagonal fragments, and conspicuous vertical slice divisions.",
    observedImageSha256:
      "sha256:2769e41b8ea77a39b53103e31e1eaa52c04031c400062d309f7bf547792ba5da",
    creditLine:
      "Casey REAS, CENTURY #31; 6529 Network Museum, gift of punk6529, 6529NM.2026.001.01.",
    rightsLabel: CASEY_RIGHTS_LABEL,
    status: "accessioned",
    mediaRetention: "upstream_not_retained",
  },
  {
    objectId: "6529NM.2026.001.02",
    title: "CENTURY #724",
    project: "CENTURY",
    projectSlug: "century",
    year: 2021,
    medium: COMMON_MEDIUM,
    caip19:
      "eip155:1/erc721:0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000724",
    imageUrl:
      "https://media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000724.png",
    generatorUrl:
      "https://generator.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000724",
    visualDescription: "Open rust and cream field with broad dark partitions.",
    observedImageSha256:
      "sha256:e13ec3c6506e8f5942859af6068e2c677724aed9f1855c6eec970a64f16bc556",
    creditLine:
      "Casey REAS, CENTURY #724; 6529 Network Museum, gift of punk6529, 6529NM.2026.001.02.",
    rightsLabel: CASEY_RIGHTS_LABEL,
    status: "accessioned",
    mediaRetention: "upstream_not_retained",
  },
  {
    objectId: "6529NM.2026.001.03",
    title: "CENTURY #401",
    project: "CENTURY",
    projectSlug: "century",
    year: 2021,
    medium: COMMON_MEDIUM,
    caip19:
      "eip155:1/erc721:0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000401",
    imageUrl:
      "https://media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000401.png",
    generatorUrl:
      "https://generator.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/100000401",
    visualDescription:
      "Grayscale field with black bands, gray planes, and intersecting white lines.",
    observedImageSha256:
      "sha256:416bedf30696ca410ed2dc84aa8f57c6e752c21671dc42b20c32d2ad2e234e06",
    creditLine:
      "Casey REAS, CENTURY #401; 6529 Network Museum, gift of punk6529, 6529NM.2026.001.03.",
    rightsLabel: CASEY_RIGHTS_LABEL,
    status: "accessioned",
    mediaRetention: "upstream_not_retained",
  },
  {
    objectId: "6529NM.2026.001.04",
    title: "Pre-Process #63",
    project: "Pre-Process",
    projectSlug: "pre-process",
    year: 2022,
    medium: COMMON_MEDIUM,
    caip19:
      "eip155:1/erc721:0x99a9b7c1116f9ceeb1652de04d5969cce509b069/383000063",
    imageUrl:
      "https://media-proxy.artblocks.io/1/0x99a9b7c1116f9ceeb1652de04d5969cce509b069/383000063.png",
    generatorUrl:
      "https://generator.artblocks.io/1/0x99a9b7c1116f9ceeb1652de04d5969cce509b069/383000063",
    visualDescription:
      "Rows of circular masses, repeated axes, and translucent sweeps and overlaps.",
    observedImageSha256:
      "sha256:8b02640589888c3fd086a8208dab79dfb083c76e7fc9060848f1fe9f0e00acf2",
    creditLine:
      "Casey REAS, Pre-Process #63; 6529 Network Museum, gift of punk6529, 6529NM.2026.001.04.",
    rightsLabel: CASEY_RIGHTS_LABEL,
    status: "accessioned",
    mediaRetention: "upstream_not_retained",
  },
  {
    objectId: "6529NM.2026.001.05",
    title: "Phototaxis #308",
    project: "Phototaxis",
    projectSlug: "phototaxis",
    year: 2021,
    medium: COMMON_MEDIUM,
    caip19:
      "eip155:1/erc721:0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/164000308",
    imageUrl:
      "https://media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/164000308.png",
    generatorUrl:
      "https://generator.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/164000308",
    visualDescription:
      "Blue-gray central and lower knot with trajectories rising and dispersing.",
    observedImageSha256:
      "sha256:8f370bc60848959def351197cce7accd0b88474e997bae6e52459ef0d30c60dd",
    creditLine:
      "Casey REAS, Phototaxis #308; 6529 Network Museum, gift of punk6529, 6529NM.2026.001.05.",
    rightsLabel: CASEY_RIGHTS_LABEL,
    status: "accessioned",
    mediaRetention: "upstream_not_retained",
  },
  {
    objectId: "6529NM.2026.001.06",
    title: "923 EMPTY ROOMS #713",
    project: "923 EMPTY ROOMS",
    projectSlug: "923-empty-rooms",
    year: 2023,
    medium: COMMON_MEDIUM,
    caip19:
      "eip155:1/erc721:0x145789247973c5d612bf121e9e4eef84b63eb707/1000713",
    imageUrl:
      "https://media-proxy.artblocks.io/1/0x145789247973c5d612bf121e9e4eef84b63eb707/1000713.png",
    generatorUrl:
      "https://generator.artblocks.io/1/0x145789247973c5d612bf121e9e4eef84b63eb707/1000713",
    visualDescription: "Bright green and dark room-like perspectival field.",
    observedImageSha256:
      "sha256:c4e1bf468e1c632e429aa743c8b72999c4bad0e1063c9cee7b02031908972e2c",
    creditLine:
      "Casey REAS, 923 EMPTY ROOMS #713; 6529 Network Museum, gift of punk6529, 6529NM.2026.001.06.",
    rightsLabel: CASEY_RIGHTS_LABEL,
    status: "accessioned",
    mediaRetention: "upstream_not_retained",
  },
  {
    objectId: "6529NM.2026.001.07",
    title: "Ex Nihilo (Cosmos) #248",
    project: "Ex Nihilo (Cosmos)",
    projectSlug: "ex-nihilo-cosmos",
    year: 2026,
    medium: COMMON_MEDIUM,
    caip19: "eip155:1/erc721:0x0000000c687daed0fba60d1dba4e5f6149e8b894/248",
    imageUrl:
      "https://media-proxy.artblocks.io/1/0x0000000c687daed0fba60d1dba4e5f6149e8b894/248.png",
    generatorUrl:
      "https://generator.artblocks.io/1/0x0000000c687daed0fba60d1dba4e5f6149e8b894/248",
    visualDescription:
      "Black field with granular white lines and unstable polygonal and dodecahedral suggestions.",
    observedImageSha256:
      "sha256:11724ce22525a6ec161af480cf8c60a3fb1519ea2c3d3e3f805827bde43398f8",
    creditLine:
      "Casey REAS, Ex Nihilo (Cosmos) #248; 6529 Network Museum, gift of punk6529, 6529NM.2026.001.07.",
    rightsLabel: CASEY_RIGHTS_LABEL,
    status: "accessioned",
    mediaRetention: "upstream_not_retained",
  },
] as const;

export interface CaseyProject {
  readonly slug: string;
  readonly name: string;
  readonly artworkIds: readonly string[];
}

export const CASEY_PROJECTS: readonly CaseyProject[] = [
  {
    slug: "century",
    name: "CENTURY",
    artworkIds: [
      "6529NM.2026.001.01",
      "6529NM.2026.001.02",
      "6529NM.2026.001.03",
    ],
  },
  {
    slug: "pre-process",
    name: "Pre-Process",
    artworkIds: ["6529NM.2026.001.04"],
  },
  {
    slug: "phototaxis",
    name: "Phototaxis",
    artworkIds: ["6529NM.2026.001.05"],
  },
  {
    slug: "923-empty-rooms",
    name: "923 EMPTY ROOMS",
    artworkIds: ["6529NM.2026.001.06"],
  },
  {
    slug: "ex-nihilo-cosmos",
    name: "Ex Nihilo (Cosmos)",
    artworkIds: ["6529NM.2026.001.07"],
  },
] as const;

export interface CaseyDossierDocument {
  readonly path: string;
  readonly title: string;
  readonly kind: "essay" | "object" | "institutional";
}

export const CASEY_DOSSIER: readonly CaseyDossierDocument[] = [
  {
    path: "records/accessions/6529NM.2026.001/public/casey-reas-collection-essay.md",
    title: "The executable image: rule, behavior, room, cosmos",
    kind: "essay",
  },
  {
    path: "records/accessions/6529NM.2026.001/public/casey-reas-artist-practice.md",
    title: "Casey Reas: artist and practice profile",
    kind: "essay",
  },
  ...CASEY_ARTWORKS.map(
    (artwork): CaseyDossierDocument => ({
      path: `records/accessions/6529NM.2026.001/public/${artwork.objectId}.md`,
      title: artwork.title,
      kind: "object",
    })
  ),
  {
    path: "records/accessions/6529NM.2026.001/public/curatorial-accession-review.md",
    title: "Curatorial accession review",
    kind: "institutional",
  },
  {
    path: "records/accessions/6529NM.2026.001/public/accession-certificate.md",
    title: "Accession certificate",
    kind: "institutional",
  },
  {
    path: "records/accessions/6529NM.2026.001/public/title-rights-and-accession-review.md",
    title: "Title, rights, and accession review",
    kind: "institutional",
  },
  {
    path: "records/accessions/6529NM.2026.001/public/technical-and-condition-review.md",
    title: "Technical and condition review",
    kind: "institutional",
  },
  {
    path: "records/accessions/6529NM.2026.001/public/gift-acceptance-authorization.md",
    title: "Gift acceptance authorization",
    kind: "institutional",
  },
  {
    path: "records/accessions/6529NM.2026.001/public/custody-title-and-compliance-diligence.md",
    title: "Custody, title, and compliance diligence",
    kind: "institutional",
  },
] as const;

export function getCaseyArtwork(objectId: string): CaseyArtwork | null {
  return (
    CASEY_ARTWORKS.find((artwork) => artwork.objectId === objectId) ?? null
  );
}

export function getCaseyProject(slug: string): CaseyProject | null {
  return CASEY_PROJECTS.find((project) => project.slug === slug) ?? null;
}

export function getCaseyProjectArtworks(
  project: CaseyProject
): readonly CaseyArtwork[] {
  return project.artworkIds.flatMap((objectId) => {
    const artwork = getCaseyArtwork(objectId);
    return artwork === null ? [] : [artwork];
  });
}

export function getCaseyDocument(
  corpus: MuseumCorpus,
  path: string
): MuseumDocument | null {
  const document = corpus.documents[path];
  return document?.contentType === "markdown" ? document : null;
}

export function hasCompleteCaseyDossier(corpus: MuseumCorpus): boolean {
  return CASEY_DOSSIER.every(
    ({ path }) => getCaseyDocument(corpus, path) !== null
  );
}

function publicationDocument(
  publication: MuseumPublication,
  path: string
): MuseumPublicDocument | null {
  return (
    publication.documents.find((document) => document.sourcePath === path) ??
    null
  );
}

export function getCaseyPublicationDocument(
  publication: MuseumPublication,
  path: string
): MuseumPublicDocument | null {
  return publicationDocument(publication, path);
}

export function hasCompleteCaseyPublicationDossier(
  publication: MuseumPublication
): boolean {
  return CASEY_DOSSIER.every(
    ({ path }) => publicationDocument(publication, path) !== null
  );
}

function upstreamMedia(
  media: readonly MuseumUpstreamMedia[],
  kind: "still" | "live"
): MuseumUpstreamMedia {
  const matches = media.filter((item) => item.kind === kind);
  if (matches.length !== 1 || matches[0] === undefined) {
    throw new Error("museum_casey_media_incomplete");
  }
  return matches[0];
}

export function caseyArtworksFromPublication(
  publication: MuseumPublication
): readonly CaseyArtwork[] {
  const accessioned = publication.artworks.filter(isMuseumCollectionArtwork);
  if (
    accessioned.length !== CASEY_ARTWORKS.length ||
    publication.gifts.length !== 1 ||
    publication.gifts[0]?.id !== CASEY_ACCESSION_ID
  ) {
    throw new Error("museum_casey_publication_incomplete");
  }

  return CASEY_ARTWORKS.map((overlay): CaseyArtwork => {
    const governed = accessioned.find(
      (artwork) => artwork.id === overlay.objectId
    );
    if (
      governed?.title !== overlay.title ||
      governed.accessionLotId !== CASEY_ACCESSION_ID
    ) {
      throw new Error("museum_casey_publication_mismatch");
    }

    const media = governed.media.filter(
      (item): item is MuseumUpstreamMedia => item.custody === "upstream"
    );
    const still = upstreamMedia(media, "still");
    const live = upstreamMedia(media, "live");
    if (still.url !== overlay.imageUrl || live.url !== overlay.generatorUrl) {
      throw new Error("museum_casey_media_mismatch");
    }

    const project = publication.projects.find(
      (item) => item.id === governed.projectId
    );
    if (
      project?.slug !== overlay.projectSlug ||
      project.title !== overlay.project
    ) {
      throw new Error("museum_casey_project_mismatch");
    }

    const rightsLabel =
      governed.rightsCredit.licenseLabel === null
        ? "Rights basis recorded in the accession dossier."
        : `Licensed ${governed.rightsCredit.licenseLabel}.`;

    return {
      ...overlay,
      year: project.releaseYear,
      medium: governed.medium,
      imageUrl: still.url,
      generatorUrl: live.url,
      creditLine: displayCreditWithoutRepeatedLicense(
        governed.rightsCredit.creditLine,
        rightsLabel
      ),
      rightsLabel,
      rightsUrl:
        governed.rightsCredit.licenseUrl ??
        (governed.rightsCredit.licenseLabel === "CC BY-NC 4.0"
          ? "https://creativecommons.org/licenses/by-nc/4.0/"
          : undefined),
    };
  });
}
