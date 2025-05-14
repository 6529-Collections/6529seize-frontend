import { ReactElement, useContext } from "react";
import { NextPageWithLayout } from "../../_app";
import UserPageLayout from "../../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getUserProfile,
  userPageNeedsRedirect,
} from "../../../helpers/server.helpers";
import { ReactQueryWrapperContext } from "../../../components/react-query-wrapper/ReactQueryWrapper";
import UserPageProxy from "../../../components/user/proxy/UserPageProxy";
import { UserPageProps } from "../../../helpers/Types";
import { getMetadataForUserPage } from "../../../helpers/Helpers";

const Page: NextPageWithLayout<{ pageProps: UserPageProps }> = ({
  pageProps,
}) => {
  const { setProfile } = useContext(ReactQueryWrapperContext);
  setProfile(pageProps.profile);
  return <UserPageProxy profile={pageProps.profile} />;
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
    const handleOrWallet = req.query.user.toLowerCase() as string;
    const profile = await getUserProfile({ user: handleOrWallet, headers });
    const needsRedirect = userPageNeedsRedirect({
      profile,
      req,
      subroute: "proxy",
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    return {
      props: {
        profile,
        metadata: getMetadataForUserPage(profile, "Proxy"),
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
