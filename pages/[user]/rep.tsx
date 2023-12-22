import { ReactElement, useContext } from "react";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
  ProfileActivityLogRatingEdit,
  ProfileActivityLogRatingEditContentMatter,
  RatingWithProfileInfoAndLevel,
} from "../../entities/IProfile";
import { NextPageWithLayout } from "../_app";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../components/react-query-wrapper/ReactQueryWrapper";
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
import { useQueryClient } from "@tanstack/react-query";
import { Page as PageType } from "../../helpers/Types";
import { useRouter } from "next/router";

export interface UserPageRepPropsRepRates {
  readonly ratings: ApiProfileRepRatesState;
  readonly rater: string | null;
}

export interface UserPageRepProps {
  readonly profile: IProfileAndConsolidations;
  readonly title: string;
  readonly consolidatedTDH: ConsolidatedTDHMetrics | null;
  readonly repRates: UserPageRepPropsRepRates;
  readonly repLogs: PageType<ProfileActivityLogRatingEdit>;
  readonly repGivenToUsers: PageType<RatingWithProfileInfoAndLevel>;
  readonly repReceivedFromUsers: PageType<RatingWithProfileInfoAndLevel>;
}

const REP_RATERS_PAGE_SIZE = 10;

const Page: NextPageWithLayout<{ pageProps: UserPageRepProps }> = ({
  pageProps,
}) => {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();
  const queryClient = useQueryClient();
  const { setProfile } = useContext(ReactQueryWrapperContext);
  setProfile(pageProps.profile);
  const initialEmptyRepRates: ApiProfileRepRatesState = {
    total_rep_rating: pageProps.repRates.ratings.total_rep_rating,
    number_of_raters: pageProps.repRates.ratings.number_of_raters,
    total_rep_rating_by_rater: null,
    rep_rates_left_for_rater: null,
    rating_stats: pageProps.repRates.ratings.rating_stats.map((rating) => ({
      category: rating.category,
      rating: rating.rating,
      contributor_count: rating.contributor_count,
      rater_contribution: null,
    })),
  };
  queryClient.setQueryData(
    [
      QueryKey.PROFILE_REP_RATINGS,
      {
        handleOrWallet: user,
        rater: undefined,
      },
    ],
    initialEmptyRepRates
  );

  if (pageProps.repRates.rater) {
    queryClient.setQueryData(
      [
        QueryKey.PROFILE_REP_RATINGS,
        {
          handleOrWallet: user,
          rater: pageProps.repRates.rater.toLowerCase(),
        },
      ],
      pageProps.repRates.ratings
    );
  }

  return (
    <div className="tailwind-scope">
      <UserPageRep
        profile={pageProps.profile}
        repLogs={pageProps.repLogs}
        repGivenToUsers={pageProps.repGivenToUsers}
        repReceivedFromUsers={pageProps.repReceivedFromUsers}
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

    const [
      { profile, title, consolidatedTDH },
      repLogs,
      repRates,
      repGivenToUsers,
      repReceivedFromUsers,
    ] = await Promise.all([
      getCommonUserServerSideProps({ user: req.query.user, headers }),
      getUserProfileActivityLogs<ProfileActivityLogRatingEdit>({
        user: req.query.user,
        headers,
        matter: ProfileActivityLogRatingEditContentMatter.REP,
        includeIncoming: true,
      }),
      getProfileRatings({
        user: req.query.user,
        headers,
        signedWallet: signedWalletOrNull,
      }),
      getProfileRatingsByRater({
        user: req.query.user,
        headers,
        pageSize: REP_RATERS_PAGE_SIZE,
        given: true,
      }),
      getProfileRatingsByRater({
        user: req.query.user,
        headers,
        pageSize: REP_RATERS_PAGE_SIZE,
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
        title,
        consolidatedTDH,
        repRates,
        repLogs,
        repGivenToUsers,
        repReceivedFromUsers,
      },
    };
  } catch (e: any) {
    console.log(e);
    return {
      redirect: {
        permanent: false,
        destination: "/404",
      },
      props: {},
    } as any;
  }
}
