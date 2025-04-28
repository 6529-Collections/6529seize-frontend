import { ReactElement } from "react";
import { ApiIdentity } from "../../generated/models/ApiIdentity";
import { NextPageWithLayout } from "../_app";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getUserProfile,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import UserPageFollowers from "../../components/user/followers/UserPageFollowers";

interface Props {
  readonly profile: ApiIdentity;
}

const Page: NextPageWithLayout<{ pageProps: Props }> = ({ pageProps }) => (
  <div className="tailwind-scope">
    <UserPageFollowers profile={pageProps.profile} />
  </div>
);
Page.getLayout = (page: ReactElement<{ pageProps: Props }>) => (
  <UserPageLayout profile={page.props.pageProps.profile}>{page}</UserPageLayout>
);

export default Page;
export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: Props;
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
