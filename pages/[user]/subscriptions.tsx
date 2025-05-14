import { ReactElement } from "react";
import { ApiIdentity } from "../../generated/models/ApiIdentity";
import { NextPageWithLayout } from "../_app";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getUserProfile,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import UserPageSubscriptions from "../../components/user/subscriptions/UserPageSubscriptions";
import { UserPageProps } from "../../helpers/Types";

const Page: NextPageWithLayout<{ pageProps: UserPageProps }> = ({
  pageProps,
}) => <UserPageSubscriptions profile={pageProps.profile} />;
Page.getLayout = (page: ReactElement<{ pageProps: UserPageProps }>) => (
  <UserPageLayout profile={page.props.pageProps.profile}>{page}</UserPageLayout>
);

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
      subroute: "subscriptions",
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    return {
      props: {
        profile,
        metadata: {
          title: `${profile.handle} | Subscriptions`,
          ogImage: profile.pfp ?? "",
          twitterCard: "summary_large_image",
        },
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
