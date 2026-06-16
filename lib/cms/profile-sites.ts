import { publicEnv } from "@/config/env";
import { cmsFixturePackages } from "@/lib/cms/fixtures";
import {
  assertCmsPackageHashes,
  parseCmsPackage,
} from "@/lib/cms/package-utils";
import type { CmsPublishedPackage } from "@/lib/cms/types";

export type PublishedProfileCmsSite = {
  readonly cmsPackage: CmsPublishedPackage;
  readonly staticPath: string;
};

type ProfileIdentifier = {
  readonly handle?: string | null | undefined;
  readonly primary_wallet?: string | null | undefined;
  readonly primary_address?: string | null | undefined;
  readonly query?: string | null | undefined;
};

type ApiCmsPublishedSite = {
  readonly site: {
    readonly primary_static_path?: string | null;
  };
  readonly published_package: {
    readonly static_path: string;
    readonly package_json: unknown;
  };
};

function normalizeIdentifier(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  return normalized;
}

function getProfileIdentifiers(profile: ProfileIdentifier): readonly string[] {
  return [
    normalizeIdentifier(profile.handle),
    normalizeIdentifier(profile.primary_wallet),
    normalizeIdentifier(profile.primary_address),
    normalizeIdentifier(profile.query),
  ].filter((value): value is string => value !== null);
}

function getPackageOwnerIdentifiers(
  cmsPackage: CmsPublishedPackage
): readonly string[] {
  const owner = cmsPackage.payload.site.owner_profile;
  return [
    normalizeIdentifier(owner.handle),
    normalizeIdentifier(owner.id),
  ].filter((value): value is string => value !== null);
}

function getCmsApiUrl(profileHandleOrWallet: string): string {
  return `${publicEnv.API_ENDPOINT}/api/cms/profile/${encodeURIComponent(
    profileHandleOrWallet
  )}/primary`;
}

async function installSsrFetchWhenServerSide(): Promise<void> {
  if (typeof document !== "undefined") {
    return;
  }
  await import("@/lib/fetch/ssrFetch");
}

async function getPublishedCmsSiteFromApi(
  profileHandleOrWallet: string
): Promise<PublishedProfileCmsSite | null> {
  await installSsrFetchWhenServerSide();
  const response = await fetch(getCmsApiUrl(profileHandleOrWallet), {
    cache: "no-store",
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`CMS site lookup failed with status ${response.status}`);
  }

  const apiSite = (await response.json()) as ApiCmsPublishedSite;
  const cmsPackage = parseCmsPackage(apiSite.published_package.package_json);
  assertCmsPackageHashes(cmsPackage);

  return {
    cmsPackage,
    staticPath:
      apiSite.site.primary_static_path ?? apiSite.published_package.static_path,
  };
}

async function getFirstPublishedCmsSiteFromApi(
  identifiers: readonly string[]
): Promise<PublishedProfileCmsSite | null> {
  for (const identifier of identifiers) {
    const site = await getPublishedCmsSiteFromApi(identifier);
    if (site) {
      return site;
    }
  }
  return null;
}

function getPublishedCmsSiteFromFixtures(
  profileIdentifiers: ReadonlySet<string>
): PublishedProfileCmsSite | null {
  const cmsPackage = Object.values(cmsFixturePackages).find((candidate) =>
    getPackageOwnerIdentifiers(candidate).some((identifier) =>
      profileIdentifiers.has(identifier)
    )
  );

  if (!cmsPackage) {
    return null;
  }

  assertCmsPackageHashes(cmsPackage);

  return {
    cmsPackage,
    staticPath: cmsPackage.payload.page.static_export_path,
  };
}

export function getPrimaryCmsSitePath(profileHandleOrWallet: string): string {
  return `/${encodeURIComponent(profileHandleOrWallet)}/index.html`;
}

export async function getPublishedPrimaryCmsSiteForProfile(
  profile: ProfileIdentifier
): Promise<PublishedProfileCmsSite | null> {
  const profileIdentifiers = getProfileIdentifiers(profile);
  if (profileIdentifiers.length === 0) {
    return null;
  }

  try {
    const apiSite = await getFirstPublishedCmsSiteFromApi(profileIdentifiers);
    if (apiSite) {
      return apiSite;
    }
  } catch (error) {
    console.warn(
      "CMS primary site API lookup failed, falling back to local fixtures.",
      error instanceof Error ? error.message : error
    );
  }

  return getPublishedCmsSiteFromFixtures(new Set(profileIdentifiers));
}

export async function getPublishedPrimaryCmsSiteForProfileIdentifier(
  profileHandleOrWallet: string
): Promise<PublishedProfileCmsSite | null> {
  return getPublishedPrimaryCmsSiteForProfile({
    handle: profileHandleOrWallet,
    primary_wallet: profileHandleOrWallet,
    query: profileHandleOrWallet,
  });
}
