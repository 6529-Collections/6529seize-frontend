import styles from "../../../styles/Home.module.scss";
import Head from "next/head";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../../components/auth/Auth";
import Breadcrumb, { Crumb } from "../../../components/breadcrumb/Breadcrumb";
import { formatAddress } from "../../../helpers/Helpers";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const AppWallet = dynamic(
  () => import("../../../components/app-wallets/AppWallet"),
  {
    ssr: false,
  }
);

export default function AppWalletPage(props: any) {
  const { setTitle, title } = useContext(AuthContext);

  const pageProps = props.pageProps;
  const address = pageProps.address;

  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "App Wallets", href: "/tools/app-wallets" },
    { display: address },
  ];

  useEffect(() => {
    setTitle({
      title: `${formatAddress(address)} | App Wallets | 6529 SEIZE`,
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
        <meta property="og:description" content="6529 SEIZE" />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <AppWallet address={address} />
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
