import { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";

import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getUserProfile,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import UserPageCollected from "../../components/user/collected/UserPageCollected";
import { ApiIdentity } from "../../generated/models/ApiIdentity";
interface UserPageProps {
  profile: ApiIdentity;
}

const Page: NextPageWithLayout<{ pageProps: UserPageProps }> = ({
  pageProps,
}) => {
  return <UserPageCollected profile={pageProps.profile} />;
};

Page.getLayout = function getLayout(
  page: ReactElement<{ pageProps: UserPageProps }>
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
  props: UserPageProps;
}> {
  try {
    const headers = getCommonHeaders(req);
    const handleOrWallet = (req.query.user as string).toLowerCase();
    const profile = await getUserProfile({ user: handleOrWallet, headers });

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
