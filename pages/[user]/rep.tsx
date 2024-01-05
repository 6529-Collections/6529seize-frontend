import { ReactElement, useContext } from "react";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
  ProfileActivityLogRatingEdit,
  RateMatter,
  RatingWithProfileInfoAndLevel,
} from "../../entities/IProfile";
import { NextPageWithLayout } from "../_app";
import { ReactQueryWrapperContext } from "../../components/react-query-wrapper/ReactQueryWrapper";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import {
  getCommonHeaders,
  getCommonUserServerSideProps,
  getInitialRatersParams,
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

const MATTER_TYPE = RateMatter.REP;

const getInitialActivityLogParams = (
  handleOrWallet: string
): ActivityLogParams => ({
  page: 1,
  pageSize: 10,
  logTypes: [],
  matter: RateMatter.REP,
  targetType: FilterTargetType.ALL,
  handleOrWallet,
});

const Page: NextPageWithLayout<{ pageProps: UserPageRepProps }> = ({
  pageProps,
}) => {
  const initialRepGivenParams = getInitialRatersParams({
    handleOrWallet: pageProps.handleOrWallet,
    matter: MATTER_TYPE,
    given: false,
  });

  const initialRepReceivedParams = getInitialRatersParams({
    handleOrWallet: pageProps.handleOrWallet,
    matter: MATTER_TYPE,
    given: true,
  });
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
      params: initialRepGivenParams,
    },
    repReceivedFromUsers: {
      data: pageProps.repReceivedFromUsers,
      params: initialRepReceivedParams,
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
        initialRepReceivedParams={initialRepReceivedParams}
        initialRepGivenParams={initialRepGivenParams}
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
