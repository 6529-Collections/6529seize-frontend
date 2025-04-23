import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import { AuthContext } from "../../components/auth/Auth";
import { useContext, useEffect } from "react";

const PrenodesStatus = dynamic(
  () => import("../../components/prenodes/PrenodesStatus"),
  { ssr: false }
);

export default function PrenodesPage() {
  const { setTitle, title } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "Prenodes | Network",
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/network/prenodes`}
        />
        <meta property="og:title" content={title} />
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
              <PrenodesStatus />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
