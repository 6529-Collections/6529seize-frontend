import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import { useState } from "react";
import dynamic from "next/dynamic";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const CommunityDownloadsTeam = dynamic(
  () => import("../../components/communityDownloads/CommunityDownloadsTeam"),
  {
    ssr: false,
  }
);

export default function Downloads() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Downloads", href: "/downloads" },
    { display: "Team" },
  ]);

  return (
    <>
      <Head>
        <title>Team Downloads | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Team Downloads | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/downloads/team`}
        />
        <meta property="og:title" content={`Team Downloads`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <CommunityDownloadsTeam />
      </main>
    </>
  );
}
