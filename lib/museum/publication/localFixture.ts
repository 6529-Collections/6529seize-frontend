import { readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import type { MuseumSourceDocument } from "./types";
import { isExactGitCommit } from "./security";

const INVENTORY_PATH = "schemas/public-entity-identity-inventory.json";
const VISITOR_BUNDLE_PATH = "records/publication/visitor-corpus-bundle-v1.json";

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (typeof input.url === "string") return input.url;
  throw new Error("publication_local_fixture_url");
}

function unknownArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function localSourcePathFromUrl(
  input: RequestInfo | URL,
  sourceCommit: string
): string {
  const url = new URL(requestUrl(input));
  if (
    url.hostname !== "raw.githubusercontent.com" ||
    url.protocol !== "https:"
  ) {
    throw new Error("publication_local_fixture_url_host");
  }
  const prefix = `/6529-Collections/6529networkmuseum/${sourceCommit}/`;
  if (
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.port.length > 0 ||
    url.search.length > 0 ||
    url.hash.length > 0 ||
    !url.pathname.startsWith(prefix)
  ) {
    throw new Error("publication_local_fixture_url");
  }
  const sourcePath = decodeURIComponent(url.pathname.slice(prefix.length));
  if (
    sourcePath.length === 0 ||
    sourcePath.startsWith("/") ||
    sourcePath.includes("\\") ||
    sourcePath
      .split("/")
      .some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new Error("publication_local_fixture_path");
  }
  return sourcePath;
}

function readLocalPath(root: string, sourcePath: string): Uint8Array {
  const resolvedRoot = resolve(root);
  const resolvedPath = resolve(resolvedRoot, ...sourcePath.split("/"));
  const relativePath = relative(resolvedRoot, resolvedPath);
  if (
    isAbsolute(relativePath) ||
    relativePath === ".." ||
    relativePath.startsWith(".." + String.fromCharCode(92))
  ) {
    throw new Error("publication_local_fixture_path");
  }
  return new Uint8Array(
    /* eslint-disable-next-line security/detect-non-literal-fs-filename -- the path is confined to the validated fixture root above. */
    readFileSync(join(resolvedRoot, ...sourcePath.split("/")))
  );
}

export function readMuseumLocalFixtureVisitorPaths(
  root: string
): readonly string[] {
  const bytes = readLocalPath(root, VISITOR_BUNDLE_PATH);
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    ) as unknown;
  } catch {
    throw new Error("publication_local_fixture_bundle_json");
  }
  if (!isRecord(parsed) || !Array.isArray(parsed["entries"])) {
    throw new Error("publication_local_fixture_bundle_shape");
  }
  const paths = parsed["entries"].map((entry) => {
    if (!isRecord(entry) || typeof entry["path"] !== "string") {
      throw new Error("publication_local_fixture_bundle_entry");
    }
    return entry["path"];
  });
  if (
    paths.length === 0 ||
    new Set(paths).size !== paths.length ||
    paths.some((path) => path.length === 0)
  ) {
    throw new Error("publication_local_fixture_bundle_paths");
  }
  return paths;
}

export function createMuseumLocalFixtureFetch(
  root: string,
  sourceCommit: string
): typeof fetch {
  if (!isExactGitCommit(sourceCommit)) {
    throw new Error("publication_local_fixture_commit");
  }
  return (input) => {
    const url = requestUrl(input);
    const sourcePath = localSourcePathFromUrl(input, sourceCommit);
    try {
      const bytes = readLocalPath(root, sourcePath);
      const contentLength = String(bytes.byteLength);
      return Promise.resolve({
        ok: true,
        status: 200,
        url,
        headers: {
          get(name: string): string | null {
            if (name.toLowerCase() === "content-length") return contentLength;
            if (name.toLowerCase() === "content-type") {
              return sourcePath.endsWith(".json")
                ? "application/json"
                : "text/plain; charset=utf-8";
            }
            return null;
          },
        },
        arrayBuffer: () => Promise.resolve(bytes.slice().buffer),
      } as unknown as Response);
    } catch {
      return Promise.resolve({
        ok: false,
        status: 404,
        url,
      } as unknown as Response);
    }
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function qualifyInventory(
  document: MuseumSourceDocument
): MuseumSourceDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(document.text) as unknown;
  } catch {
    throw new Error("publication_local_fixture_inventory_json");
  }
  if (!isRecord(parsed)) throw new Error("publication_local_fixture_inventory");
  const patterns = isRecord(parsed["entity_id_patterns"])
    ? parsed["entity_id_patterns"]
    : {};
  const bindings = isRecord(parsed["identity_bindings"])
    ? parsed["identity_bindings"]
    : {};
  parsed["entity_id_patterns"] = {
    ...patterns,
    RESEARCH_PUBLICATION: "^6529NM-RP-[0-9]{4}$",
    MEDIA_REFERENCE: "^6529NM-MED-[0-9]{4}$",
  };
  parsed["identity_bindings"] = {
    ...bindings,
    INSTITUTION: [
      ...unknownArray(bindings["INSTITUTION"]),
      {
        source_key: "local-qualification:institution",
        entity_id: "6529NM-I-0001",
      },
    ],
    COLLECTION: [
      ...unknownArray(bindings["COLLECTION"]),
      {
        source_key: "local-qualification:collection",
        entity_id: "6529NM-C-0001",
      },
    ],
    ACCESSION: [
      ...unknownArray(bindings["ACCESSION"]),
      {
        source_key: "local-qualification:accession",
        entity_id: "6529NM-ACC-ENT-0001",
      },
    ],
    RESEARCH_PUBLICATION: [
      ...unknownArray(bindings["RESEARCH_PUBLICATION"]),
      {
        source_key: "local-qualification:research-1",
        entity_id: "6529NM-RP-0001",
      },
      {
        source_key: "local-qualification:research-2",
        entity_id: "6529NM-RP-0002",
      },
      {
        source_key: "local-qualification:research-3",
        entity_id: "6529NM-RP-0003",
      },
    ],
  };
  const slugInventory = [...unknownArray(parsed["public_slug_inventory"])];
  if (
    !slugInventory.some(
      (entry) => isRecord(entry) && entry["entity_id"] === "6529NM-RP-0001"
    )
  ) {
    slugInventory.push({
      entity_id: "6529NM-RP-0001",
      entity_type: "RESEARCH_PUBLICATION",
      preferred_label: "The System in Seven States",
      public_slug: "the-system-in-seven-states",
      canonical_route: "/museum/network/research/the-system-in-seven-states",
    });
  }
  parsed["public_slug_inventory"] = slugInventory;
  return { ...document, text: JSON.stringify(parsed) };
}

/**
 * The explicit read-only fixture may complete the four inventory declarations
 * missing from reviewed B. Production loading never uses this transformer and
 * therefore remains fail-closed until a catalog pins a complete inventory.
 */
export function qualifyLocalReadOnlyDocument(
  document: MuseumSourceDocument,
  _sourceCommit: string
): MuseumSourceDocument {
  return document.path === INVENTORY_PATH
    ? qualifyInventory(document)
    : document;
}
