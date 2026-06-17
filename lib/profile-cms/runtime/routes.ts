import type {
  CmsNavigationItemV1,
  CmsPackageV1,
  CmsPageV1,
} from "@/lib/profile-cms/protocol/v1";
import { isSafeCmsUri } from "@/lib/profile-cms/runtime/uri";

type CmsRouteV1 = CmsPackageV1["payload"]["routes"][number];

export type CmsRouteResolution =
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

  const lastSegment = segments[segments.length - 1];
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

  const pathSegments = [handle, ...segments].map((segment) =>
    encodeCmsPathSegment(segment.trim())
  );
  return `/${pathSegments.join("/")}`;
}

export function resolveCmsRoute(
  cmsPackage: CmsPackageV1,
  path: string
): CmsRouteResolution {
  return resolveCmsRouteInternal(cmsPackage, path, new Set<string>());
}

export function getCmsPagePath(
  cmsPackage: CmsPackageV1,
  pageId: string
): string | null {
  const route = cmsPackage.payload.routes.find(
    (candidate) => candidate.page_id === pageId && candidate.kind === "page"
  );
  if (route) {
    return route.path;
  }

  return (
    cmsPackage.payload.pages.find((candidate) => candidate.id === pageId)
      ?.path ?? null
  );
}

export function getCmsNavigationItems(
  cmsPackage: CmsPackageV1
): CmsNavigationItemV1[] {
  return (
    cmsPackage.payload.navigation.find(
      (navigation) => navigation.id === cmsPackage.site.navigation_id
    )?.items ?? []
  );
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

  const route = cmsPackage.payload.routes.find(
    (candidate) => candidate.path === path
  );
  if (!route) {
    return { kind: "not_found", reason: "route_missing" };
  }

  if (route.kind === "redirect") {
    if (!route.target || !isSafeCmsUri(route.target, { allowRelative: true })) {
      return { kind: "not_found", reason: "unsafe_redirect" };
    }
    return { kind: "redirect", route, target: route.target };
  }

  if (route.kind === "alias") {
    if (!route.target) {
      return { kind: "not_found", reason: "route_missing" };
    }
    if (route.target.startsWith("/")) {
      return resolveCmsRouteInternal(cmsPackage, route.target, seenPaths);
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
