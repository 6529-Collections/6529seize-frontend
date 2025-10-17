import { cache } from "react";
import { getAppMetadata } from "@/components/providers/metadata";
import UserPageLayout, {
  type UserPageLayoutProps,
} from "@/components/user/layout/UserPageLayout";
import { prefetchUserPageHeaderData } from "@/components/user/user-page-header/userPageHeaderPrefetch";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { getMetadataForUserPage } from "@/helpers/Helpers";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import {
  getUserProfile,
  userPageNeedsRedirect,
} from "@/helpers/server.helpers";
import { withServerTiming } from "@/helpers/performance.helpers";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type TabProps = { readonly profile: ApiIdentity };

type PrepareArgs = Readonly<{
  profile: ApiIdentity;
  headers: Record<string, string>;
  user: string;
  query: UserSearchParams;
}>;

type PrepareResult<TTabExtraProps extends Record<string, unknown>> = Readonly<{
  tabProps?: TTabExtraProps;
  layoutProps?: Partial<UserPageLayoutProps>;
}>;

type FactoryArgs<
  TTabExtraProps extends Record<string, unknown> = Record<string, never>
> = Readonly<{
  subroute: string;
  metaLabel: string;
  Tab: (props: Readonly<TabProps & TTabExtraProps>) => React.JSX.Element;
  prepare?: (
    args: PrepareArgs
  ) => Promise<PrepareResult<TTabExtraProps>>;
}>;

type UserRouteParams = { user: string };
type UserSearchParams = Record<string, string | string[] | undefined>;

const normalizeSearchParams = (
  params?: UserSearchParams | URLSearchParams
): UserSearchParams => {
  if (!params) {
    return {};
  }

  if (params instanceof URLSearchParams) {
    return Array.from(params.entries()).reduce(
      (acc, [key, value]) => {
        const existing = acc[key];
        if (existing === undefined) {
          acc[key] = value;
        } else if (Array.isArray(existing)) {
          acc[key] = [...existing, value];
        } else {
          acc[key] = [existing, value];
        }
        return acc;
      },
      {} as UserSearchParams
    );
  }

  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as UserSearchParams);
};

const isNotFoundError = (error: unknown): boolean => {
  if (!error || (typeof error !== "object" && typeof error !== "string")) {
    return false;
  }

  const status =
    typeof error === "object" && error !== null
      ? (error as { status?: number }).status ??
        (error as { statusCode?: number }).statusCode ??
        (error as { response?: { status?: number } }).response?.status
      : undefined;

  if (status === 404) {
    return true;
  }

  let message: string | undefined;

  if (typeof error === "string") {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return !!message && message.toLowerCase().includes("not found");
};

type ResolvedProfile = Readonly<{
  profile: ApiIdentity;
  headers: Record<string, string>;
}>;

const resolveUserProfile = cache(
  async (normalizedUser: string): Promise<ResolvedProfile> => {
    const headers = await getAppCommonHeaders();
    try {
      const profile = await withServerTiming(
        `identity-profile:${normalizedUser}`,
        async () =>
          await getUserProfile({
            user: normalizedUser,
            headers,
          })
      );
      return { profile, headers };
    } catch (error) {
      if (isNotFoundError(error)) {
        notFound();
      }
      throw error;
    }
  }
);

export function createUserTabPage<
  TTabExtraProps extends Record<string, unknown> = Record<string, never>
>({ subroute, metaLabel, Tab, prepare }: FactoryArgs<TTabExtraProps>) {
  async function Page({
    params,
    searchParams,
  }: {
    readonly params?: UserRouteParams;
    readonly searchParams?: UserSearchParams;
  }): Promise<React.JSX.Element>;
  async function Page({
    params,
    searchParams,
  }: {
    readonly params?: Promise<UserRouteParams>;
    readonly searchParams?: Promise<UserSearchParams>;
  }): Promise<React.JSX.Element>;
  async function Page({
    params,
    searchParams,
  }: {
    readonly params?:
      | UserRouteParams
      | Promise<UserRouteParams>;
    readonly searchParams?:
      | UserSearchParams
      | Promise<UserSearchParams>;
  }): Promise<React.JSX.Element> {
    const resolvedParams = params ? await params : undefined;
    if (!resolvedParams?.user) {
      notFound();
    }

    const user = resolvedParams.user;
    const normalizedUser = user.toLowerCase();
    const resolvedSearchParams = searchParams
      ? await searchParams
      : undefined;
    const query: UserSearchParams =
      normalizeSearchParams(resolvedSearchParams);
    const { profile, headers } = await resolveUserProfile(normalizedUser);

    const prepared = prepare
      ? await prepare({
          profile,
          headers,
          user: normalizedUser,
          query,
        })
      : undefined;

    const needsRedirect = userPageNeedsRedirect({
      profile,
      req: { query: { ...query, user } },
      subroute,
    });

    if (needsRedirect) {
      redirect(needsRedirect.redirect.destination);
    }

    const headerPrefetch = await prefetchUserPageHeaderData({
      profile,
      headers,
      handleOrWallet: normalizedUser,
    });

    const layoutPropsFromPrepare = prepared?.layoutProps ?? {};

    const layoutProps: Partial<UserPageLayoutProps> = {
      ...layoutPropsFromPrepare,
      initialStatements:
        layoutPropsFromPrepare.initialStatements !== undefined
          ? layoutPropsFromPrepare.initialStatements
          : headerPrefetch.statements,
      profileEnabledAt:
        layoutPropsFromPrepare.profileEnabledAt !== undefined
          ? layoutPropsFromPrepare.profileEnabledAt
          : headerPrefetch.profileEnabledAt,
      followersCount:
        layoutPropsFromPrepare.followersCount !== undefined
          ? layoutPropsFromPrepare.followersCount
          : headerPrefetch.followersCount,
    };

    return (
      <UserPageLayout
        profile={profile}
        handleOrWallet={normalizedUser}
        {...layoutProps}
      >
        <Tab
          profile={profile}
          {...((prepared?.tabProps ?? {}) as TTabExtraProps)}
        />
      </UserPageLayout>
    );
  }

  async function generateMetadata({
    params,
  }: {
    readonly params?: UserRouteParams;
  }): Promise<Metadata>;
  async function generateMetadata({
    params,
  }: {
    readonly params?: Promise<UserRouteParams>;
  }): Promise<Metadata>;
  async function generateMetadata({
    params,
  }: {
    readonly params?: UserRouteParams | Promise<UserRouteParams>;
  }): Promise<Metadata> {
    const resolvedParams = params ? await params : undefined;
    if (!resolvedParams?.user) {
      notFound();
    }

    const normalizedUser = resolvedParams.user.toLowerCase();
    const { profile } = await resolveUserProfile(normalizedUser);
    return getAppMetadata(getMetadataForUserPage(profile, metaLabel));
  }

  return { Page, generateMetadata };
}
