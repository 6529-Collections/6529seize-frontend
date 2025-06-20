import { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";
import { RateMatter } from "../../entities/IProfile";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getInitialRatersParams,
  getUserProfile,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import { ActivityLogParams } from "../../components/profile-activity/ProfileActivityLogs";
import { FilterTargetType } from "../../components/utils/CommonFilterTargetSelect";
import UserPageIdentityWrapper from "../../components/user/identity/UserPageIdentityWrapper";
import { getProfileLogTypes } from "../../helpers/profile-logs.helpers";
import { UserPageProps } from "../../helpers/Types";
import { getMetadataForUserPage } from "../../helpers/Helpers";
import { ApiIdentity } from "@/generated/models/ApiIdentity";

export interface UserPageIdentityProps extends UserPageProps {
  readonly handleOrWallet: string;
}

const MATTER_TYPE = RateMatter.NIC;

const getInitialActivityLogParams = (
  handleOrWallet: string
): ActivityLogParams => ({
  page: 1,
  pageSize: 10,
  logTypes: getProfileLogTypes({
    logTypes: [],
  }),
  matter: null,
  targetType: FilterTargetType.ALL,
  handleOrWallet,
  groupId: null,
});

const Page: NextPageWithLayout<{
  profile: ApiIdentity;
  handleOrWallet: string;
}> = ({ profile, handleOrWallet }) => {
  const initialCICGivenParams = getInitialRatersParams({
    handleOrWallet,
    matter: MATTER_TYPE,
    given: false,
  });

  const initialCICReceivedParams = getInitialRatersParams({
    handleOrWallet,
    matter: MATTER_TYPE,
    given: true,
  });

  const initialActivityLogParams = getInitialActivityLogParams(handleOrWallet);

  return (
    <div className="tailwind-scope">
      <UserPageIdentityWrapper
        profile={profile}
        initialCICReceivedParams={initialCICReceivedParams}
        initialCICGivenParams={initialCICGivenParams}
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
  props: UserPageIdentityProps;
}> {
  try {
    const headers = getCommonHeaders(req);
    const handleOrWallet = req.query.user.toLowerCase() as string;
    const profile = await getUserProfile({ user: handleOrWallet, headers });
    const needsRedirect = userPageNeedsRedirect({
      profile,
      req,
      subroute: "identity",
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    return {
      props: {
        profile,
        handleOrWallet,
        metadata: getMetadataForUserPage(profile, "Identity"),
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
