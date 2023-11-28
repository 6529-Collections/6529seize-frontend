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
} from "./server.helpers";
import UserPageCollection from "../../components/user/collected/UserPageCollection";
import { Season } from "../../entities/ISeason";
import { OwnerLite } from "../../entities/IOwner";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  if (pageProps.profile.profile?.handle) {
    queryClient.setQueryData<IProfileAndConsolidations>(
      ["profile", pageProps.profile.profile?.handle.toLowerCase()],
      pageProps.profile
    );
  }

  for (const wallet of pageProps.profile.consolidation.wallets) {
    queryClient.setQueryData<IProfileAndConsolidations>(
      ["profile", wallet.wallet.address.toLowerCase()],
      pageProps.profile
    );

    if (wallet.wallet.ens) {
      queryClient.setQueryData<IProfileAndConsolidations>(
        ["profile", wallet.wallet.ens.toLowerCase()],
        pageProps.profile
      );
    }
  }

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
  return <UserPageLayout props={page.props.pageProps}>{page}</UserPageLayout>;
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
    const { profile, title, consolidatedTDH } =
      await getCommonUserServerSideProps({ user: req.query.user, headers });

    const needsRedirect = userPageNeedsRedirect({
      profile,
      req,
      subroute: null,
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    const [gradients, memesLite, seasons, consolidatedOwned] =
      await Promise.all([
        getGradients(headers),
        getMemesLite(headers),
        getSeasons(headers),
        getOwned({
          wallets: profile.consolidation.wallets.map((w) => w.wallet.address),
          headers,
        }),
      ]);

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
