import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const NextGenComponent = dynamic(
  () => import("../../components/nextGen/NextGen"),
  {
    ssr: false,
  }
);

export default function NextGen() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "NextGen" },
  ]);

  return (
    <>
      <Head>
        <title>NextGen | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="NextGen | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/nextgen`}
        />
        <meta property="og:title" content="NextGen" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/re-memes-b.jpeg`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={`${styles.main}`}>
          <Row>
            <Col>
              <NextGenComponent />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
