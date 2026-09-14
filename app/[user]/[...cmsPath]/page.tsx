import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import { ProfileCmsEmptyState } from "@/components/profile-cms/CmsSiteStates";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getUserProfile } from "@/helpers/server.helpers";
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type SupportedLocale,
} from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getProfileCmsPrimarySite } from "@/lib/profile-cms/runtime/fetcher";
import { getCmsPageSocialImage } from "@/lib/profile-cms/runtime/social-image";
import {
  buildProfileCmsPath,
  getCmsPublicPagePath,
  getCmsPublicPath,
  isProfileCmsIndexSegments,
  resolveCmsRoute,
} from "@/lib/profile-cms/runtime/routes";
import { isSafeCmsRelativeUri } from "@/lib/profile-cms/runtime/uri";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type ProfileCmsRouteParams = {
  readonly user: string;
  readonly cmsPath?: string[] | undefined;
};
type ProfileCmsSearchParams = {
  readonly locale?: string | string[] | undefined;
};

export default async function ProfileCmsPage({
  params,
  searchParams,
}: {
  readonly params?: Promise<ProfileCmsRouteParams>;
  readonly searchParams?: Promise<ProfileCmsSearchParams>;
}) {
  const locale = getProfileCmsRouteLocale(await searchParams);
  const context = await getProfileCmsRouteContext(params);
  if (!context) {
    return notFound();
  }

  if (context.redirectTo) {
    redirect(context.redirectTo);
  }

  if (!context.site) {
    if (context.isReadableRequest) return notFound();
    return <ProfileCmsEmptyState locale={locale} />;
  }

  const routeResolution = resolveCmsRoute(
    context.site.cmsPackage,
    context.cmsPath
  );

  if (routeResolution.kind === "redirect") {
    if (
      isProfileOwnedCmsRedirectTarget({
        handle: context.site.cmsPackage.profile.handle,
        target: routeResolution.target,
      })
    ) {
      redirect(
        getCmsPublicPath(context.site.cmsPackage, routeResolution.target)
      );
    }
    return (
      <ProfileCmsEmptyState
        locale={locale}
        title={t(locale, "profileCms.state.routeUnavailable.title")}
      />
    );
  }

  if (routeResolution.kind === "not_found") {
    if (context.isReadableRequest) return notFound();
    return <ProfileCmsEmptyState locale={locale} />;
  }

  return (
    <CmsSiteRenderer
      cmsPackage={context.site.cmsPackage}
      locale={locale}
      page={routeResolution.page}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  readonly params?: Promise<ProfileCmsRouteParams>;
}): Promise<Metadata> {
  const context = await getProfileCmsRouteContext(params);
  if (context?.redirectTo) {
    return {};
  }

  if (!context?.site) {
    return getAppMetadata({
      title: t(DEFAULT_LOCALE, "profileCms.state.empty.title"),
      description: t(DEFAULT_LOCALE, "profileCms.state.empty.description"),
    });
  }

  const routeResolution = resolveCmsRoute(
    context.site.cmsPackage,
    context.cmsPath
  );

  if (routeResolution.kind !== "page") {
    return getAppMetadata({
      title: context.site.cmsPackage.site.title,
      description: context.site.cmsPackage.site.description,
    });
  }

  const page = routeResolution.page;
  const social = getCmsPageSocialImage(
    context.site.cmsPackage,
    page,
    publicEnv.BASE_ENDPOINT
  );
  const socialImage = social?.asset;
  const socialImageUrl = social?.url;

  const metadata = getAppMetadata({
    title: page.metadata.title,
    description: page.metadata.description,
    ...(socialImageUrl ? { ogImage: socialImageUrl } : {}),
    ...(socialImage?.width ? { ogImageWidth: socialImage.width } : {}),
    ...(socialImage?.height ? { ogImageHeight: socialImage.height } : {}),
    ...(socialImage?.alt_text ? { ogImageAlt: socialImage.alt_text } : {}),
  });
  const publicPath = getCmsPublicPagePath(context.site.cmsPackage, page.id);
  if (!publicPath) return metadata;
  const canonical = new URL(publicPath, publicEnv.BASE_ENDPOINT).href;
  return {
    ...metadata,
    ...(page.metadata.robots === "noindex"
      ? { robots: { index: false, follow: true } }
      : {}),
    alternates: { canonical },
    openGraph: { ...metadata.openGraph, url: canonical },
  };
}

async function getProfileCmsRouteContext(
  params: Promise<ProfileCmsRouteParams> | undefined
) {
  const resolvedParams = params ? await params : undefined;
  const user = resolvedParams?.user;
  const cmsPathSegments = resolvedParams?.cmsPath;
  if (!user || !cmsPathSegments?.length) {
    return null;
  }

  const normalizedUser = user.toLowerCase();
  const isReadableRequest = !isProfileCmsIndexSegments(cmsPathSegments);
  const requestCmsPath = buildProfileCmsPath({
    handle: normalizedUser,
    segments: cmsPathSegments,
  });
  if (!requestCmsPath) {
    return null;
  }

  const headers = await getAppCommonHeaders();
  const profile = await getUserProfile({
    user: normalizedUser,
    headers,
  }).catch((error: unknown) => {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  });

  const canonicalHandle = profile.handle?.toLowerCase();
  if (!canonicalHandle) {
    return null;
  }

  if (canonicalHandle !== normalizedUser) {
    return {
      cmsPath: requestCmsPath,
      isReadableRequest,
      redirectTo: `/${encodeURIComponent(canonicalHandle)}/${cmsPathSegments
        .map(encodeCmsPathSegment)
        .join("/")}`,
      site: null,
    };
  }

  const site = await getProfileCmsPrimarySite({
    handle: canonicalHandle,
    headers,
  });
  if (!site) {
    return {
      cmsPath: requestCmsPath,
      isReadableRequest,
      redirectTo: null,
      site: null,
    };
  }

  if (site.cmsPackage.profile.handle.toLowerCase() !== canonicalHandle) {
    return null;
  }

  const canonicalCmsPath = buildProfileCmsPath({
    handle: site.cmsPackage.profile.handle.toLowerCase(),
    segments: cmsPathSegments,
  });
  if (!canonicalCmsPath) {
    return null;
  }

  return {
    cmsPath: canonicalCmsPath,
    isReadableRequest,
    redirectTo: null,
    site,
  };
}

function isNotFoundError(error: unknown): boolean {
  const status = getErrorStatus(error);

  if (status === 404) {
    return true;
  }

  const message = getErrorMessage(error);
  return /not found|404/i.test(message);
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const apiError = error as {
    readonly response?: { readonly status?: number | undefined } | undefined;
    readonly status?: number | undefined;
  };
  return apiError.status ?? apiError.response?.status;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "";
}

function encodeCmsPathSegment(segment: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return encodeURIComponent(segment);
  }
}

function getProfileCmsRouteLocale(
  searchParams: ProfileCmsSearchParams | undefined
): SupportedLocale {
  return normalizeLocale(getSearchParamValue(searchParams?.locale));
}

function getSearchParamValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isProfileOwnedCmsRedirectTarget({
  handle,
  target,
}: {
  readonly handle: string;
  readonly target: string;
}): boolean {
  if (!isSafeCmsRelativeUri(target)) {
    return false;
  }

  const encodedHandle = encodeCmsPathSegment(handle.toLowerCase());
  return target.toLowerCase().startsWith(`/${encodedHandle}/`);
}
