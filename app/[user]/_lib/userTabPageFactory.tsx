import { TransferProvider } from "@/components/nft-transfer/TransferState";
import { getAppMetadata } from "@/components/providers/metadata";
import UserPageClientHydrator from "@/components/user/layout/UserPageClientHydrator";
import UserPageDropModal from "@/components/user/layout/UserPageDropModal";
import UserPageTabTransition from "@/components/user/layout/UserPageTabTransition";
import { getUserPageHeaderState } from "@/components/user/user-page-header/UserPageHeader";
import UserPageHeaderRefresh from "@/components/user/user-page-header/UserPageHeaderRefresh";
import { getHandlesFromProfile } from "@/components/react-query-wrapper/profileQueryHandles";
import { getIdentityQueryKey } from "@/services/api/identity-query";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { cache } from "react";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getMetadataForUserPage, getUserPageTitle } from "@/helpers/Helpers";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { userPageNeedsRedirect } from "@/helpers/server.helpers";
import {
  loadProfileStatements,
  loadUserProfile,
} from "@/helpers/user-page.server";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildProfilePageJsonLd } from "@/lib/structured-data/profile";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type TabProps = { readonly profile: ApiIdentity };
type UserRouteParams = { user: string };
type UserSearchParams = Record<string, string | string[] | undefined>;

const PROBE_USER_SUFFIXES = [
  ".html",
  ".htm",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
] as const;

const PROFILE_NOINDEX_SUBROUTES = new Set([
  "brain",
  "cms/builder",
  "subscriptions",
]);
const PROFILE_BIO_STATEMENT_TYPE: CicStatement["statement_type"] =
  STATEMENT_TYPE.BIO;

const normalizeSearchParams = (
  params?: UserSearchParams | URLSearchParams
): UserSearchParams => {
  if (!params) {
    return {};
  }

  if (params instanceof URLSearchParams) {
    return Array.from(params.entries()).reduce((acc, [key, value]) => {
      const existing = acc[key];
      if (existing === undefined) {
        acc[key] = value;
      } else if (Array.isArray(existing)) {
        acc[key] = [...existing, value];
      } else {
        acc[key] = [existing, value];
      }
      return acc;
    }, {} as UserSearchParams);
  }

  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as UserSearchParams);
};

const serializeSearchParams = (query: UserSearchParams): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (entry !== undefined) params.append(key, entry);
    }
  }
  return params.toString();
};

const isNotFoundError = (error: unknown): boolean => {
  if (
    error === null ||
    error === undefined ||
    (typeof error !== "object" && typeof error !== "string")
  ) {
    return false;
  }

  const status =
    typeof error === "object"
      ? ((error as { status?: number | undefined }).status ??
        (error as { statusCode?: number | undefined }).statusCode ??
        (error as { response?: { status?: number | undefined } | undefined })
          .response?.status)
      : undefined;

  if (status === 404) {
    return true;
  }

  return false;
};

const isProbeLikeUserSlug = (user: string): boolean => {
  const normalized = user.trim().toLowerCase();
  return PROBE_USER_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
};

// The identity request itself is shared with generateMetadata through
// loadUserProfile, so the layout, page and metadata make one request.
export const getUserPageProfile = cache(
  async (user: string): Promise<ApiIdentity> => {
    if (!user || isProbeLikeUserSlug(user)) {
      notFound();
    }
    const result = await loadUserProfile(user.toLowerCase());
    if (!result.ok) {
      if (isNotFoundError(result.error)) {
        notFound();
      }
      throw result.error;
    }
    return result.profile;
  }
);

const loadPublicProfileBio = async (user: string): Promise<string | null> => {
  try {
    const statements = await loadProfileStatements(user);
    return (
      statements.find(
        (statement) =>
          statement.statement_group === STATEMENT_GROUP.GENERAL &&
          statement.statement_type === PROFILE_BIO_STATEMENT_TYPE
      )?.statement_value ?? null
    );
  } catch {
    return null;
  }
};

export function createUserTabPage<
  TExtra extends Record<string, unknown> = Record<string, never>,
