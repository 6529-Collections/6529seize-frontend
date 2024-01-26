import { ReactElement } from "react";
import UserPageUpcoming from "../../../components/user/upcoming/UserPageUpcoming";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { NextPageWithLayout } from "../../_app";
import UserPageLayout from "../../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getUserProfile,
  userPageNeedsRedirect,
} from "../../../helpers/server.helpers";

interface Props {
  readonly profile: IProfileAndConsolidations;
}

const Page: NextPageWithLayout<{ pageProps: Props }> = ({ pageProps }) => (
  <UserPageUpcoming profile={pageProps.profile} />
);
Page.getLayout = function getLayout(page: ReactElement<{ pageProps: Props }>) {
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
  props: Props;
}> {
  try {
    const headers = getCommonHeaders(req);
    const handleOrWallet = req.query.user.toLowerCase() as string;
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
