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
import {
  getCommonHeaders,
  getInitialRatersParams,
  getProfileRatings,
  getProfileRatingsByRater,
  getSignedWalletOrNull,
  getUserProfile,
  getUserProfileActivityLogs,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import { Page as PageType } from "../../helpers/Types";
import {
  ActivityLogParams,
  convertActivityLogParams,
} from "../../components/profile-activity/ProfileActivityLogs";
import { FilterTargetType } from "../../components/utils/CommonFilterTargetSelect";
import UserPageRepWrapper from "../../components/user/rep/UserPageRepWrapper";

export interface UserPageRepPropsRepRates {
  readonly ratings: ApiProfileRepRatesState;
  readonly rater: string | null;
}

export interface UserPageRepProps {
  readonly profile: IProfileAndConsolidations;
  readonly handleOrWallet: string;
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

  return (
    <div className="tailwind-scope">
      <UserPageRepWrapper
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
  return (
    <UserPageLayout profile={page.props.pageProps.profile}>
      {page}
    </UserPageLayout>
  );
};

export default Page;

export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: UserPageRepProps;
}> {
  console.log(req);
  try {
    const headers = getCommonHeaders(req);
    const signedWalletOrNull = getSignedWalletOrNull(req);
    const handleOrWallet = req.query.user.toLowerCase() as string;
    const [profile, repLogs, repRates, repGivenToUsers, repReceivedFromUsers] =
      await Promise.all([
        getUserProfile({ user: handleOrWallet, headers }),
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
      subroute: null,
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    return {
      props: {
        profile,
        handleOrWallet,
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
