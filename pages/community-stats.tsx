import Head from "next/head";
import styles from "../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { Container, Row, Col, Table } from "react-bootstrap";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { useEffect, useState } from "react";
import Image from "next/image";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const CommunityStatsComponent = dynamic(
  () => import("../components/communityStats/CommunityStats"),
  { ssr: false }
);

export default function CommunityStats() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Community Stats" },
  ]);

  return (
    <>
      <Head>
        <title>Community Stats | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Community Stats | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/community-stats`}
        />
        <meta property="og:title" content="Community Stats" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={`${styles.main} ${styles.tdhMain}`}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={styles.mainContainer}>
          <Row>
            <Col>
              <Container className="pt-4">
                <Row>
                  <Col>
                    <h1>COMMUNITY STATS</h1>
                  </Col>
                </Row>
                <Row className="pt-3 pb-3">
                  <Col>
                    <CommunityStatsComponent />
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
