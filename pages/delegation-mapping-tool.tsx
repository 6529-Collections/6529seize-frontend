import Head from "next/head";
import styles from "../styles/Home.module.scss";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const DelegationMappingTool = dynamic(
  () => import("../components/delegation-mapping-tool/DelegationMappingTool"),
  { ssr: false }
);

export default function DelegationMappingToolPage() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Delegation Mapping Tool" },
  ]);

  return (
    <>
      <Head>
        <title>Delegation Mapping Tool | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Delegation Mapping Tool | 6529 SEIZE"
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/delegation-mapping-tool`}
        />
        <meta property="og:title" content="Delegation Mapping Tool" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={`${styles.mainContainer}`}>
          <Row>
            <Col>
              <Container className="pt-3 pb-3">
                <Row>
                  <Col>
                    <h1>DELEGATION MAPPING TOOL</h1>
                  </Col>
                </Row>
                <Row className="pt-4">
                  <Col
                    xs={{ span: 12 }}
                    sm={{ span: 12 }}
                    md={{ span: 10, offset: 1 }}
                    lg={{ span: 8, offset: 2 }}>
                    <DelegationMappingTool />
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