>({
  subroute,
  Tab,
  enableTransfer,
  getTabProps,
}: {
  subroute: string;
  Tab: (props: Readonly<TabProps & TExtra>) => React.JSX.Element;
  enableTransfer?: boolean | undefined;
  getTabProps?: (ctx: {
    profile: ApiIdentity;
    query: UserSearchParams;
  }) => Promise<TExtra>;
}) {
  async function Page({
    params,
    searchParams,
  }: {
    readonly params?: Promise<UserRouteParams>;
    readonly searchParams?: Promise<UserSearchParams>;
  }) {
    const resolvedParams = params ? await params : undefined;
    if (!resolvedParams?.user) {
      return notFound();
    }

    const user = resolvedParams.user;
    if (isProbeLikeUserSlug(user)) {
      return notFound();
    }

    const normalizedUser = user.toLowerCase();
    const profileUpdatedAt = Date.now();
    // The identity request and the search params are independent, so they
    // resolve together. The existence check still runs before anything renders
    // or suspends, which keeps unknown profiles on a real 404 status.
    const [resolvedSearchParams, profile] = await Promise.all([
      searchParams,
      getUserPageProfile(user),
    ]);
    const query: UserSearchParams = normalizeSearchParams(resolvedSearchParams);
    const needsXtdhDefault = subroute === "xtdh" && query["tab"] === undefined;
    if (needsXtdhDefault) {
      query["tab"] = "granted";
    }

    const needsRedirect = userPageNeedsRedirect({
      profile,
      req: { query: { ...query, user } },
      subroute,
    });

    if (needsRedirect) {
      return redirect(needsRedirect.redirect.destination);
    }
    if (needsXtdhDefault) {
      return redirect(
        `/${encodeURIComponent(user)}/xtdh?${serializeSearchParams(query)}`
      );
    }

    const headerStatePromise = getUserPageHeaderState(
      normalizedUser,
      profile.id,
      profile.handle?.toLowerCase() ?? null
    );
    const extraProps = getTabProps
      ? await getTabProps({ profile, query })
      : ({} as TExtra);

    const canonicalUser =
      profile.handle ?? profile.primary_wallet ?? normalizedUser;
    const profilePath = `/${encodeURIComponent(canonicalUser)}${
      subroute ? `/${subroute}` : ""
    }`;
    const queryClient = new QueryClient();
    for (const handle of new Set([
      normalizedUser,
      ...getHandlesFromProfile(profile),
    ])) {
      queryClient.setQueryData(getIdentityQueryKey(handle), profile, {
        updatedAt: profileUpdatedAt,
      });
    }

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        {/* The header snapshot streams after the tab instead of holding back
            the first flush; the layout's header shares the same requests. */}
        <UserPageHeaderRefresh state={headerStatePromise} />
        <JsonLdScript
          data={buildProfilePageJsonLd({
            profile,
            path: profilePath,
          })}
        />
        <UserPageClientHydrator
          pageTitle={getUserPageTitle(profile, subroute)}
        />
        <UserPageDropModal />
        <UserPageTabTransition>
          {enableTransfer ? (
            <TransferProvider>
              <Tab profile={profile} {...extraProps} />
            </TransferProvider>
          ) : (
            <Tab profile={profile} {...extraProps} />
          )}
        </UserPageTabTransition>
      </HydrationBoundary>
    );
  }

  async function generateMetadata({
    params,
  }: {
    readonly params?: Promise<UserRouteParams>;
  }): Promise<Metadata> {
    const resolvedParams = params ? await params : undefined;
    if (!resolvedParams?.user) {
      return notFound();
    }

    if (isProbeLikeUserSlug(resolvedParams.user)) {
      return notFound();
    }

    const normalizedUser = resolvedParams.user.toLowerCase();
    // The public bio only needs the route identity, so it loads alongside the
    // profile instead of after it. Both loaders are request-memoized, so the
    // layout, page and header reuse these responses instead of refetching.
    const profilePromise = loadUserProfile(normalizedUser);
    const publicBioPromise = loadPublicProfileBio(normalizedUser);
    const profileResult = await profilePromise;
    if (!profileResult.ok) {
      if (isNotFoundError(profileResult.error)) {
        notFound();
      }
      return getAppMetadata(
        {
          title: t(DEFAULT_LOCALE, "profile.metadata.unavailable.title"),
          description: t(
            DEFAULT_LOCALE,
            "profile.metadata.unavailable.description"
          ),
        },
        { robots: { index: false, follow: true } }
      );
    }
    const profile = profileResult.profile;
    const publicBio = await publicBioPromise;
    const canonicalUser = profile.handle ?? profile.primary_wallet;
    const canonicalUserPath = canonicalUser
      ? `/${encodeURIComponent(canonicalUser)}`
      : undefined;
    const canonicalPath =
      canonicalUserPath && subroute
        ? `${canonicalUserPath}/${subroute}`
        : canonicalUserPath;
    return getAppMetadata(
      getMetadataForUserPage(profile, subroute, publicBio),
      {
        canonicalPath,
        robots: {
          index: !PROFILE_NOINDEX_SUBROUTES.has(subroute),
          follow: true,
        },
      }
    );
  }

  return { Page, generateMetadata };
}
