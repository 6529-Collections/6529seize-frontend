import { ReactElement } from "react";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
  RateMatter,
} from "../../entities/IProfile";
import { NextPageWithLayout } from "../_app";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getInitialRatersParams,
  getUserProfile,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";

import { ActivityLogParams } from "../../components/profile-activity/ProfileActivityLogs";
import { FilterTargetType } from "../../components/utils/CommonFilterTargetSelect";
import UserPageRepWrapper from "../../components/user/rep/UserPageRepWrapper";
import { getProfileLogTypes } from "../../helpers/profile-logs.helpers";

export interface UserPageRepPropsRepRates {
  readonly ratings: ApiProfileRepRatesState;
  readonly rater: string | null;
}

export interface UserPageRepProps {
  readonly profile: IProfileAndConsolidations;
  readonly handleOrWallet: string;
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
  try {
    const headers = getCommonHeaders(req);
    const handleOrWallet = req.query.user.toLowerCase() as string;
    const profile = await getUserProfile({ user: handleOrWallet, headers });

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
