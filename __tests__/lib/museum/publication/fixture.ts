import { createHash } from "node:crypto";
import {
  INSTITUTIONAL_PRACTICE_DOCUMENT_CONTRACTS,
  LEGACY_CASEY_REQUIRED_PATHS,
} from "@/lib/museum/publication";

export const EXACT_COMMIT = "a".repeat(40);

const CASEY_OBJECTS = [
  {
    id: "6529NM.2026.001.01",
    title: "CENTURY #31",
    project: "CENTURY",
    platform: "Art Blocks Curated",
    year: 2021,
    contract: "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    token: "100000031",
  },
  {
    id: "6529NM.2026.001.02",
    title: "CENTURY #724",
    project: "CENTURY",
    platform: "Art Blocks Curated",
    year: 2021,
    contract: "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    token: "100000724",
  },
  {
    id: "6529NM.2026.001.03",
    title: "CENTURY #401",
    project: "CENTURY",
    platform: "Art Blocks Curated",
    year: 2021,
    contract: "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    token: "100000401",
  },
  {
    id: "6529NM.2026.001.04",
    title: "Pre-Process #63",
    project: "Pre-Process",
    platform: "Art Blocks Curated",
    year: 2022,
    contract: "99a9b7c1116f9ceeb1652de04d5969cce509b069",
    token: "383000063",
  },
  {
    id: "6529NM.2026.001.05",
    title: "Phototaxis #308",
    project: "Phototaxis",
    platform: "Art Blocks Playground",
    year: 2021,
    contract: "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    token: "164000308",
  },
  {
    id: "6529NM.2026.001.06",
    title: "923 EMPTY ROOMS #713",
    project: "923 EMPTY ROOMS",
    platform: "Art Blocks x Bright Moments",
    year: 2023,
    contract: "145789247973c5d612bf121e9e4eef84b63eb707",
    token: "1000713",
  },
  {
    id: "6529NM.2026.001.07",
    title: "Ex Nihilo (Cosmos) #248",
    project: "Ex Nihilo (Cosmos)",
    platform: "Art Blocks Studio | 92",
    year: 2026,
    contract: "0000000c687daed0fba60d1dba4e5f6149e8b894",
    token: "248",
  },
] as const;

