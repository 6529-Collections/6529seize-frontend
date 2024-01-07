import { ReactElement, useContext } from "react";
import { NextPageWithLayout } from "../_app";
import {
  CicStatement,
  IProfileAndConsolidations,
  ProfileActivityLog,
  RateMatter,
  RatingWithProfileInfoAndLevel,
} from "../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getCommonUserServerSideProps,
  getInitialRatersParams,
  getProfileRatingsByRater,
  getUserProfileActivityLogs,
  getUserProfileIdentityStatements,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import { Page as PageType } from "../../helpers/Types";
import { ReactQueryWrapperContext } from "../../components/react-query-wrapper/ReactQueryWrapper";
import {
  ActivityLogParams,
  convertActivityLogParams,
} from "../../components/profile-activity/ProfileActivityLogs";
import { FilterTargetType } from "../../components/utils/CommonFilterTargetSelect";
import UserPageIdentityWrapper from "../../components/user/identity/UserPageIdentityWrapper";

export interface UserPageIdentityProps {
  readonly profile: IProfileAndConsolidations;
  readonly handleOrWallet: string;
  readonly title: string;
  readonly consolidatedTDH: ConsolidatedTDHMetrics | null;
  readonly profileActivityLogs: PageType<ProfileActivityLog>;
  readonly cicGivenToUser: PageType<RatingWithProfileInfoAndLevel>;
  readonly cicReceivedFromUser: PageType<RatingWithProfileInfoAndLevel>;
  readonly profileIdentityStatements: CicStatement[];
}

const MATTER_TYPE = RateMatter.CIC;

const getInitialActivityLogParams = (
  handleOrWallet: string
): ActivityLogParams => ({
  page: 1,
  pageSize: 10,
  logTypes: [],
  matter: null,
  targetType: FilterTargetType.ALL,
  handleOrWallet,
});

const Page: NextPageWithLayout<{ pageProps: UserPageIdentityProps }> = ({
  pageProps,
}) => {
  const initialCICGivenParams = getInitialRatersParams({
    handleOrWallet: pageProps.handleOrWallet,
    matter: MATTER_TYPE,
    given: false,
  });

  const initialCICReceivedParams = getInitialRatersParams({
    handleOrWallet: pageProps.handleOrWallet,
    matter: MATTER_TYPE,
    given: true,
  });

  const initialActivityLogParams = getInitialActivityLogParams(
    pageProps.handleOrWallet
  );
  const { initProfileIdentityPage } = useContext(ReactQueryWrapperContext);
  initProfileIdentityPage({
    profile: pageProps.profile,
    activityLogs: {
      data: pageProps.profileActivityLogs,
      params: initialActivityLogParams,
    },
    cicGivenToUsers: {
      data: pageProps.cicGivenToUser,
      params: initialCICGivenParams,
    },
    cicReceivedFromUsers: {
      data: pageProps.cicReceivedFromUser,
      params: initialCICReceivedParams,
    },
  });

  return (
    <UserPageIdentityWrapper
      profile={pageProps.profile}
      initialCICReceivedParams={initialCICReceivedParams}
      initialCICGivenParams={initialCICGivenParams}
      initialActivityLogParams={initialActivityLogParams}
      profileIdentityStatements={pageProps.profileIdentityStatements}
    />
  );
};

Page.getLayout = function getLayout(
  page: ReactElement<{ pageProps: UserPageIdentityProps }>
) {
  return <UserPageLayout props={page.props.pageProps}>{page}</UserPageLayout>;
};

export default Page;

export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: UserPageIdentityProps;
}> {
  try {
    const headers = getCommonHeaders(req);
    const handleOrWallet = req.query.user.toLowerCase() as string;

    const [
      { profile, title, consolidatedTDH },
      profileActivityLogs,
      cicGivenToUser,
      cicReceivedFromUser,
      profileIdentityStatements,
    ] = await Promise.all([
      getCommonUserServerSideProps({ user: handleOrWallet, headers }),
      getUserProfileActivityLogs({
        headers,
        params: convertActivityLogParams(
          getInitialActivityLogParams(handleOrWallet)
        ),
      }),
      getProfileRatingsByRater({
        params: getInitialRatersParams({
          handleOrWallet,
          matter: MATTER_TYPE,
          given: false,
        }),
        headers,
      }),
      getProfileRatingsByRater({
        params: getInitialRatersParams({
          handleOrWallet,
          matter: MATTER_TYPE,
          given: true,
        }),
        headers,
      }),
      getUserProfileIdentityStatements({
        user: handleOrWallet,
        headers,
      }),
    ]);

    const needsRedirect = userPageNeedsRedirect({
      profile,
      req,
      subroute: "collected",
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    return {
      props: {
        profile,
        handleOrWallet,
        title,
        consolidatedTDH,
        profileActivityLogs,
        cicGivenToUser,
        cicReceivedFromUser,
        profileIdentityStatements,
      },
    };
  } catch (e: any) {
    return {
      redirect: {
        permanent: false,
        destination: "/404",
      },
      props: {},
    } as any;
  }
}
