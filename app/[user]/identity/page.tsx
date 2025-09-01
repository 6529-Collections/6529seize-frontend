import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import UserPageIdentityWrapper from "@/components/user/identity/UserPageIdentityWrapper";
import { FilterTargetType } from "@/components/utils/CommonFilterTargetSelect";
import { RateMatter } from "@/enums";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getInitialRatersParams } from "@/helpers/server.helpers";

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

function IdentityTab({ profile }: { profile: Readonly<ApiIdentity> }) {
  const handleOrWallet = (
    profile.handle ??
    profile.wallets?.[0]?.wallet ??
    ""
  ).toLowerCase();

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
    <div className="tailwind-scope">
      <UserPageIdentityWrapper
        profile={profile}
        initialCICReceivedParams={initialCICReceivedParams}
        initialCICGivenParams={initialCICGivenParams}
        initialActivityLogParams={initialActivityLogParams}
      />
    </div>
  );
}

const { Page, generateMetadata } = createUserTabPage({
  subroute: "identity",
  metaLabel: "Identity",
  Tab: IdentityTab,
});

export default Page;
export { generateMetadata };