function sha256(text: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

function objectPath(id: string): string {
  return `records/accessions/6529NM.2026.001/objects/${id}.json`;
}

function buildBaseDocuments(): Record<string, string> {
  const documents: Record<string, string> = {};
  for (const artwork of CASEY_OBJECTS) {
    documents[objectPath(artwork.id)] = JSON.stringify({
      envelope: { event_type: "MUSEUM_RECORD_COMMITTED" },
      payload: {
        object_id: artwork.id,
        accession_lot_id: "6529NM.2026.001",
        current_state: "accessioned",
        title: artwork.title,
        artist: { preferred_name: "Casey REAS" },
        project: {
          name: artwork.project,
          platform: artwork.platform,
          release_year: artwork.year,
          platform_metadata_license_label: "CC BY-NC 4.0",
        },
        medium:
          "On-chain generative software associated with an ERC-721 token.",
        credit_line: `Gift of punk6529; Casey REAS; ${artwork.title}; 6529 Network Museum, ${artwork.id}. Licensed CC BY-NC 4.0.`,
      },
    });
  }

  documents[
    "records/accessions/6529NM.2026.001/visual-observation-record.json"
  ] = JSON.stringify({
    payload: {
      objects: CASEY_OBJECTS.map((artwork) => {
        const imageUrl = `https://media-proxy.artblocks.io/1/0x${artwork.contract}/${artwork.token}.png`;
        const generatorUrl = `https://generator.artblocks.io/1/0x${artwork.contract}/${artwork.token}`;
        return {
          object_id: artwork.id,
          raw_metadata_source: {
            image_url: imageUrl,
            generator_url: generatorUrl,
          },
          static_capture: {
            source_url: imageUrl,
            media_type: "image/png",
            retention: { bytes_retained_in_public_repository: false },
          },
          live_capture: {
            source_url: generatorUrl,
            retention: { bytes_retained_in_public_repository: false },
          },
        };
      }),
    },
  });

  documents[
    "records/accessions/6529NM.2026.001/gift-acceptance-authorization.json"
  ] = JSON.stringify({
    payload: {
      subject_id: "6529NM.2026.001",
      authorization_id: "6529NM.2026.001.GAA-01",
      acquisition_method: "donation",
      authorization_status: "formally_accepted",
      completion_boundary: { current_state: "accessioned" },
      donor_public_credit: "punk6529",
      formal_acceptance_date: "2026-08-01T22:55:00Z",
      assets: CASEY_OBJECTS.map((artwork) => ({ object_id: artwork.id })),
    },
  });

  for (const path of LEGACY_CASEY_REQUIRED_PATHS) {
    if (path.endsWith(".md")) {
      const stem = path.split("/").at(-1)?.replace(/\.md$/u, "") ?? "Museum";
      const heading =
        stem === "gift-into-public-trust" ? "Gift into Public Trust" : stem;
      documents[path] = `# ${heading}\n\nGoverned public writing.`;
    }
  }
  for (const contract of INSTITUTIONAL_PRACTICE_DOCUMENT_CONTRACTS) {
    documents[contract.path] =
      `# ${contract.title}\n\nGoverned institutional research.`;
  }
  return documents;
}

export interface CaseyFixtureOptions {
  readonly documentOverrides?: Readonly<Record<string, string>>;
  readonly responseOverrides?: Readonly<Record<string, string>>;
  readonly manifestSizeOverrides?: Readonly<Record<string, number>>;
  readonly omittedManifestPath?: string;
  readonly commit?: string;
}

export interface CaseyFixture {
  readonly calls: string[];
  readonly documents: Readonly<Record<string, string>>;
  readonly manifest: string;
  readonly fetch: typeof fetch;
}

function mockResponse(text: string, status: number): Response {
  const bytes = Buffer.from(text, "utf8");
  return {
    ok: status >= 200 && status < 300,
    status,
    url: "",
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-length"
          ? String(bytes.byteLength)
          : null,
    },
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as Response;
}

export function createCaseyFixture(
  options: CaseyFixtureOptions = {}
): CaseyFixture {
  const commit = options.commit ?? EXACT_COMMIT;
  const documents = {
    ...buildBaseDocuments(),
    ...options.documentOverrides,
  };
  const entries = Object.entries(documents)
    .filter(([path]) => path !== options.omittedManifestPath)
    .map(([path, text]) => ({
      path,
      sha256: sha256(text),
      size:
        options.manifestSizeOverrides?.[path] ??
        Buffer.byteLength(text, "utf8"),
    }));
  entries.push({
    path: ".gitattributes",
    sha256: sha256("* text=auto"),
    size: Buffer.byteLength("* text=auto", "utf8"),
  });
  const manifest = JSON.stringify({
    manifest_type: "6529NM_RECORD_MANIFEST",
    manifest_version: "1.0.0",
    entries,
  });
  const calls: string[] = [];
  const responseOverrides = options.responseOverrides ?? {};

  const fetchImplementation = async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push(url);
    if (url.startsWith("https://api.github.com/")) {
      return mockResponse(JSON.stringify({ object: { sha: commit } }), 200);
    }
    if (url.endsWith("/release-artifacts/latest/record-manifest.json")) {
      return mockResponse(manifest, 200);
    }

    const marker = `/${commit}/`;
    const markerIndex = url.indexOf(marker);
    const path =
      markerIndex === -1
        ? ""
        : decodeURIComponent(url.slice(markerIndex + marker.length));
    const text = responseOverrides[path] ?? documents[path];
    return text === undefined
      ? mockResponse("missing", 404)
      : mockResponse(text, 200);
  };

  return {
    calls,
    documents,
    manifest,
    fetch: fetchImplementation as typeof fetch,
  };
}

export function withObjectState(
  fixture: CaseyFixture,
  objectId: string,
  state: string
): string {
  const path = objectPath(objectId);
  const parsed = JSON.parse(fixture.documents[path] ?? "null") as {
    payload: { current_state: string };
  };
  parsed.payload.current_state = state;
  return JSON.stringify(parsed);
}
