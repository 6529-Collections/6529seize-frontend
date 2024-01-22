import { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import { NFT, NFTLite } from "../../entities/INFT";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getCommonUserServerSideProps,
  getGradients,
  getMemesLite,
  getOwned,
  getSeasons,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import { Season } from "../../entities/ISeason";
import { OwnerLite } from "../../entities/IOwner";
import UserPageCollected from "../../components/user/collected/UserPageCollected";

export interface UserPageProps {
  profile: IProfileAndConsolidations;
}

const Page: NextPageWithLayout<{ pageProps: UserPageProps }> = ({
  pageProps,
}) => {
  return <UserPageCollected />;
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
    const walletOrHandle = (req.query.user as string).toLowerCase();
    const [{ profile, title, consolidatedTDH }, gradients, memesLite, seasons] =
      await Promise.all([
        getCommonUserServerSideProps({ user: walletOrHandle, headers }),
        getGradients(headers),
        getMemesLite(headers),
        getSeasons(headers),
      ]);

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
