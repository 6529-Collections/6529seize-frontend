import Head from "next/head";
import styles from "../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import {
  areEqualAddresses,
  containsEmojis,
  formatAddress,
} from "../../helpers/Helpers";
import { MANIFOLD, SIX529_MUSEUM } from "../../constants";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { useEffect, useState } from "react";

export enum ReservedUser {
  MUSEUM = "6529Museum",
  MANIFOLD = "Manifold-Minting-Wallet",
}
const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const UserPage = dynamic(() => import("../../components/user/UserPage"), {
  ssr: false,
});

export default function UserPageIndex(props: any) {
  const router = useRouter();
  const pagenameFull = `${props.title} | 6529 SEIZE`;

  const [user, setUser] = useState(
    Array.isArray(router.query.user) ? router.query.user[0] : router.query.user
  );

  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      if (
        !user.startsWith("0x") &&
        !user.endsWith(".eth") &&
        !Object.values(ReservedUser).includes(user as ReservedUser)
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
        <meta name="description" content={props.title} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/${props.url}`}
        />
        <meta property="og:title" content={props.title} />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
        <meta property="og:description" content="6529 SEIZE" />
      </Head>

      <main className={styles.main}>
        <Header onSetWallets={(wallets) => setConnectedWallets(wallets)} />
        {router.isReady && user && (
          <UserPage wallets={connectedWallets} user={user} />
        )}
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const user = req.query.user;
  if (user.includes(".eth") || !user.startsWith("0x")) {
    return {
      props: { title: user, url: user },
    };
  }
  const ensRequest = await fetch(
    `${process.env.API_ENDPOINT}/api/user/${user}`
  );
  let userDisplay = formatAddress(user);
  const responseText = await ensRequest.text();
  if (responseText) {
    const response = await JSON.parse(responseText);
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
    },
  };
}
