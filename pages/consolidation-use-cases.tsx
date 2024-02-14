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

export default function ConsolidationUseCases() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Consolidation Use Cases" },
  ]);

  const [html, setHtml] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const url = `https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/consolidation-use-cases.html`;
    fetch(url).then((response) => {
      if (response.status === 200) {
        response.text().then((htmlText) => {
          setHtml(htmlText);
          setError(false);
        });
      } else {
        setError(true);
      }
    });
  }, []);

  return (
    <>
      <Head>
        <title>Consolidation Use Cases | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Consolidation Use Cases | 6529 SEIZE"
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/consolidation-use-cases`}
        />
        <meta property="og:title" content="Consolidation Use Cases" />
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
                    <h1>
                      <span className="font-lightest">Consolidation</span> Use
                      Cases
                    </h1>
                  </Col>
                </Row>
                <Row className="pt-3 pb-3">
                  {error ? (
                    <div>
                      <Image
                        width="0"
                        height="0"
                        style={{ height: "auto", width: "100px" }}
                        src="/SummerGlasses.svg"
                        alt="SummerGlasses"
                      />
                      <h2>Loading HTML Failed</h2>
                    </div>
                  ) : (
                    <Col
                      className={styles.htmlContainer}
                      dangerouslySetInnerHTML={{
                        __html: html,
                      }}></Col>
                  )}
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
