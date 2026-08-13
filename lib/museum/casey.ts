import {
  isMuseumCollectionArtwork,
  type MuseumPublication,
  type MuseumPublicDocument,
  type MuseumUpstreamMedia,
} from "./publication/types";
import { displayCreditWithoutRepeatedLicense } from "./credit";

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
  readonly rightsExpressionId: string;
  readonly rightsUrl?: string | undefined;
  readonly status: "accessioned";
  readonly mediaRetention: "upstream_not_retained";
}

const COMMON_MEDIUM =
  "On-chain generative software associated with an ERC-721 token on Ethereum; displayed from the official Art Blocks presentation source.";
const CASEY_RIGHTS_LABEL = "Licensed CC BY-NC 4.0.";

type CaseyArtworkSeed = readonly [
  objectId: string,
  title: string,
  project: string,
  projectSlug: string,
  year: number,
  contract: string,
  tokenId: string,
  visualDescription: string,
  observedImageSha256: string,
];

function createCaseyArtwork([
  objectId,
  title,
  project,
  projectSlug,
  year,
  contract,
  tokenId,
  visualDescription,
  observedImageSha256,
]: CaseyArtworkSeed): CaseyArtwork {
  const tokenPath = `0x${contract}/${tokenId}`;
  return {
    objectId,
    title,
    project,
    projectSlug,
    year,
    medium: COMMON_MEDIUM,
    caip19: `eip155:1/erc721:${tokenPath}`,
    imageUrl: `https://media-proxy.artblocks.io/1/${tokenPath}.png`,
    generatorUrl: `https://generator.artblocks.io/1/${tokenPath}`,
    visualDescription,
    observedImageSha256,
    creditLine: `Casey REAS, ${title}; 6529 Network Museum, gift of punk6529, ${objectId}.`,
    rightsLabel: CASEY_RIGHTS_LABEL,
    rightsExpressionId: "cc-by-nc-4.0",
    rightsUrl: "/museum/network/research/rights/cc-by-nc-4.0",
    status: "accessioned",
    mediaRetention: "upstream_not_retained",
  };
}

const CASEY_ARTWORK_SEEDS = [
  [
    "6529NM.2026.001.01",
    "CENTURY #31",
    "CENTURY",
    "century",
    2021,
    "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    "100000031",
    "Dark blue-charcoal circular field with cream semicircles, diagonal fragments, and conspicuous vertical slice divisions.",
    "sha256:2769e41b8ea77a39b53103e31e1eaa52c04031c400062d309f7bf547792ba5da",
  ],
  [
    "6529NM.2026.001.02",
    "CENTURY #724",
    "CENTURY",
    "century",
    2021,
    "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    "100000724",
    "Open rust and cream field with broad dark partitions.",
    "sha256:e13ec3c6506e8f5942859af6068e2c677724aed9f1855c6eec970a64f16bc556",
  ],
  [
    "6529NM.2026.001.03",
    "CENTURY #401",
    "CENTURY",
    "century",
    2021,
    "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    "100000401",
    "Grayscale field with black bands, gray planes, and intersecting white lines.",
    "sha256:416bedf30696ca410ed2dc84aa8f57c6e752c21671dc42b20c32d2ad2e234e06",
  ],
  [
    "6529NM.2026.001.04",
    "Pre-Process #63",
    "Pre-Process",
    "pre-process",
    2022,
    "99a9b7c1116f9ceeb1652de04d5969cce509b069",
    "383000063",
    "Rows of circular masses, repeated axes, and translucent sweeps and overlaps.",
    "sha256:8b02640589888c3fd086a8208dab79dfb083c76e7fc9060848f1fe9f0e00acf2",
  ],
  [
    "6529NM.2026.001.05",
    "Phototaxis #308",
    "Phototaxis",
    "phototaxis",
    2021,
    "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    "164000308",
    "Blue-gray central and lower knot with trajectories rising and dispersing.",
    "sha256:8f370bc60848959def351197cce7accd0b88474e997bae6e52459ef0d30c60dd",
  ],
  [
    "6529NM.2026.001.06",
    "923 EMPTY ROOMS #713",
    "923 EMPTY ROOMS",
    "923-empty-rooms",
    2023,
    "145789247973c5d612bf121e9e4eef84b63eb707",
    "1000713",
    "Bright green and dark room-like perspectival field.",
    "sha256:c4e1bf468e1c632e429aa743c8b72999c4bad0e1063c9cee7b02031908972e2c",
  ],
  [
    "6529NM.2026.001.07",
    "Ex Nihilo (Cosmos) #248",
    "Ex Nihilo (Cosmos)",
    "ex-nihilo-cosmos",
    2026,
    "0000000c687daed0fba60d1dba4e5f6149e8b894",
    "248",
    "Black field with granular white lines and unstable polygonal and dodecahedral suggestions.",
    "sha256:11724ce22525a6ec161af480cf8c60a3fb1519ea2c3d3e3f805827bde43398f8",
  ],
] as const satisfies readonly CaseyArtworkSeed[];

