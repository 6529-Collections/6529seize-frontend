import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import Breadcrumb from "../../components/breadcrumb/Breadcrumb";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { VIEW } from "../../components/consolidation-switch/ConsolidationSwitch";

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
  const breadcrumbs = [
    { display: "Home", href: "/" },
    { display: "Downloads", href: "/downloads" },
    { display: "Consolidated Community Metrics" },
  ];

  return (
    <>
      <Head>
        <title>Consolidated Community Metrics Downloads | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Consolidated Community Metrics Downloads | 6529 SEIZE"
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/downloads/consolidated-community-metrics`}
        />
        <meta
          property="og:title"
          content={`Consolidated Community Metrics Downloads`}
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
