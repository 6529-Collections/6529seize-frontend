import Head from "next/head";
import styles from "../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { areEqualAddresses, formatAddress } from "../helpers/Helpers";
import { MANIFOLD, SIX529_MUSEUM } from "../constants";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";
import { useEffect, useState } from "react";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const UserPage = dynamic(() => import("../components/user/UserPage"), {
  ssr: false,
});

export default function UserPageIndex(props: any) {
  const router = useRouter();
  const pagenameFull = `${props.title} | 6529 SEIZE`;

  const [user, setUser] = useState(
    Array.isArray(router.query.user) ? router.query.user[0] : router.query.user
  );

  useEffect(() => {
    if (user) {
      if (!user.startsWith("0x") && !user.endsWith(".eth")) {
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
        <Header />
        {router.isReady && router.query.user && (
          <UserPage
            user={
              Array.isArray(router.query.user)
                ? router.query.user[0]
                : router.query.user
            }
          />
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
  const ensRequest = await fetch(`${process.env.API_ENDPOINT}/api/ens/${user}`);
  let userDisplay = formatAddress(user);
  const responseText = await ensRequest.text();
  if (responseText) {
    const response = await JSON.parse(responseText);
    userDisplay = response.display
      ? response.display
      : areEqualAddresses(user, SIX529_MUSEUM)
      ? "6529Museum"
      : areEqualAddresses(user, MANIFOLD)
      ? "Manifold-Gallery"
      : userDisplay;
  }

  return {
    props: {
      title: userDisplay,
      url: userDisplay.includes(".eth") ? userDisplay : user,
    },
  };
}
