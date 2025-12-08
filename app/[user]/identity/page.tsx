import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import UserPageIdentityWrapper from "@/components/user/identity/UserPageIdentityWrapper";
import { ProfileActivityFilterTargetType, RateMatter } from "@/enums";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getProfileLogTypes } from "@/helpers/profile-logs.helpers";
import { getInitialRatersParams } from "@/helpers/server.helpers";
import {
  USER_PAGE_TAB_IDS,
  USER_PAGE_TAB_MAP,
} from "@/components/user/layout/userTabs.config";

const MATTER_TYPE = RateMatter.NIC;

const getInitialActivityLogParams = (
  handleOrWallet: string
): ActivityLogParams => ({
  page: 1,
  pageSize: 10,
  logTypes: getProfileLogTypes({
    logTypes: [],
  }),
  matter: null,
  targetType: ProfileActivityFilterTargetType.ALL,
  handleOrWallet,
  groupId: null,
});

function IdentityTab({ profile }: { readonly profile: ApiIdentity }) {
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

const TAB_CONFIG = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.IDENTITY];

const { Page, generateMetadata } = createUserTabPage({
  subroute: TAB_CONFIG.route,
  metaLabel: TAB_CONFIG.metaLabel,
  Tab: IdentityTab,
});

export default Page;
export { generateMetadata };
