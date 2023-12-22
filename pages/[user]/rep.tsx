import { ReactElement, useContext } from "react";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
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
  getSignedWalletOrNull,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import UserPageRep from "../../components/user/rep/UserPageRep";
import { useQueryClient } from "@tanstack/react-query";

export interface UserPageRepPropsRepRates {
  readonly ratings: ApiProfileRepRatesState;
  readonly rater: string | null;
}

export interface UserPageRepProps {
  readonly profile: IProfileAndConsolidations;
  readonly title: string;
  readonly consolidatedTDH: ConsolidatedTDHMetrics | null;
  readonly repRates: UserPageRepPropsRepRates;
}

const Page: NextPageWithLayout<{ pageProps: UserPageRepProps }> = ({
  pageProps,
}) => {
  const queryClient = useQueryClient();
  const { setProfile } = useContext(ReactQueryWrapperContext);
  setProfile(pageProps.profile);
  const initialEmptyRepRates: ApiProfileRepRatesState = {
    total_rep_rating: pageProps.repRates.ratings.total_rep_rating,
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
    [QueryKey.PROFILE_REP_RATINGS, { rater: undefined }],
    initialEmptyRepRates
  );

  if (pageProps.repRates.rater) {
    queryClient.setQueryData(
      [
        QueryKey.PROFILE_REP_RATINGS,
        {
          rater: pageProps.repRates.rater.toLowerCase(),
        },
      ],
      pageProps.repRates.ratings
    );
  }

  return (
    <div className="tailwind-scope">
      <UserPageRep profile={pageProps.profile} />
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

    const [{ profile, title, consolidatedTDH }, repRates] = await Promise.all([
      getCommonUserServerSideProps({ user: req.query.user, headers }),
      getProfileRatings({
        user: req.query.user,
        headers,
        signedWallet: signedWalletOrNull,
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
