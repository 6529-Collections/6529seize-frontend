import { getAppMetadata } from "@/components/providers/metadata";
import UserPageLayout from "@/components/user/layout/UserPageLayout";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { getMetadataForUserPage } from "@/helpers/Helpers";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import {
  getUserProfile,
  userPageNeedsRedirect,
} from "@/helpers/server.helpers";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type TabProps = { readonly profile: ApiIdentity };

type FactoryArgs = {
  subroute: string;
  metaLabel: string;
  Tab: (props: Readonly<TabProps>) => React.JSX.Element;
};

type UserRouteParams = { user: string };
type UserSearchParams = Record<string, string | string[] | undefined>;

export function createUserTabPage({ subroute, metaLabel, Tab }: FactoryArgs) {
  async function Page({
    params,
    searchParams,
  }: {
    readonly params?: UserRouteParams;
    readonly searchParams?:
      | Promise<UserSearchParams>
      | UserSearchParams;
  }) {
    const resolvedParams = params;
    if (!resolvedParams?.user) {
      notFound();
    }

    const user = resolvedParams.user;
    const normalizedUser = user.toLowerCase();
    const query: UserSearchParams = searchParams
      ? await searchParams
      : {};
    const headers = await getAppCommonHeaders();
    const profile: ApiIdentity = await getUserProfile({
      user: normalizedUser,
      headers,
    }).catch(() => {
      notFound();
    });

    const needsRedirect = userPageNeedsRedirect({
      profile,
      req: { query: { ...query, user } },
      subroute,
    });

    if (needsRedirect) {
      redirect(needsRedirect.redirect.destination);
    }

    return (
      <UserPageLayout profile={profile} handleOrWallet={normalizedUser}>
        <Tab profile={profile} />
      </UserPageLayout>
    );
  }

  async function generateMetadata({
    params,
  }: {
    readonly params?: UserRouteParams;
  }): Promise<Metadata> {
    const resolvedParams = params;
    if (!resolvedParams?.user) {
      notFound();
    }

    const normalizedUser = resolvedParams.user.toLowerCase();
    const headers = await getAppCommonHeaders();
    const profile: ApiIdentity = await getUserProfile({
      user: normalizedUser,
      headers,
    }).catch(() => {
      notFound();
    });
    return getAppMetadata(getMetadataForUserPage(profile, metaLabel));
  }

  return { Page, generateMetadata };
}
