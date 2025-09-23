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

export function createUserTabPage({ subroute, metaLabel, Tab }: FactoryArgs) {
  async function Page({
    params,
    searchParams,
  }: {
    readonly params: Promise<{ user: string }>;
    readonly searchParams: Promise<Record<string, string>>;
  }) {
    const { user } = await params;
    const query = await searchParams;
    const headers = await getAppCommonHeaders();
    const profile: ApiIdentity = await getUserProfile({
      user: user.toLowerCase(),
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
      <UserPageLayout profile={profile}>
        <Tab profile={profile} />
      </UserPageLayout>
    );
  }

  async function generateMetadata({
    params,
  }: {
    readonly params: Promise<{ user: string }>;
  }): Promise<Metadata> {
    const { user } = await params;
    const headers = await getAppCommonHeaders();
    const profile: ApiIdentity = await getUserProfile({
      user: user.toLowerCase(),
      headers,
    });
    return getAppMetadata(getMetadataForUserPage(profile, metaLabel));
  }

  return { Page, generateMetadata };
}
