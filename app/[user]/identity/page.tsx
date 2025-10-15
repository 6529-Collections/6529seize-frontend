import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import UserPageIdentityHydrator from "@/components/user/identity/UserPageIdentityHydrator";
import UserPageIdentityWrapper from "@/components/user/identity/UserPageIdentityWrapper";
import {
  CicStatement,
  ProfileActivityLog,
  RatingWithProfileInfoAndLevel,
} from "@/entities/IProfile";
import { ProfileActivityFilterTargetType, RateMatter } from "@/enums";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type {
  CountlessPage,
  Page as PageWithCount,
} from "@/helpers/Types";
import { convertActivityLogParams, getProfileLogTypes } from "@/helpers/profile-logs.helpers";
import {
  getInitialRatersParams,
  getProfileCicRatings,
  getProfileCicStatements,
  getUserProfileActivityLogs,
} from "@/helpers/server.helpers";

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

type IdentityTabExtraProps = {
  readonly handleOrWallet: string;
  readonly initialStatements: CicStatement[];
  readonly initialCicGivenData: PageWithCount<RatingWithProfileInfoAndLevel>;
  readonly initialCicReceivedData: PageWithCount<RatingWithProfileInfoAndLevel>;
  readonly initialActivityLogData: CountlessPage<ProfileActivityLog>;
};

function IdentityTab({
  profile,
  handleOrWallet,
  initialStatements,
  initialCicGivenData,
  initialCicReceivedData,
  initialActivityLogData,
}: {
  readonly profile: ApiIdentity;
} & IdentityTabExtraProps) {
  const normalizedHandleOrWallet = handleOrWallet.toLowerCase();

  const initialCICGivenParams = getInitialRatersParams({
    handleOrWallet: normalizedHandleOrWallet,
    matter: MATTER_TYPE,
    given: false,
  });

  const initialCICReceivedParams = getInitialRatersParams({
    handleOrWallet: normalizedHandleOrWallet,
    matter: MATTER_TYPE,
    given: true,
  });

  const initialActivityLogParams =
    getInitialActivityLogParams(normalizedHandleOrWallet);

  return (
    <div className="tailwind-scope">
      <UserPageIdentityHydrator
        profile={profile}
        handleOrWallet={normalizedHandleOrWallet}
        initialStatements={initialStatements}
        initialActivityLogParams={initialActivityLogParams}
        initialActivityLogData={initialActivityLogData}
        initialCICGivenParams={initialCICGivenParams}
        initialCicGivenData={initialCicGivenData}
        initialCICReceivedParams={initialCICReceivedParams}
        initialCicReceivedData={initialCicReceivedData}
      />
      <UserPageIdentityWrapper
        profile={profile}
        initialCICReceivedParams={initialCICReceivedParams}
        initialCICGivenParams={initialCICGivenParams}
        initialActivityLogParams={initialActivityLogParams}
        handleOrWallet={normalizedHandleOrWallet}
        initialStatements={initialStatements}
        initialCicGivenData={initialCicGivenData}
        initialCicReceivedData={initialCicReceivedData}
        initialActivityLogData={initialActivityLogData}
      />
    </div>
  );
}

const { Page, generateMetadata } = createUserTabPage<IdentityTabExtraProps>({
  subroute: "identity",
  metaLabel: "Identity",
  Tab: IdentityTab,
  prepare: async ({ profile, headers, user }) => {
    const fallbackHandleOrWallet =
      profile.handle ?? profile.wallets?.[0]?.wallet ?? user;
    const normalizedHandleOrWallet = fallbackHandleOrWallet.toLowerCase();

    const initialCICGivenParams = getInitialRatersParams({
      handleOrWallet: normalizedHandleOrWallet,
      matter: MATTER_TYPE,
      given: false,
    });

    const initialCICReceivedParams = getInitialRatersParams({
      handleOrWallet: normalizedHandleOrWallet,
      matter: MATTER_TYPE,
      given: true,
    });

    const initialActivityLogParams =
      getInitialActivityLogParams(normalizedHandleOrWallet);

    const [
      statementsResult,
      activityLogsResult,
      cicGivenResult,
      cicReceivedResult,
    ] = await Promise.allSettled([
      getProfileCicStatements({
        handleOrWallet: normalizedHandleOrWallet,
        headers,
      }),
      getUserProfileActivityLogs<ProfileActivityLog>({
        headers,
        params: convertActivityLogParams({
          params: initialActivityLogParams,
          disableActiveGroup: true,
        }),
      }),
      getProfileCicRatings({
        handleOrWallet: normalizedHandleOrWallet,
        headers,
        params: initialCICGivenParams,
      }),
      getProfileCicRatings({
        handleOrWallet: normalizedHandleOrWallet,
        headers,
        params: initialCICReceivedParams,
      }),
    ]);

    const initialStatements: CicStatement[] =
      statementsResult.status === "fulfilled" ? statementsResult.value : [];

    const initialActivityLogData: CountlessPage<ProfileActivityLog> =
      activityLogsResult.status === "fulfilled"
        ? {
            data: activityLogsResult.value.data,
            page: activityLogsResult.value.page,
            next: activityLogsResult.value.next,
          }
        : {
            data: [],
            page: 1,
            next: false,
          };

    const initialCicGivenData: PageWithCount<RatingWithProfileInfoAndLevel> =
      cicGivenResult.status === "fulfilled"
        ? cicGivenResult.value
        : {
            count: 0,
            data: [],
            page: 1,
            next: false,
          };

    const initialCicReceivedData: PageWithCount<RatingWithProfileInfoAndLevel> =
      cicReceivedResult.status === "fulfilled"
        ? cicReceivedResult.value
        : {
            count: 0,
            data: [],
            page: 1,
            next: false,
          };

    return {
      tabProps: {
        handleOrWallet: normalizedHandleOrWallet,
        initialStatements,
        initialCicGivenData,
        initialCicReceivedData,
        initialActivityLogData,
      },
      layoutProps: {
        initialStatements,
      },
    };
  },
});

export default Page;
export { generateMetadata };
