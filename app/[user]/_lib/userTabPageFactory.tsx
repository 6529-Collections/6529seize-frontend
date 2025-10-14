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

type TabProps = { profile: ApiIdentity };

type FactoryArgs = {
  subroute: string;
  metaLabel: string;
  Tab: (props: TabProps) => React.JSX.Element;
};

type Awaitable<T> = T | Promise<T>;
type UserRouteParams = { user: string };
type UserSearchParams = Record<string, string | string[] | undefined>;

export function createUserTabPage({ subroute, metaLabel, Tab }: FactoryArgs) {
  async function Page({
    params,
    searchParams,
  }: {
    readonly params: Awaitable<UserRouteParams>;
    readonly searchParams?: Awaitable<UserSearchParams>;
  }) {
    const { user } = await Promise.resolve(params);
    const normalizedUser = user.toLowerCase();
    const query = await Promise.resolve(searchParams ?? {});
    const headers = await getAppCommonHeaders();
    const profile: ApiIdentity = await getUserProfile({
      user: normalizedUser,
      headers,
    }).catch(() => {
      notFound();
    });

    if (!profile) {
      notFound();
    }

    const needsRedirect = userPageNeedsRedirect({
      profile,
      req: { query: { user, ...query } },
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
    readonly params: Awaitable<UserRouteParams>;
  }): Promise<Metadata> {
    const { user } = await Promise.resolve(params);
    const normalizedUser = user.toLowerCase();
    const headers = await getAppCommonHeaders();
    const profile: ApiIdentity = await getUserProfile({
      user: normalizedUser,
      headers,
    });
    return getAppMetadata(getMetadataForUserPage(profile, metaLabel));
  }

  return { Page, generateMetadata };
}