const CASEY_ARTWORKS: readonly CaseyArtwork[] =
  CASEY_ARTWORK_SEEDS.map(createCaseyArtwork);

interface CaseyDossierDocument {
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

function dossierFileName(path: string): string {
  const withoutFragment = path.split("#", 1)[0] ?? "";
  const withoutQuery = withoutFragment.split("?", 1)[0] ?? "";
  return withoutQuery.split("/").at(-1) ?? "";
}

function isDossierAnchorCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0) ?? -1;
  return (
    (codePoint >= 48 && codePoint <= 57) ||
    (codePoint >= 65 && codePoint <= 90) ||
    (codePoint >= 97 && codePoint <= 122) ||
    character === "." ||
    character === "-"
  );
}

function createDossierAnchor(path: string): string {
  const fileName = dossierFileName(path);
  const stem = fileName.endsWith(".md") ? fileName.slice(0, -3) : fileName;
  let anchor = "";
  let previousCharacterWasSeparator = false;

  for (const character of stem) {
    if (isDossierAnchorCharacter(character)) {
      anchor += character;
      previousCharacterWasSeparator = false;
    } else if (!previousCharacterWasSeparator) {
      anchor += "-";
      previousCharacterWasSeparator = true;
    }
  }

  return anchor.length > 0 ? anchor : "document";
}

const CASEY_DOSSIER_ANCHOR_BY_FILE_NAME = new Map(
  CASEY_DOSSIER.map(({ path }): readonly [string, string] => [
    dossierFileName(path),
    createDossierAnchor(path),
  ])
);

export function getCaseyDossierAnchor(path: string): string | null {
  return CASEY_DOSSIER_ANCHOR_BY_FILE_NAME.get(dossierFileName(path)) ?? null;
}

export function getCaseyArtwork(objectId: string): CaseyArtwork | null {
  return (
    CASEY_ARTWORKS.find((artwork) => artwork.objectId === objectId) ?? null
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

    const project =
      publication.projects.find((item) => item.id === governed.projectId) ??
      publication.projects.find((item) => item.slug === overlay.projectSlug);
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
    const rightsExpressionId =
      governed.rightsCredit.rightsExpressionId ?? overlay.rightsExpressionId;

    return {
      ...overlay,
      year: project.releaseYear || overlay.year,
      medium: governed.medium,
      imageUrl: still.url,
      generatorUrl: live.url,
      creditLine: displayCreditWithoutRepeatedLicense(
        governed.rightsCredit.creditLine,
        rightsLabel
      ),
      rightsLabel,
      rightsExpressionId,
      rightsUrl:
        governed.rightsCredit.rightsExpressionId === null
          ? undefined
          : `/museum/network/research/rights/${encodeURIComponent(rightsExpressionId)}`,
    };
  });
}

const CASEY_PRESENTATION_ERROR_CODES = new Set([
  "museum_casey_media_incomplete",
  "museum_casey_media_mismatch",
  "museum_casey_project_mismatch",
  "museum_casey_publication_incomplete",
  "museum_casey_publication_mismatch",
]);

export function tryCaseyArtworksFromPublication(
  publication: MuseumPublication
): readonly CaseyArtwork[] | null {
  try {
    return caseyArtworksFromPublication(publication);
  } catch (error) {
    if (
      error instanceof Error &&
      CASEY_PRESENTATION_ERROR_CODES.has(error.message)
    ) {
      return null;
    }
    throw error;
  }
}
