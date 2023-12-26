import { ReactElement, useContext } from "react";
import { NextPageWithLayout } from "../_app";
import {
  CicStatement,
  IProfileAndConsolidations,
  ProfileActivityLog,
  ProfilesMatterRatingWithRaterLevel,
} from "../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getCommonUserServerSideProps,
  getUserProfileActivityLogs,
  getUserProfileCICRatings,
  getUserProfileIdentityStatements,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import UserPageIdentity from "../../components/user/identity/UserPageIdentity";
import UserPageIdentityNoProfile from "../../components/user/identity/UserPageIdentityNoProfile";
import { Page as PageType } from "../../helpers/Types";
import { ReactQueryWrapperContext } from "../../components/react-query-wrapper/ReactQueryWrapper";
import {
  ActivityLogParams,
  convertActivityLogParams,
} from "../../components/profile-activity/ProfileActivityLogs";
import { FilterTargetType } from "../../components/utils/CommonFilterTargetSelect";

export interface UserPageIdentityProps {
  profile: IProfileAndConsolidations;
  handleOrWallet: string;
  title: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
  profileActivityLogs: PageType<ProfileActivityLog>;
  profileCICRatings: PageType<ProfilesMatterRatingWithRaterLevel>;
  profileIdentityStatements: CicStatement[];
}

const getInitialActivityLogParams = (
  handleOrWallet: string
): ActivityLogParams => ({
  page: 1,
  pageSize: 10,
  logTypes: [],
  matter: null,
  targetType: FilterTargetType.OUTGOING,
  handleOrWallet,
});

const Page: NextPageWithLayout<{ pageProps: UserPageIdentityProps }> = ({
  pageProps,
}) => {
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
  });

  if (!pageProps.profile.profile) {
    return <UserPageIdentityNoProfile profile={pageProps.profile} />;
  }

  return (
    <UserPageIdentity
      profile={pageProps.profile}
      initialActivityLogParams={initialActivityLogParams}
      profileCICRatings={pageProps.profileCICRatings}
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
      profileCICRatings,
      profileIdentityStatements,
    ] = await Promise.all([
      getCommonUserServerSideProps({ user: handleOrWallet, headers }),
      getUserProfileActivityLogs({
        headers,
        params: convertActivityLogParams(
          getInitialActivityLogParams(handleOrWallet)
        ),
      }),
      getUserProfileCICRatings({
        user: handleOrWallet,
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
        profileCICRatings,
        profileIdentityStatements,
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
