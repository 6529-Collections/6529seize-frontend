import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import Breadcrumb from "../../components/breadcrumb/Breadcrumb";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const CommunityDownloads = dynamic(
  () => import("../../components/communityDownloads/CommunityDownloads"),
  {
    ssr: false,
  }
);

export default function Downloads() {
  const { setTitle, title } = useContext(AuthContext);
  const breadcrumbs = [
    { display: "Home", href: "/" },
    { display: "Open Data" },
  ];

  useEffect(() => {
    setTitle({
      title: "Open Data | 6529.io",
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Open Data | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/open-data`}
        />
        <meta property="og:title" content={`Open Data`} />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <CommunityDownloads />
      </main>
    </>
  );
}
