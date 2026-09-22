import { TransferProvider } from "@/components/nft-transfer/TransferState";
import { getAppMetadata } from "@/components/providers/metadata";
import UserPageLayout from "@/components/user/layout/UserPageLayout";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getMetadataForUserPage, getUserPageTitle } from "@/helpers/Helpers";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import {
  getUserProfile,
  userPageNeedsRedirect,
} from "@/helpers/server.helpers";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildProfilePageJsonLd } from "@/lib/structured-data/profile";
import { commonApiFetch } from "@/services/api/common-api";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type TabProps = { readonly profile: ApiIdentity };
type UserRouteParams = { user: string };
type UserSearchParams = Record<string, string | string[] | undefined>;
type ProfileLoadResult =
  | { readonly ok: true; readonly profile: ApiIdentity }
  | { readonly ok: false; readonly error: unknown };

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

const loadProfile = async (
  user: string,
  headers: Record<string, string>
): Promise<ProfileLoadResult> => {
  try {
    return { ok: true, profile: await getUserProfile({ user, headers }) };
  } catch (error) {
    return { ok: false, error };
  }
};

const loadPublicProfileBio = async (
  user: string,
  headers: Record<string, string>
): Promise<string | null> => {
  try {
    const statements = await commonApiFetch<CicStatement[]>({
      endpoint: `profiles/${encodeURIComponent(user)}/cic/statements`,
      headers,
    });
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
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const query: UserSearchParams = normalizeSearchParams(resolvedSearchParams);
    const headers = await getAppCommonHeaders();
    const profileResult = await loadProfile(normalizedUser, headers);
    if (!profileResult.ok) {
      if (isNotFoundError(profileResult.error)) {
        notFound();
      }
      throw profileResult.error;
    }
    const profile = profileResult.profile;

    const needsRedirect = userPageNeedsRedirect({
      profile,
      req: { query: { ...query, user } },
      subroute,
    });

    if (needsRedirect) {
      redirect(needsRedirect.redirect.destination);
    }

    const extraProps = getTabProps
      ? await getTabProps({ profile, query })
      : ({} as TExtra);

    const canonicalUser =
      profile.handle ?? profile.primary_wallet ?? normalizedUser;
    const profilePath = `/${encodeURIComponent(canonicalUser)}${
      subroute ? `/${subroute}` : ""
    }`;

    const TabComponent = (
      <>
        <JsonLdScript
          data={buildProfilePageJsonLd({
            profile,
            path: profilePath,
          })}
        />
        <UserPageLayout
          profile={profile}
          handleOrWallet={normalizedUser}
          pageTitle={getUserPageTitle(profile, subroute)}
        >
          <Tab profile={profile} {...extraProps} />
        </UserPageLayout>
      </>
    );

    if (enableTransfer) {
      return <TransferProvider>{TabComponent}</TransferProvider>;
    }

    return TabComponent;
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
    const headers = await getAppCommonHeaders();
    const profileResult = await loadProfile(normalizedUser, headers);
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
    const publicBio = await loadPublicProfileBio(normalizedUser, headers);
    const canonicalUser = profile.handle ?? profile.primary_wallet;
    const canonicalUserPath = canonicalUser
      ? `/${encodeURIComponent(canonicalUser)}`
      : undefined;
    const canonicalPath =
      canonicalUserPath && subroute
        ? `${canonicalUserPath}/${subroute}`
        : canonicalUserPath;
    return getAppMetadata(getMetadataForUserPage(profile, subroute, publicBio), {
      canonicalPath,
      robots: {
        index: !PROFILE_NOINDEX_SUBROUTES.has(subroute),
        follow: true,
      },
    });
  }

  return { Page, generateMetadata };
}
