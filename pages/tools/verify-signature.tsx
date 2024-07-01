import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const VerifySignature = dynamic(
  () => import("../../components/messageSignatures/VerifySignature"),
  {
    ssr: false,
  }
);

export default function DelegationMappingToolPage() {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Verify Signature" },
  ];

  return (
    <>
      <Head>
        <title>Verify Signature | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Verify Signature | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/verify-signature`}
        />
        <meta property="og:title" content="Verify Signature" />
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
              <Container>
                <Row className="pt-4">
                  <Col>
                    <h1 className="float-none text-center mb-0">
                      <span className="font-lightest">Verify</span> Signature
                    </h1>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <VerifySignature />
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
