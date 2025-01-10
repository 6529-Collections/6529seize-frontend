import Head from "next/head";
import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import Breadcrumb, { Crumb } from "../../../components/breadcrumb/Breadcrumb";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../../components/auth/Auth";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const AppWalletImport = dynamic(
  () => import("../../../components/app-wallets/AppWalletImport"),
  {
    ssr: false,
  }
);

export default function AppWalletImportPage(props: any) {
  const { setTitle, title } = useContext(AuthContext);
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "App Wallets", href: "/tools/app-wallets" },
    { display: "Import Wallet" },
  ];

  useEffect(() => {
    setTitle({
      title: "Import App Wallet | 6529 SEIZE",
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="App Wallets | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/tools/app-wallets/import-wallet`}
        />
        <meta property="og:title" content={`Import App Wallet`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <AppWalletImport />
      </main>
    </>
  );
}
