const GITHUB_API_ORIGIN = "https://api.github.com";
const GITHUB_RAW_ORIGIN = "https://raw.githubusercontent.com";
const GITHUB_WEB_ORIGIN = "https://github.com";
const MUSEUM_REPOSITORY = "6529-Collections/6529networkmuseum";
const SUPPORTED_CONTENT_EXTENSIONS = [".json", ".md", ".txt"] as const;
const SUPPORTED_MEDIA_EXTENSIONS = [
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".json",
  ".pdf",
  ".png",
  ".svg",
  ".webp",
] as const;
const SUPPORTED_VISUAL_MEDIA_EXTENSIONS = [
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
] as const;

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
    path.includes("?") ||
    path.includes("#") ||
    /\s/u.test(path) ||
    /[\u0000-\u001f\u007f]/u.test(path)
  ) {
    throw new Error("publication_unsafe_path");
  }

  const segments = path.split("/");
  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        segment === ".git"
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

export function assertGovernedMuseumMediaPath(path: string): void {
  assertSafeMuseumRepositoryPath(path);
  if (!SUPPORTED_MEDIA_EXTENSIONS.some((suffix) => path.endsWith(suffix))) {
    throw new Error("publication_unsupported_media_extension");
  }
}

export function assertGovernedMuseumVisualMediaPath(path: string): void {
  assertSafeMuseumRepositoryPath(path);
  if (
    !SUPPORTED_VISUAL_MEDIA_EXTENSIONS.some((suffix) => path.endsWith(suffix))
  ) {
    throw new Error("publication_unsupported_visual_media_extension");
  }
}

function encodeRepositoryPath(path: string): string {
  assertSafeMuseumRepositoryPath(path);
  if (
    !SUPPORTED_CONTENT_EXTENSIONS.some((suffix) => path.endsWith(suffix)) &&
    !SUPPORTED_MEDIA_EXTENSIONS.some((suffix) => path.endsWith(suffix))
  ) {
    throw new Error("publication_unsupported_extension");
  }
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
  return buildMuseumBlobUrl(commit, path, hash);
}

/**
 * Builds the immutable GitHub source page URL used for visitor citations.
 * Runtime bytes must use buildImmutableMuseumRawUrl; this URL is never a
 * fetch authority.
 */
export function buildImmutableMuseumSourceUrl(
  commit: string,
  path: string
): string {
  if (!isExactGitCommit(commit)) {
    throw new Error("publication_invalid_commit");
  }
  assertSafeMuseumRepositoryPath(path);
  if (
    !SUPPORTED_CONTENT_EXTENSIONS.some((suffix) => path.endsWith(suffix)) &&
    !SUPPORTED_MEDIA_EXTENSIONS.some((suffix) => path.endsWith(suffix))
  ) {
    throw new Error("publication_unsupported_extension");
  }
  return `${GITHUB_WEB_ORIGIN}/${MUSEUM_REPOSITORY}/blob/${commit}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function buildMuseumBlobUrl(
  ref: string,
  path: string,
  hash: string
): string | null {
  if (hash.length > 0 && !hash.startsWith("#")) {
    return null;
  }
  try {
    return `${GITHUB_WEB_ORIGIN}/${MUSEUM_REPOSITORY}/blob/${ref}/${encodeRepositoryPath(path)}${hash}`;
  } catch {
    return null;
  }
}

export function buildImmutableMuseumCommitUrl(
  commit: string | null
): string | null {
  if (!commit || !isExactGitCommit(commit)) {
    return null;
  }
  return `${GITHUB_WEB_ORIGIN}/${MUSEUM_REPOSITORY}/tree/${commit}`;
}

export function buildMuseumMainBlobUrl(path: string, hash = ""): string | null {
  return buildMuseumBlobUrl("main", path, hash);
}

export function buildMuseumMainEditUrl(path: string): string | null {
  try {
    return `${GITHUB_WEB_ORIGIN}/${MUSEUM_REPOSITORY}/edit/main/${encodeRepositoryPath(path)}`;
  } catch {
    return null;
  }
}

export function buildImmutableMuseumEditUrl(
  commit: string | null,
  path: string
): string | null {
  if (!commit || !isExactGitCommit(commit)) {
    return null;
  }
  try {
    return `${GITHUB_WEB_ORIGIN}/${MUSEUM_REPOSITORY}/edit/${commit}/${encodeRepositoryPath(path)}`;
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
    parsed.toString() !== url ||
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

export function assertApprovedArtBlocksMediaUrl(url: string): {
  readonly url: string;
  readonly kind: "still" | "live";
} {
  for (const kind of ["still", "live"] as const) {
    try {
      return { url: assertApprovedArtBlocksUrl(url, kind), kind };
    } catch {
      // Try the other exact Art Blocks media shape before failing closed.
    }
  }
  throw new Error("publication_unapproved_media_origin");
}

export function assertApprovedMuseumRepositoryMediaUrl(
  sourceCommit: string,
  repositoryPath: string | null,
  catalogMediaAssetPaths: ReadonlySet<string>
): string {
  if (repositoryPath === null || !catalogMediaAssetPaths.has(repositoryPath)) {
    throw new Error("publication_unapproved_retained_media_origin");
  }
  assertGovernedMuseumVisualMediaPath(repositoryPath);
  return buildImmutableMuseumRawUrl(sourceCommit, repositoryPath);
}
