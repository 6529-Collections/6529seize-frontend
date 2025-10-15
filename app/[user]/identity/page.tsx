import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageIdentityHydrator from "@/components/user/identity/UserPageIdentityHydrator";
import UserPageIdentityWrapper from "@/components/user/identity/UserPageIdentityWrapper";
import {
  CicStatement,
  ProfileActivityLog,
  RatingWithProfileInfoAndLevel,
} from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { CountlessPage, Page as PageWithCount } from "@/helpers/Types";
import {
  fetchIdentityTabData,
  type IdentityTabParams,
} from "@/app/[user]/identity/_lib/identityTabQueries";

type IdentityTabExtraProps = {
  readonly handleOrWallet: string;
  readonly initialStatements: CicStatement[];
  readonly initialCicGivenData: PageWithCount<RatingWithProfileInfoAndLevel>;
  readonly initialCicReceivedData: PageWithCount<RatingWithProfileInfoAndLevel>;
  readonly initialActivityLogData: CountlessPage<ProfileActivityLog>;
  readonly initialParams: IdentityTabParams;
};

function IdentityTab({
  profile,
  handleOrWallet,
  initialStatements,
  initialCicGivenData,
  initialCicReceivedData,
  initialActivityLogData,
  initialParams,
}: {
  readonly profile: ApiIdentity;
} & IdentityTabExtraProps) {
  const normalizedHandleOrWallet = handleOrWallet.toLowerCase();
  const {
    activityLogParams: initialActivityLogParams,
    cicGivenParams: initialCICGivenParams,
    cicReceivedParams: initialCICReceivedParams,
  } = initialParams;

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
    const identityTabResult = await fetchIdentityTabData({
      handleOrWallet: fallbackHandleOrWallet,
      headers,
    });

    const {
      handleOrWallet: normalizedHandleOrWallet,
      data: {
        statements: initialStatements,
        activityLog: initialActivityLogData,
        cicGiven: initialCicGivenData,
        cicReceived: initialCicReceivedData,
      },
      params: initialParams,
    } = identityTabResult;

    return {
      tabProps: {
        handleOrWallet: normalizedHandleOrWallet,
        initialStatements,
        initialCicGivenData,
        initialCicReceivedData,
        initialActivityLogData,
        initialParams,
      },
      layoutProps: {
        initialStatements,
      },
    };
  },
});

export default Page;
export { generateMetadata };
