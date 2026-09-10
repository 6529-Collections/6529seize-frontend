import type {
  CmsNavigationItemV1,
  CmsPackageV1,
  CmsPageV1,
} from "@/lib/profile-cms/protocol/v1";
import { isSafeCmsRelativeUri } from "@/lib/profile-cms/runtime/uri";

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
  if (!handle.trim() || !isProfileCmsIndexSegments(segments)) {
    return null;
  }

  const normalizedSegments = segments.map((segment, index) =>
    index === segments.length - 1 ? "index.html" : segment
  );
  const pathSegments = [handle, ...normalizedSegments].map((segment) =>
    encodeCmsPathSegment(segment.trim())
  );
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

export function getCmsNavigationItems(
  cmsPackage: CmsPackageV1
): CmsNavigationItemV1[] {
  const items =
    cmsPackage.payload.navigation.find(
      (navigation) => navigation.id === cmsPackage.site.navigation_id
    )?.items ?? [];
  return items.map((item) => normalizeCmsNavigationItem(item));
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
  item: CmsNavigationItemV1
): CmsNavigationItemV1 {
  return {
    ...item,
    ...(item.url ? { url: normalizeCmsHandleSegment(item.url) } : {}),
    ...(item.children
      ? {
          children: item.children.map((child) =>
            normalizeCmsNavigationItem(child)
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
