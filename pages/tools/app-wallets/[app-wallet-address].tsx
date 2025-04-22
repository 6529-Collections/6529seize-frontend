import styles from "../../../styles/Home.module.scss";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../../components/auth/Auth";
import { formatAddress } from "../../../helpers/Helpers";

const AppWalletComponent = dynamic(
  () => import("../../../components/app-wallets/AppWallet"),
  {
    ssr: false,
  }
);

export default function AppWalletPage(props: any) {
  const { setTitle, title } = useContext(AuthContext);

  const pageProps = props.pageProps;
  const address = pageProps.address;

  useEffect(() => {
    setTitle({
      title: `${formatAddress(address)} | App Wallets | 6529.io`,
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={title} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/the-memes/${pageProps.id}`}
        />
        <meta property="og:title" content={pageProps.name} />
        <meta property="og:image" content={pageProps.image} />
        <meta property="og:description" content="6529.io" />
      </Head>

      <main className={styles.main}>
        <AppWalletComponent address={address} />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const address = req.query["app-wallet-address"];

  return {
    props: {
      address,
    },
  };
}
