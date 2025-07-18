import { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getUserProfile,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import UserPageWavesWrapper from "../../components/user/waves/UserPageWavesWrapper";
import { UserPageProps } from "../../helpers/Types";
import { getMetadataForUserPage } from "../../helpers/Helpers";
import { ApiIdentity } from "@/generated/models/ApiIdentity";

const Page: NextPageWithLayout<{ profile: ApiIdentity }> = ({ profile }) => (
  <UserPageWavesWrapper profile={profile} />
);

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
  props: UserPageProps;
}> {
  try {
    const headers = getCommonHeaders(req);
    const handleOrWallet = req.query.user.toLowerCase() as string;
    const profile = await getUserProfile({ user: handleOrWallet, headers });
    const needsRedirect = userPageNeedsRedirect({
      profile,
      req,
      subroute: "waves",
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    return {
      props: {
        profile,
        metadata: getMetadataForUserPage(profile, "Waves"),
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
