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
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * Props passed to each user tab component.
 * Contains the already-fetched user `profile` for SSR rendering.
 */
type TabProps = { profile: ApiIdentity };

/**
 * Arguments for creating a user tab page via the factory.
 * - `subroute`: the path segment for this tab (e.g. "rep"). Use empty string for the root tab.
 * - `metaLabel`: label used to build page metadata (title/description).
 * - `Tab`: a component that receives the SSR-fetched `profile` and renders the tab content.
 */
type FactoryArgs = {
  subroute: string;
  metaLabel: string;
  Tab: (props: TabProps) => React.JSX.Element;
};

/**
 * Creates a user tab page that:
 * - Fetches the user profile on the server
 * - Canonicalizes the URL (redirects if handle differs from the param)
 * - Wraps the content with `UserPageLayout`
 * - Exposes a `generateMetadata` function using the same fetch logic
 *
 * Usage:
 * const { Page, generateMetadata } = createUserTabPage({
 *   subroute: "rep",
 *   metaLabel: "Rep",
 *   Tab: ({ profile }) => <RepTab profile={profile} />,
 * });
 */
export function createUserTabPage({ subroute, metaLabel, Tab }: FactoryArgs) {
  // Per-request cache to deduplicate profile fetch across Page and generateMetadata.
  const getProfileCached = cache(async (
    user: string,
    headers: Record<string, string>
  ): Promise<ApiIdentity> => {
    return await getUserProfile({ user: user.toLowerCase(), headers });
  });

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
    const profile: ApiIdentity = await getProfileCached(user, headers);

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
    const profile: ApiIdentity = await getProfileCached(user, headers);
    return getAppMetadata(getMetadataForUserPage(profile, metaLabel));
  }

  return { Page, generateMetadata };
}
