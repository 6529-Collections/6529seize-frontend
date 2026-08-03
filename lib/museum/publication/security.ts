const GITHUB_API_ORIGIN = "https://api.github.com";
const GITHUB_RAW_ORIGIN = "https://raw.githubusercontent.com";
const GITHUB_WEB_ORIGIN = "https://github.com";
const MUSEUM_REPOSITORY = "6529-Collections/6529networkmuseum";
const SUPPORTED_CONTENT_EXTENSIONS = [".json", ".md"] as const;

const ART_BLOCKS_HOSTS = {
  live: "generator.artblocks.io",
  still: "media-proxy.artblocks.io",
} as const;
const ART_BLOCKS_PATH_PATTERNS = {
  live: /^\/1\/0x[a-f\d]{40}\/\d+$/u,
  still: /^\/1\/0x[a-f\d]{40}\/\d+\.png$/u,
} as const;

export const MUSEUM_MANIFEST_PATH =
  "release-artifacts/latest/record-manifest.json" as const;
export const MUSEUM_REPOSITORY_NAME = MUSEUM_REPOSITORY;

export function isExactGitCommit(value: string): boolean {
  return /^[a-f0-9]{40}$/u.test(value);
}

export function assertSafeMuseumRepositoryPath(path: string): void {
  if (
    path.length === 0 ||
    path.length > 512 ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("%") ||
    path.includes(":") ||
    /[\u0000-\u001f\u007f]/u.test(path)
  ) {
    throw new Error("publication_unsafe_path");
  }

  const segments = path.split("/");
  if (
    segments.some(
      (segment) => segment.length === 0 || segment === "." || segment === ".."
    )
  ) {
    throw new Error("publication_unsafe_path");
  }
}

export function assertGovernedMuseumPath(path: string): void {
  assertSafeMuseumRepositoryPath(path);
  if (!SUPPORTED_CONTENT_EXTENSIONS.some((suffix) => path.endsWith(suffix))) {
    throw new Error("publication_unsupported_extension");
  }
}

function encodeRepositoryPath(path: string): string {
  assertGovernedMuseumPath(path);
  return path.split("/").map(encodeURIComponent).join("/");
}

export function buildGitHubCommitResolutionUrl(ref: string): string {
  if (
    ref.length === 0 ||
    ref.length > 255 ||
    /[\u0000-\u001f\u007f]/u.test(ref)
  ) {
    throw new Error("publication_invalid_ref");
  }

  return `${GITHUB_API_ORIGIN}/repos/${MUSEUM_REPOSITORY}/git/ref/heads/${encodeURIComponent(ref)}`;
}

export function buildImmutableMuseumRawUrl(
  commit: string,
  path: string
): string {
  if (!isExactGitCommit(commit)) {
    throw new Error("publication_invalid_commit");
  }

  return `${GITHUB_RAW_ORIGIN}/${MUSEUM_REPOSITORY}/${commit}/${encodeRepositoryPath(path)}`;
}

export function buildImmutableMuseumBlobUrl(
  commit: string | null,
  path: string,
  hash = ""
): string | null {
  if (!commit || !isExactGitCommit(commit)) {
    return null;
  }
  if (hash.length > 0 && !hash.startsWith("#")) {
    return null;
  }
  try {
    return `${GITHUB_WEB_ORIGIN}/${MUSEUM_REPOSITORY}/blob/${commit}/${encodeRepositoryPath(path)}${hash}`;
  } catch {
    return null;
  }
}

export function assertApprovedGitHubUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("publication_unapproved_origin");
  }

  const approvedOrigin =
    parsed.origin === GITHUB_API_ORIGIN || parsed.origin === GITHUB_RAW_ORIGIN;
  if (
    !approvedOrigin ||
    parsed.username.length > 0 ||
    parsed.password.length > 0 ||
    parsed.port.length > 0
  ) {
    throw new Error("publication_unapproved_origin");
  }
}

export function assertApprovedArtBlocksUrl(
  url: string,
  kind: "still" | "live"
): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("publication_unapproved_media_origin");
  }

  const expectedHost = ART_BLOCKS_HOSTS[kind];
  const pathPattern = ART_BLOCKS_PATH_PATTERNS[kind];
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== expectedHost ||
    parsed.username.length > 0 ||
    parsed.password.length > 0 ||
    parsed.port.length > 0 ||
    parsed.search.length > 0 ||
    parsed.hash.length > 0 ||
    !pathPattern.test(parsed.pathname)
  ) {
    throw new Error("publication_unapproved_media_origin");
  }

  return parsed.toString();
}
