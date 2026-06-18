import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import { ProfileCmsEmptyState } from "@/components/profile-cms/CmsSiteStates";
import { getAppMetadata } from "@/components/providers/metadata";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getUserProfile } from "@/helpers/server.helpers";
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type SupportedLocale,
} from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getProfileCmsPrimarySite } from "@/lib/profile-cms/runtime/fetcher";
import {
  buildProfileCmsPath,
  resolveCmsRoute,
} from "@/lib/profile-cms/runtime/routes";
import {
  isSafeCmsRelativeUri,
  resolveCmsUri,
} from "@/lib/profile-cms/runtime/uri";
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
      redirect(routeResolution.target);
    }
    return (
      <ProfileCmsEmptyState
        locale={locale}
        title={t(locale, "profileCms.state.routeUnavailable.title")}
      />
    );
  }

  if (routeResolution.kind === "not_found") {
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
  const socialImage = context.site.cmsPackage.payload.assets.find(
    (asset) => asset.id === page.metadata.social_image_asset_id
  );
  const socialImageUrl = resolveCmsUri(socialImage?.uri);

  return getAppMetadata({
    title: page.metadata.title,
    description: page.metadata.description,
    ...(socialImageUrl ? { ogImage: socialImageUrl } : {}),
    ...(socialImage?.width ? { ogImageWidth: socialImage.width } : {}),
    ...(socialImage?.height ? { ogImageHeight: socialImage.height } : {}),
    ...(socialImage?.alt_text ? { ogImageAlt: socialImage.alt_text } : {}),
  });
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
