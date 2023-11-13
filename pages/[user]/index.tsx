import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import {
  containsEmojis,
  formatAddress,
  numberWithCommas,
} from "../../helpers/Helpers";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { useState } from "react";
import { commonApiFetch } from "../../services/api/common-api";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { ENS } from "../../entities/IENS";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import { NFT, NFTLite } from "../../entities/INFT";
import { Season } from "../../entities/ISeason";

interface PageProps {
  profile: IProfileAndConsolidations;
  title: string;
  url: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
  memesLite: NFTLite[];
  gradients: NFT[];
  seasons: Season[];
}

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const UserPage = dynamic(() => import("../../components/user/UserPage"), {
  ssr: false,
});

const DEFAULT_IMAGE =
  "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_2.png";

export default function UserPageIndex(props: { pageProps: PageProps }) {
  const pageProps = props.pageProps;

  const pagenameFull = `${pageProps.title} | 6529 SEIZE`;

  const descriptionArray = [];
  if (
    pageProps.profile.consolidation.tdh &&
    pageProps.profile.consolidation.tdh > 0
  ) {
    descriptionArray.push(
      `TDH: ${numberWithCommas(pageProps.profile.consolidation.tdh)}`
    );
  }
  if (
    pageProps.consolidatedTDH?.balance &&
    pageProps.consolidatedTDH?.balance > 0
  ) {
    descriptionArray.push(
      `Cards: ${numberWithCommas(pageProps.consolidatedTDH?.balance)}`
    );
  }
  descriptionArray.push("6529 SEIZE");

  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);

  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={pageProps.title} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/${pageProps.url}`}
        />
        <meta property="og:title" content={pageProps.title} />
        <meta
          property="og:image"
          content={pageProps.profile.profile?.pfp_url ?? DEFAULT_IMAGE}
        />
        <meta
          property="og:description"
          content={descriptionArray.join(" | ")}
        />
      </Head>

      <main className={styles.main}>
        <Header onSetWallets={(wallets) => setConnectedWallets(wallets)} />
        <div className="tw-bg-neutral-950 tw-min-h-screen">
          <UserPage
            connectedWallets={connectedWallets}
            user={pageProps.url}
            profile={pageProps.profile}
            mainAddress={
              pageProps.profile.profile?.primary_wallet ??
              pageProps.url.toLowerCase()
            }
            consolidatedTDH={pageProps.consolidatedTDH}
            memesLite={pageProps.memesLite}
            gradients={pageProps.gradients}
            seasons={pageProps.seasons}
          />
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: PageProps;
}> {
  const getEnsAndConsolidatedTDH = async (
    address: string,
    headers: Record<string, string>
  ): Promise<{
    ens: ENS | null;
    consolidatedTDH: ConsolidatedTDHMetrics | null;
  }> => {
    const ens = await commonApiFetch<ENS>({
      endpoint: `user/${address}`,
      headers,
    });

    const consolidationKey = ens?.consolidation_key ?? null;
    const consolidatedTDH = consolidationKey
      ? await commonApiFetch<ConsolidatedTDHMetrics>({
          endpoint: `consolidated_owner_metrics/${consolidationKey}`,
          headers: authCookie ? { "x-6529-auth": authCookie } : {},
        })
      : null;

    return {
      ens,
      consolidatedTDH,
    };
  };

  const getGradients = async (
    headers: Record<string, string>
  ): Promise<NFT[]> => {
    const gradients = await commonApiFetch<{ data: NFT[] }>({
      endpoint: "nfts/gradients?&page_size=101&sort=ASC&sort_direction=id",
      headers,
    });
    return gradients.data;
  };

  const authCookie = req?.req?.cookies["x-6529-auth"];
  try {
    const headers: Record<string, string> = authCookie
      ? { "x-6529-auth": authCookie }
      : {};
    const profile = await commonApiFetch<IProfileAndConsolidations>({
      endpoint: `profiles/${req.query.user}`,
      headers: headers,
    });

    if (
      profile?.profile?.normalised_handle &&
      profile.profile?.normalised_handle !== req.query.user.toLowerCase()
    ) {
      const currentQuery = { ...req.query };
      delete currentQuery.user;
      const queryParamsString = new URLSearchParams(currentQuery).toString();
      return {
        redirect: {
          permanent: false,
          destination: `/${profile.profile.normalised_handle}?${queryParamsString}`,
        },
        props: {},
      } as any;
    }

    const wallet =
      profile?.profile?.primary_wallet?.toLowerCase() ?? req.query.user;

    const [ensAndConsolidatedTDH, memesLite, gradients, seasons] =
      await Promise.all([
        getEnsAndConsolidatedTDH(wallet, headers),
        commonApiFetch<{ data: NFTLite[] }>({
          endpoint: "memes_lite",
          headers,
        }),
        getGradients(headers),
        commonApiFetch<Season[]>({
          endpoint: "memes_seasons",
          headers,
        }),
      ]);

    const { ens, consolidatedTDH } = ensAndConsolidatedTDH;
    const title = profile?.profile?.handle
      ? profile.profile.handle
      : ens?.display && !containsEmojis(ens.display)
      ? ens.display
      : formatAddress(wallet);

    return {
      props: {
        profile,
        title,
        url: req.query.user,
        consolidatedTDH,
        memesLite: memesLite.data,
        gradients,
        seasons,
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
