import type {
  CmsNavigationItemV1,
  CmsPackageV1,
  CmsPageV1,
} from "@/lib/profile-cms/protocol/v1";
import { isSafeCmsRelativeUri } from "@/lib/profile-cms/runtime/uri";
import { isReservedCmsProfileSegment } from "./page-slugs";

type CmsRouteV1 = CmsPackageV1["payload"]["routes"][number];

type CmsRouteResolution =
  | {
      readonly kind: "page";
      readonly route: CmsRouteV1;
      readonly page: CmsPageV1;
    }
  | {
      readonly kind: "redirect";
      readonly route: CmsRouteV1;
      readonly target: string;
    }
  | {
      readonly kind: "not_found";
      readonly reason: "route_missing" | "page_missing" | "unsafe_redirect";
    };

export function isProfileCmsIndexSegments(
  segments: readonly string[] | undefined
): segments is readonly [string, ...string[]] {
  if (!segments?.length) {
    return false;
  }

  const lastSegment = segments.at(-1);
  return lastSegment?.toLowerCase() === "index.html";
}

export function buildProfileCmsPath({
  handle,
  segments,
}: {
  readonly handle: string;
  readonly segments: readonly string[];
}): string | null {
  if (!handle.trim() || segments.length === 0) {
    return null;
  }
  const decodedSegments = segments.map(decodeCmsPathSegment);
  if (decodedSegments.some((segment) => segment === null)) return null;
  const safeSegments = decodedSegments.filter(
    (segment): segment is string => segment !== null
  );
  const isArchivePath = isProfileCmsIndexSegments(safeSegments);
  if (
    isArchivePath &&
    safeSegments.length > 1 &&
    isReservedCmsProfileSegment(safeSegments[0])
  )
    return null;
  if (!isArchivePath && !isReadableCmsSegments(safeSegments)) return null;
  const normalizedSegments = isArchivePath
    ? [...safeSegments.slice(0, -1), "index.html"]
    : [...safeSegments, "index.html"];
  const pathSegments = [
    encodeCmsPathSegment(handle.trim()),
    ...normalizedSegments.map(encodeURIComponent),
  ];
  return `/${pathSegments.join("/")}`;
}

export function resolveCmsRoute(
  cmsPackage: CmsPackageV1,
  path: string
): CmsRouteResolution {
  return resolveCmsRouteInternal(
    cmsPackage,
    normalizeCmsHandleSegment(path),
    new Set<string>()
  );
}

export function getCmsPagePath(
  cmsPackage: CmsPackageV1,
  pageId: string
): string | null {
  const route = cmsPackage.payload.routes.find(
    (candidate) => candidate.page_id === pageId && candidate.kind === "page"
  );
  if (route) {
    return normalizeCmsHandleSegment(route.path);
  }

  const page = cmsPackage.payload.pages.find(
    (candidate) => candidate.id === pageId
  );
  return page ? normalizeCmsHandleSegment(page.path) : null;
}

/** A visitor URL; stored page paths and recovered filenames stay unchanged. */
export function getCmsPublicPagePath(
  cmsPackage: CmsPackageV1,
  pageId: string
): string | null {
  const path = getCmsPagePath(cmsPackage, pageId);
  return path ? getCmsPublicPath(cmsPackage, path) : null;
}

