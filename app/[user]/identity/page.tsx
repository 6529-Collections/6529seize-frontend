import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import { getAppMetadata } from "@/components/providers/metadata";
import UserPageIdentityWrapper from "@/components/user/identity/UserPageIdentityWrapper";
import UserPageLayout from "@/components/user/layout/UserPageLayout";
import { FilterTargetType } from "@/components/utils/CommonFilterTargetSelect";
import { RateMatter } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getMetadataForUserPage } from "@/helpers/Helpers";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import {
  getInitialRatersParams,
  getUserProfile,
  userPageNeedsRedirect,
} from "@/helpers/server.helpers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

const MATTER_TYPE = RateMatter.NIC;

function getInitialActivityLogParams(
  handleOrWallet: string
): ActivityLogParams {
  return {
    page: 1,
    pageSize: 10,
    logTypes: [],
    matter: null,
    targetType: FilterTargetType.ALL,
    handleOrWallet,
    groupId: null,
  };
}

export default async function IdentityPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ user: string }>;
  readonly searchParams: Promise<Record<string, string>>;
}) {
  const { user } = await params;
  const query = await searchParams;

  const headers = await getAppCommonHeaders();
  const handleOrWallet = user.toLowerCase();

  const profile: ApiIdentity = await getUserProfile({
    user: handleOrWallet,
    headers,
  });

  const needsRedirect = userPageNeedsRedirect({
    profile,
    req: { query: { user: handleOrWallet, ...query } },
    subroute: "identity",
  });

  if (needsRedirect) {
    redirect(needsRedirect.redirect.destination);
  }

  const initialCICGivenParams = getInitialRatersParams({
    handleOrWallet,
    matter: MATTER_TYPE,
    given: false,
  });

  const initialCICReceivedParams = getInitialRatersParams({
    handleOrWallet,
    matter: MATTER_TYPE,
    given: true,
  });

  const initialActivityLogParams = getInitialActivityLogParams(handleOrWallet);

  return (
    <UserPageLayout profile={profile}>
      <div className="tailwind-scope">
        <UserPageIdentityWrapper
          profile={profile}
          initialCICReceivedParams={initialCICReceivedParams}
          initialCICGivenParams={initialCICGivenParams}
          initialActivityLogParams={initialActivityLogParams}
        />
      </div>
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
  return getAppMetadata(getMetadataForUserPage(profile, "Identity"));
}
