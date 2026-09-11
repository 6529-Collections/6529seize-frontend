import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { compareMuseumCatalogPaths } from "./catalog-contract";
import {
  assertGovernedMuseumVisualMediaPath,
  isExactGitCommit,
} from "./security";

const VISITOR_BUNDLE_PATH = "records/publication/visitor-corpus-bundle-v1.json";

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (typeof input.url === "string") return input.url;
  throw new Error("publication_local_fixture_url");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

/**
 * Test-only catalog boundary for deferred media. Production receives this
 * set from the verified publication catalog; a local fixture must opt into
 * the same exact path set instead of treating every repository file as media.
 */
export function readMuseumLocalFixtureMediaAssetPaths(
  root: string,
  sourceCommit: string
): readonly string[] {
  if (!isExactGitCommit(sourceCommit)) {
    throw new Error("publication_local_fixture_commit");
  }
  const catalogPath = join(
    root,
    "release-artifacts",
    "catalog",
    `6529NM-PUBCAT-${sourceCommit}.json`
  );
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- the path is confined to the validated fixture root.
  if (!existsSync(catalogPath)) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      /* eslint-disable-next-line security/detect-non-literal-fs-filename -- the path is confined to the validated fixture root. */
      readFileSync(catalogPath, "utf8")
    ) as unknown;
  } catch {
    throw new Error("publication_local_fixture_catalog_json");
  }
  if (!isRecord(parsed) || !isRecord(parsed["payload"])) {
    throw new Error("publication_local_fixture_catalog_shape");
  }
  const mediaAssets = parsed["payload"]["media_assets"];
  if (!Array.isArray(mediaAssets)) {
    throw new Error("publication_local_fixture_catalog_media_assets");
  }
  const paths = mediaAssets.map((entry) => {
    if (!isRecord(entry) || typeof entry["path"] !== "string") {
      throw new Error("publication_local_fixture_catalog_media_asset");
    }
    assertGovernedMuseumVisualMediaPath(entry["path"]);
    return entry["path"];
  });
  const sorted = [...paths].sort(compareMuseumCatalogPaths);
  if (
    new Set(paths).size !== paths.length ||
    paths.some((path, index) => path !== sorted[index])
  ) {
    throw new Error("publication_local_fixture_catalog_media_assets");
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
