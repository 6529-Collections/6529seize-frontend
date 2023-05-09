import Head from "next/head";
import styles from "../styles/Home.module.scss";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";
import DelegationMappingToolPlaceholder from "../components/delegation-mapping-tool/DelegationMappingToolPlaceholder";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const DelegationMappingTool = dynamic(
  () => import("../components/delegation-mapping-tool/DelegationMappingTool"),

  { ssr: false, loading: () => <DelegationMappingToolPlaceholder /> }
);

const HtmlModal = dynamic(() => import("../components/htmlModal/HtmlModal"), {
  ssr: false,
});

export default function DelegationMappingToolPage() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Delegation Mapping Tool" },
  ]);

  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

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
            <Col
              xs={{ span: 12 }}
              sm={{ span: 10, offset: 1 }}
              md={{ span: 8, offset: 2 }}
              lg={{ span: 6, offset: 3 }}>
              <Container className="pt-3 pb-5">
                <Row>
                  <Col>
                    <h1 className="float-none text-center">
                      DELEGATION MAPPING TOOL
                    </h1>
                  </Col>
                </Row>
                <Row className="pt-2 pb-4">
                  <Col className="text-center">
                    <span
                      className={styles.instructionsLink}
                      onClick={() => setShowInstructionsModal(true)}>
                      How to use this tool?
                    </span>
                  </Col>
                </Row>
                <Row className="pt-4">
                  <Col>
                    <DelegationMappingTool />
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
        <HtmlModal
          title="How to use Delegation Mapping Tool?"
          link="https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegation-mapping-tool/how-to-use.html"
          show={showInstructionsModal}
          setShow={function (show: boolean) {
            setShowInstructionsModal(show);
          }}
        />
      </main>
    </>
  );
}
