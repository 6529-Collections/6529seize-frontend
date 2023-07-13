import Head from "next/head";
import styles from "../styles/Home.module.scss";

import { useState } from "react";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";

const Snapshots = dynamic(() => import("../components/snapshots/Snapshots"), {
  ssr: false,
});

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function TheMemesPage() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Snapshots" },
  ]);

  return (
    <>
      <Head>
        <title>Snapshots | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Snapshots | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/snapshots`}
        />
        <meta property="og:title" content="Snapshots" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={styles.mainContainer}>
          <Row>
            <Col>
              <Snapshots />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
