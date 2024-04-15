import Head from "next/head";
import styles from "../styles/Home.module.scss";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";

const LatestActivity = dynamic(
  () => import("../components/latest-activity/LatestActivity"),
  { ssr: false }
);

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function TheMemesPage() {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "NFT Activity" },
  ];

  return (
    <>
      <Head>
        <title>NFT Activity | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="NFT Activity | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/nft-activity`}
        />
        <meta property="og:title" content="NFT Activity" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container
          fluid
          className={`${styles.mainContainer} ${styles.leaderboardContainer}`}>
          <Row>
            <Col>
              <LatestActivity page={1} pageSize={50} showMore={true} />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
