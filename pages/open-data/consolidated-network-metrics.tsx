import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import Breadcrumb from "../../components/breadcrumb/Breadcrumb";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { VIEW } from "../../components/communityDownloads/CommunityDownloadsTDH";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const CommunityDownloadsTDH = dynamic(
  () => import("../../components/communityDownloads/CommunityDownloadsTDH"),
  {
    ssr: false,
  }
);

export default function ConsolidatedCommunityMetricsDownloads() {
  const { setTitle, title } = useContext(AuthContext);
  const breadcrumbs = [
    { display: "Home", href: "/" },
    { display: "Open Data", href: "/open-data" },
    { display: "Consolidated Network Metrics" },
  ];

  useEffect(() => {
    setTitle({
      title: "Consolidated Network Metrics Downloads | 6529 SEIZE",
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Consolidated Network Metrics Downloads | 6529 SEIZE"
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/open-data/consolidated-network-metrics`}
        />
        <meta
          property="og:title"
          content={`Consolidated Network Metrics Downloads`}
        />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <CommunityDownloadsTDH view={VIEW.CONSOLIDATION} />
      </main>
    </>
  );
}
