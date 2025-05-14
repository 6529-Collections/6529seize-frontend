import { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getUserProfile,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import UserPageBrainWrapper from "../../components/user/brain/UserPageBrainWrapper";
import { UserPageProps } from "../../helpers/Types";
import { getMetadataForUserPage } from "../../helpers/Helpers";

const Page: NextPageWithLayout<{ pageProps: UserPageProps }> = ({
  pageProps,
}) => (
  <div className="tailwind-scope">
    <UserPageBrainWrapper profile={pageProps.profile} />
  </div>
);
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
      subroute: null,
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    return {
      props: {
        profile,
        metadata: getMetadataForUserPage(profile),
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