/** Only rewrite declared CMS destinations, never profile or external links. */
export function getCmsPublicPath(
  cmsPackage: CmsPackageV1,
  archivePath: string
): string {
  if (!isSafeCmsRelativeUri(archivePath)) return archivePath;
  const suffixAt = archivePath.search(/[?#]/);
  const suffix = suffixAt < 0 ? "" : archivePath.slice(suffixAt);
  const rawPath = suffixAt < 0 ? archivePath : archivePath.slice(0, suffixAt);
  let path = normalizeCmsHandleSegment(rawPath);
  const resolution = resolveCmsRoute(cmsPackage, path);
  if (resolution.kind === "not_found") return `${path}${suffix}`;
  const root = `/${cmsPackage.profile.handle.toLowerCase()}/index.html`;
  if (path === root && resolution.kind === "page") {
    path = getCmsPagePath(cmsPackage, resolution.page.id) ?? path;
  }
  const segments = path.split("/").slice(2, -1).map(decodeCmsPathSegment);
  if (
    !path.endsWith("/index.html") ||
    segments.some((segment) => segment === null) ||
    !isReadableCmsSegments(segments.filter((segment) => segment !== null))
  ) {
    return `${path}${suffix}`;
  }
  return `${path.slice(0, -"/index.html".length)}${suffix}`;
}

function isReadableCmsSegments(segments: readonly string[]): boolean {
  return (
    segments.length > 0 &&
    !isReservedCmsProfileSegment(segments[0] ?? "") &&
    segments.every((segment) => /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(segment))
  );
}

function decodeCmsPathSegment(segment: string): string | null {
  try {
    const decoded = decodeURIComponent(segment);
    return !decoded ||
      decoded === "." ||
      decoded === ".." ||
      /[/\\?#\u0000-\u001f\u007f]/.test(decoded)
      ? null
      : decoded;
  } catch {
    return null;
  }
}

export function getCmsNavigationItems(
  cmsPackage: CmsPackageV1
): CmsNavigationItemV1[] {
  const items =
    cmsPackage.payload.navigation.find(
      (navigation) => navigation.id === cmsPackage.site.navigation_id
    )?.items ?? [];
  return items.map((item) => normalizeCmsNavigationItem(item, cmsPackage));
}

/**
 * Published packages may retain display-case handles, while runtime requests
 * use canonical lowercase handles. Preserve page slugs, queries, and fragments.
 */
function normalizeCmsHandleSegment(path: string): string {
  if (!isSafeCmsRelativeUri(path)) {
    return path;
  }
  return path.replace(/^\/[^/?#]+/, (handle) => handle.toLowerCase());
}

function normalizeCmsNavigationItem(
  item: CmsNavigationItemV1,
  cmsPackage: CmsPackageV1
): CmsNavigationItemV1 {
  return {
    ...item,
    ...(item.url ? { url: getCmsPublicPath(cmsPackage, item.url) } : {}),
    ...(item.children
      ? {
          children: item.children.map((child) =>
            normalizeCmsNavigationItem(child, cmsPackage)
          ),
        }
      : {}),
  };
}

function resolveCmsRouteInternal(
  cmsPackage: CmsPackageV1,
  path: string,
  seenPaths: Set<string>
): CmsRouteResolution {
  if (seenPaths.has(path)) {
    return { kind: "not_found", reason: "route_missing" };
  }
  seenPaths.add(path);

  const matchingRoutes = cmsPackage.payload.routes.filter(
    (candidate) => normalizeCmsHandleSegment(candidate.path) === path
  );
  // Never let manifest ordering choose between conflicting canonical routes.
  const route = matchingRoutes.length === 1 ? matchingRoutes[0] : undefined;
  if (!route) {
    return { kind: "not_found", reason: "route_missing" };
  }

  if (route.kind === "redirect") {
    if (!route.target || !isSafeCmsRelativeUri(route.target)) {
      return { kind: "not_found", reason: "unsafe_redirect" };
    }
    return {
      kind: "redirect",
      route,
      target: normalizeCmsHandleSegment(route.target),
    };
  }

  if (route.kind === "alias") {
    if (!route.target) {
      return { kind: "not_found", reason: "route_missing" };
    }
    if (route.target.startsWith("/")) {
      return resolveCmsRouteInternal(
        cmsPackage,
        normalizeCmsHandleSegment(route.target),
        seenPaths
      );
    }
    const page = cmsPackage.payload.pages.find(
      (candidate) => candidate.id === route.target
    );
    return page
      ? { kind: "page", route, page }
      : { kind: "not_found", reason: "page_missing" };
  }

  if (!route.page_id) {
    return { kind: "not_found", reason: "page_missing" };
  }

  const page = cmsPackage.payload.pages.find(
    (candidate) => candidate.id === route.page_id
  );
  return page
    ? { kind: "page", route, page }
    : { kind: "not_found", reason: "page_missing" };
}

function encodeCmsPathSegment(segment: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return encodeURIComponent(segment);
  }
}
