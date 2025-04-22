import Head from "next/head";
import styles from "../styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../components/auth/Auth";

const LatestActivity = dynamic(
  () => import("../components/latest-activity/LatestActivity"),
  { ssr: false }
);


export default function TheMemesPage() {
  const { setTitle, title } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "NFT Activity | 6529.io",
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="NFT Activity | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/nft-activity`}
        />
        <meta property="og:title" content="NFT Activity" />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
      </Head>

      <main className={styles.main}>
        <Container fluid className={styles.leaderboardContainer}>
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
