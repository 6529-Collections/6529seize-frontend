import Head from "next/head";
import styles from "../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { formatAddress } from "../helpers/Helpers";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
});

const UserPage = dynamic(() => import("../components/user/UserPage"), {
  ssr: false,
});

export default function UserPageIndex(props: any) {
  const router = useRouter();
  const pagenameFull = `${props.title} | 6529 SEIZE`;
  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={props.title} />
        <meta
          property="og:url"
          content={`http://52.50.150.109:3001/${props.url}`}
        />
        <meta property="og:title" content={props.title} />
        <meta
          property="og:image"
          content={`http://52.50.150.109:3001/Seize_Logo_Glasses_2.png`}
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
  const nftRequest = await fetch(`${process.env.API_ENDPOINT}/api/ens/${user}`);
  const response = await nftRequest.json();

  const userDisplay = response.display
    ? response.display
    : formatAddress(response.wallet);

  return {
    props: {
      title: userDisplay,
      url: response.display ? response.display : response.wallet,
    },
  };
}
