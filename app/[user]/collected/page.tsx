import { getUserProfile, userPageNeedsRedirect } from "@/helpers/server.helpers";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getMetadataForUserPage } from "@/helpers/Helpers";
import UserPageLayout from "@/components/user/layout/UserPageLayout";
import UserPageCollected from "@/components/user/collected/UserPageCollected";
import { redirect } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";
import { ApiIdentity } from "@/generated/models/ObjectSerializer";

export default async function CollectedPage({
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
  });

  const needsRedirect = userPageNeedsRedirect({
    profile,
    req: { query: { user, ...query } },
    subroute: "collected",
  });

  if (needsRedirect) {
    redirect(needsRedirect.redirect.destination);
  }

  return (
    <UserPageLayout profile={profile}>
      <UserPageCollected profile={profile} />
    </UserPageLayout>
  );
}

export async function generateMetadata({
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
  return getAppMetadata(getMetadataForUserPage(profile, "Collected"));
}
