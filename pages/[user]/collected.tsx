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
import UserPageCollection from "../../components/user/collected/UserPageCollection";
import { Season } from "../../entities/ISeason";
import { OwnerLite } from "../../entities/IOwner";

export interface UserPageProps {
  profile: IProfileAndConsolidations;
  title: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
  memesLite: NFTLite[];
  gradients: NFT[];
  seasons: Season[];
  consolidatedOwned: OwnerLite[];
}

const Page: NextPageWithLayout<{ pageProps: UserPageProps }> = ({
  pageProps,
}) => {
  return (
    <UserPageCollection
      profile={pageProps.profile}
      consolidatedOwned={pageProps.consolidatedOwned}
      consolidatedTDH={pageProps.consolidatedTDH}
      memesLite={pageProps.memesLite}
      gradients={pageProps.gradients}
      seasons={pageProps.seasons}
    />
  );
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
      subroute: 'collected',
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }
    const consolidatedOwned = await getOwned({
      wallets: profile.consolidation.wallets.map((w) => w.wallet.address),
      headers,
    });

    return {
      props: {
        profile,
        title,
        consolidatedTDH,
        gradients,
        memesLite,
        seasons,
        consolidatedOwned,
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
