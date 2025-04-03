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

const CommunityDownloadsTeam = dynamic(
  () => import("../../components/communityDownloads/CommunityDownloadsTeam"),
  {
    ssr: false,
  }
);

export default function TeamDownloads() {
  const { setTitle, title } = useContext(AuthContext);
  const breadcrumbs = [
    { display: "Home", href: "/" },
    { display: "Open Data", href: "/open-data" },
    { display: "Team" },
  ];

  useEffect(() => {
    setTitle({
      title: "Team Downloads | 6529.io",
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Team Downloads | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/open-data/team`}
        />
        <meta property="og:title" content={`Team Downloads`} />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
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
