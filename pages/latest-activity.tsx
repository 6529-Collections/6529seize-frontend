import Head from "next/head";
import styles from "../styles/Home.module.scss";

import { useState } from "react";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";

const LatestActivity = dynamic(
  () => import("../components/latest-activity/LatestActivity"),
  { ssr: false }
);

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
});

export default function TheMemesPage() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Latest Activity" },
  ]);

  return (
    <>
      <Head>
        <title>Latest Activity | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Latest Activity | 6529 SEIZE" />
        <meta
          property="og:url"
          content="http://52.50.150.109:3001/latest-activity"
        />
        <meta property="og:title" content="Latest Activity" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`http://52.50.150.109:3001/Seize_Logo_Glasses_2.png`}
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
