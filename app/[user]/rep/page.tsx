import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import UserPageRepWrapper from "@/components/user/rep/UserPageRepWrapper";
import { FilterTargetType } from "@/components/utils/CommonFilterTargetSelect";
import { ApiProfileRepRatesState } from "@/entities/IProfile";
import { RateMatter } from "@/enums";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getProfileLogTypes } from "@/helpers/profile-logs.helpers";
import { getInitialRatersParams } from "@/helpers/server.helpers";

export interface UserPageRepPropsRepRates {
  readonly ratings: ApiProfileRepRatesState;
  readonly rater: string | null;
}

const MATTER_TYPE = RateMatter.REP;

const getInitialActivityLogParams = (
  handleOrWallet: string
): ActivityLogParams => ({
  page: 1,
  pageSize: 10,
  logTypes: getProfileLogTypes({
    logTypes: [],
  }),
  matter: RateMatter.REP,
  targetType: FilterTargetType.ALL,
  handleOrWallet,
  groupId: null,
});

function RepTab({ profile }: { readonly profile: ApiIdentity }) {
  const handleOrWallet = (
    profile.handle ??
    profile.wallets?.[0]?.wallet ??
    ""
  ).toLowerCase();

  const initialRepGivenParams = getInitialRatersParams({
    handleOrWallet,
    matter: MATTER_TYPE,
    given: false,
  });

  const initialRepReceivedParams = getInitialRatersParams({
    handleOrWallet,
    matter: MATTER_TYPE,
    given: true,
  });
  const initialActivityLogParams = getInitialActivityLogParams(handleOrWallet);

  return (
    <div className="tailwind-scope">
      <UserPageRepWrapper
        profile={profile}
        initialRepReceivedParams={initialRepReceivedParams}
        initialRepGivenParams={initialRepGivenParams}
        initialActivityLogParams={initialActivityLogParams}
      />
    </div>
  );
}

const { Page, generateMetadata } = createUserTabPage({
  subroute: "rep",
  metaLabel: "Rep",
  Tab: RepTab,
});

export default Page;
export { generateMetadata };
