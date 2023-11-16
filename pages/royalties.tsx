import Head from "next/head";
import styles from "../styles/Home.module.scss";

import Breadcrumb from "../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";

const Royalties = dynamic(
  () => import("../components/gas-royalties/Royalties"),
  {
    ssr: false,
  }
);

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function TheMemesPage() {
  const breadcrumbs = [
    { display: "Home", href: "/" },
    { display: "Royalties" },
  ];

  return (
    <>
      <Head>
        <title>Royalties | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Royalties | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/royalties`}
        />
        <meta property="og:title" content="Royalties" />
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
              <Royalties />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
