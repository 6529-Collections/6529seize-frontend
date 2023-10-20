import Head from "next/head";
import styles from "../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import {
  areEqualAddresses,
  containsEmojis,
  formatAddress,
  numberWithCommas,
} from "../../helpers/Helpers";
import { MANIFOLD, SIX529_MUSEUM } from "../../constants";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../services/api/common-api";
import { IProfileAndConsolidations } from "../../entities/IProfile";

export enum ReservedUser {
  MUSEUM = "6529Museum",
  MANIFOLD = "Manifold-Minting-Wallet",
}

export const MUSEUM_ENS = {
  wallet: SIX529_MUSEUM,
  display: ReservedUser.MUSEUM,
  banner_1: "#111111",
  banner_2: "#000000",
  pfp: "./museum.png",
};

export const MANIFOLD_ENS = {
  wallet: MANIFOLD,
  display: ReservedUser.MANIFOLD,
  banner_1: "#111111",
  banner_2: "#000000",
  pfp: "./manifold.png",
};

interface PageProps {
  title: string;
  url: string;
  image: string;
  tdh: number | null;
  balance: number | null;
  userProfile: IProfileAndConsolidations;
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
  const router = useRouter();
  const pageProps = props.pageProps;

  const pagenameFull = `${pageProps.title} | 6529 SEIZE`;

  const descriptionArray = [];
  if (pageProps.tdh && pageProps.tdh > 0) {
    descriptionArray.push(`TDH: ${numberWithCommas(pageProps.tdh)}`);
  }
  if (pageProps.balance && pageProps.balance > 0) {
    descriptionArray.push(`Cards: ${numberWithCommas(pageProps.balance)}`);
  }
  descriptionArray.push("6529 SEIZE");

  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);

  const [user, setUser] = useState(
    Array.isArray(router.query.user) ? router.query.user[0] : router.query.user
  );

  useEffect(() => {
    if (user) {
      if (
        !user.startsWith("0x") &&
        !user.endsWith(".eth") &&
        !Object.values(ReservedUser).includes(user as ReservedUser) &&
        !pageProps.userProfile
      ) {
        window.location.href = "404";
      }
    }
  }, [user]);

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
        <meta property="og:image" content={pageProps.image} />
        <meta
          property="og:description"
          content={descriptionArray.join(" | ")}
        />
      </Head>

      <main className={styles.main}>
        <Header onSetWallets={(wallets) => setConnectedWallets(wallets)} />
        {router.isReady && pageProps.url && (
          <UserPage
            wallets={connectedWallets}
            user={pageProps.url}
            profile={pageProps.userProfile}
          />
        )}
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
  let user = req.query.user;

  const userProfileResponse = await fetch(
    `${process.env.API_ENDPOINT}/api/profiles/${user}`
  ).catch(() => null);

  const userProfile: IProfileAndConsolidations | null =
    await userProfileResponse?.json();
  if (!userProfile || !userProfile.consolidation) {
    return {
      redirect: {
        permanent: false,
        destination: `/404`,
      },
      props: {},
    } as any;
  }

  if (
    userProfile?.profile?.normalised_handle &&
    userProfile.profile?.normalised_handle !== user.toLowerCase()
  ) {
    return {
      redirect: {
        permanent: false,
        destination: `/${userProfile.profile.normalised_handle}`,
      },
      props: {},
    } as any;
  }

  if (areEqualAddresses(user, MUSEUM_ENS.display)) {
    user = MUSEUM_ENS.wallet;
  }
  if (areEqualAddresses(user, MANIFOLD_ENS.display)) {
    user = MANIFOLD_ENS.wallet;
  }

  const ensRequest = await fetch(
    `${process.env.API_ENDPOINT}/api/user/${user}`
  );
  let userDisplay = formatAddress(user);
  let pfp;
  let tdh;
  let balance;
  const responseText = await ensRequest.text();
  if (responseText) {
    const response = await JSON.parse(responseText);
    pfp = response.pfp;
    if (!pfp) {
      if (areEqualAddresses(user, SIX529_MUSEUM)) {
        pfp = `${process.env.BASE_ENDPOINT}/${MUSEUM_ENS.pfp}`;
      }
      if (areEqualAddresses(user, MANIFOLD)) {
        pfp = `${process.env.BASE_ENDPOINT}/${MANIFOLD_ENS.pfp}`;
      }
    }
    tdh = response.boosted_tdh ? response.booested_tdh : null;
    balance = response.balance ? response.balance : null;
    userDisplay =
      response.display && !containsEmojis(response.display)
        ? response.display
        : areEqualAddresses(user, SIX529_MUSEUM)
        ? ReservedUser.MUSEUM
        : areEqualAddresses(user, MANIFOLD)
        ? ReservedUser.MANIFOLD
        : userDisplay;
  }
  return {
    props: {
      title: userDisplay,
      url: userDisplay.includes(".eth") ? userDisplay : user,
      image: pfp ? pfp : DEFAULT_IMAGE,
      tdh: tdh ? tdh : null,
      balance: balance ? balance : null,
      userProfile,
    },
  };
}
