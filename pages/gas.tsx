import Head from "next/head";
import styles from "../styles/Home.module.scss";

import Breadcrumb from "../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";

const Gas = dynamic(() => import("../components/gas-royalties/Gas"), {
  ssr: false,
});

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function GasPage() {
  const breadcrumbs = [{ display: "Home", href: "/" }, { display: "Gas" }];

  return (
    <>
      <Head>
        <title>Gas | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Gas | 6529 SEIZE" />
        <meta property="og:url" content={`${process.env.BASE_ENDPOINT}/gas`} />
        <meta property="og:title" content="Gas" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={styles.mainContainer}>
          <Row>
            <Col>
              <Gas />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
