import { ReactElement } from "react";
import UserPageMints from "../../components/user/mints/UserPageMints";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { NextPageWithLayout } from "../_app";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getUserProfile,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";

interface Props {
  readonly profile: IProfileAndConsolidations;
}

const Page: NextPageWithLayout<{ pageProps: Props }> = ({ pageProps }) => (
  <UserPageMints profile={pageProps.profile} />
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
      subroute: "mints",
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
