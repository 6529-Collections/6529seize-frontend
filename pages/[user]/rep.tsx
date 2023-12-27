import { ReactElement, useContext } from "react";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
  ProfileActivityLogRatingEdit,
  ProfileActivityLogRatingEditContentMatter,
  RatingWithProfileInfoAndLevel,
} from "../../entities/IProfile";
import { NextPageWithLayout } from "../_app";
import { ReactQueryWrapperContext } from "../../components/react-query-wrapper/ReactQueryWrapper";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import {
  getCommonHeaders,
  getCommonUserServerSideProps,
  getProfileRatings,
  getProfileRatingsByRater,
  getSignedWalletOrNull,
  getUserProfileActivityLogs,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import UserPageRep from "../../components/user/rep/UserPageRep";
import { Page as PageType } from "../../helpers/Types";
import {
  ActivityLogParams,
  convertActivityLogParams,
} from "../../components/profile-activity/ProfileActivityLogs";
import { FilterTargetType } from "../../components/utils/CommonFilterTargetSelect";
import UserPageNoProfile from "../../components/user/utils/UserPageNoProfile";

export interface UserPageRepPropsRepRates {
  readonly ratings: ApiProfileRepRatesState;
  readonly rater: string | null;
}

export interface UserPageRepProps {
  readonly profile: IProfileAndConsolidations;
  readonly handleOrWallet: string;
  readonly title: string;
  readonly consolidatedTDH: ConsolidatedTDHMetrics | null;
  readonly repRates: UserPageRepPropsRepRates;
  readonly repLogs: PageType<ProfileActivityLogRatingEdit>;
  readonly repGivenToUsers: PageType<RatingWithProfileInfoAndLevel>;
  readonly repReceivedFromUsers: PageType<RatingWithProfileInfoAndLevel>;
}

const PROFILE_REP_RATERS_PAGE = 1;
const PROFILE_REP_RATERS_PAGE_SIZE = 10;
const PROFILE_REP_RATERS_LOG_TYPE = "";

const getInitialActivityLogParams = (
  handleOrWallet: string
): ActivityLogParams => ({
  page: 1,
  pageSize: 10,
  logTypes: [],
  matter: ProfileActivityLogRatingEditContentMatter.REP,
  targetType: FilterTargetType.OUTGOING,
  handleOrWallet,
});

const Page: NextPageWithLayout<{ pageProps: UserPageRepProps }> = ({
  pageProps,
}) => {
  const initialActivityLogParams = getInitialActivityLogParams(
    pageProps.handleOrWallet
  );
  const { initProfileRepPage } = useContext(ReactQueryWrapperContext);
  initProfileRepPage({
    profile: pageProps.profile,
    repRates: pageProps.repRates,
    repLogs: {
      data: pageProps.repLogs,
      params: initialActivityLogParams,
    },
    repGivenToUsers: {
      data: pageProps.repGivenToUsers,
      page: PROFILE_REP_RATERS_PAGE,
      pageSize: PROFILE_REP_RATERS_PAGE_SIZE,
      logType: PROFILE_REP_RATERS_LOG_TYPE,
      given: true,
    },
    repReceivedFromUsers: {
      data: pageProps.repReceivedFromUsers,
      page: PROFILE_REP_RATERS_PAGE,
      pageSize: PROFILE_REP_RATERS_PAGE_SIZE,
      logType: PROFILE_REP_RATERS_LOG_TYPE,
      given: false,
    },
    handleOrWallet: pageProps.handleOrWallet,
  });

  if (!pageProps.profile.profile) {
    return <UserPageNoProfile profile={pageProps.profile} />;
  }

  return (
    <div className="tailwind-scope">
      <UserPageRep
        profile={pageProps.profile}
        initialActivityLogParams={initialActivityLogParams}
      />
    </div>
  );
};

Page.getLayout = function getLayout(
  page: ReactElement<{ pageProps: UserPageRepProps }>
) {
  return <UserPageLayout props={page.props.pageProps}>{page}</UserPageLayout>;
};

export default Page;

export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: UserPageRepProps;
}> {
  try {
    const headers = getCommonHeaders(req);
    const signedWalletOrNull = getSignedWalletOrNull(req);
    const handleOrWallet = req.query.user.toLowerCase() as string;
    const [
      { profile, title, consolidatedTDH },
      repLogs,
      repRates,
      repGivenToUsers,
      repReceivedFromUsers,
    ] = await Promise.all([
      getCommonUserServerSideProps({ user: handleOrWallet, headers }),
      getUserProfileActivityLogs<ProfileActivityLogRatingEdit>({
        headers,
        params: convertActivityLogParams(
          getInitialActivityLogParams(handleOrWallet)
        ),
      }),
      getProfileRatings({
        user: handleOrWallet,
        headers,
        signedWallet: signedWalletOrNull,
      }),
      getProfileRatingsByRater({
        user: handleOrWallet,
        headers,
        page: PROFILE_REP_RATERS_PAGE,
        pageSize: PROFILE_REP_RATERS_PAGE_SIZE,
        given: true,
        logType: PROFILE_REP_RATERS_LOG_TYPE,
      }),
      getProfileRatingsByRater({
        user: handleOrWallet,
        headers,
        page: PROFILE_REP_RATERS_PAGE,
        logType: PROFILE_REP_RATERS_LOG_TYPE,
        pageSize: PROFILE_REP_RATERS_PAGE_SIZE,
        given: false,
      }),
    ]);

    const needsRedirect = userPageNeedsRedirect({
      profile,
      req,
      subroute: "rep",
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
        repRates,
        repLogs,
        repGivenToUsers,
        repReceivedFromUsers,
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
