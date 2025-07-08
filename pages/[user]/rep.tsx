import { ReactElement } from "react";
import { ApiProfileRepRatesState, RateMatter } from "../../entities/IProfile";
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
import { UserPageProps } from "../../helpers/Types";
import { getMetadataForUserPage } from "../../helpers/Helpers";
import { ApiIdentity } from "@/generated/models/ApiIdentity";

export interface UserPageRepPropsRepRates {
  readonly ratings: ApiProfileRepRatesState;
  readonly rater: string | null;
}

export interface UserPageRepProps extends UserPageProps {
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

const Page: NextPageWithLayout<{
  profile: ApiIdentity;
  handleOrWallet: string;
}> = ({ profile, handleOrWallet }) => {
  const initialRepGivenParams = getInitialRatersParams({
    handleOrWallet,
    matter: MATTER_TYPE,
    given: false,
  });

  const initialRepReceivedParams = getInitialRatersParams({
    handleOrWallet,
    matter: MATTER_TYPE,
    given: true,
  });
  const initialActivityLogParams = getInitialActivityLogParams(handleOrWallet);

  return (
    <div className="tailwind-scope">
      <UserPageRepWrapper
        profile={profile}
        initialRepReceivedParams={initialRepReceivedParams}
        initialRepGivenParams={initialRepGivenParams}
        initialActivityLogParams={initialActivityLogParams}
      />
    </div>
  );
};

Page.getLayout = function getLayout(
  page: ReactElement<{ profile: ApiIdentity }>
) {
  return <UserPageLayout profile={page.props.profile}>{page}</UserPageLayout>;
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
      subroute: "rep",
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    return {
      props: {
        profile,
        handleOrWallet,
        metadata: getMetadataForUserPage(profile, "Rep"),
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
