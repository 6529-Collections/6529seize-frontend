import Head from "next/head";
import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import Image from "next/image";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { Col, Container, Row, Table } from "react-bootstrap";
import csvParser from "csv-parser";
import React from "react";

const PDF_LINK =
  "https://d3lqz0a4bldqgf.cloudfront.net/nextgen/assets/1/distribution.pdf";

interface DataRow {
  address: string;
  mint_count: number;
  token_data: {
    palettes: string;
  };
}

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const PdfViewer = dynamic(
  () => import("../../../components/pdfViewer/PdfViewer"),
  {
    ssr: false,
  }
);

export default function NextGen(props: any) {
  const pageProps = props.pageProps;

  const data0: DataRow[] = pageProps.data0;
  const data1: DataRow[] = pageProps.data1;

  return (
    <>
      <Head>
        <title>Pebbles Distribution | NextGen | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="preload"
          href={PDF_LINK}
          as="document"
          type="application/pdf"
        />
        <meta name="description" content="NextGen | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/nextgen`}
        />
        <meta property="og:title" content="Pebbles Distribution | NextGen" />
        <meta property="og:description" content="6529 Seize" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/nextgen-logo.png`}
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main className={styles.main}>
        <Header />
        <Container className="pt-5 pb-5">
          <Row>
            <Col>
              <Image
                width="0"
                height="0"
                style={{ height: "auto", width: "400px" }}
                src="/nextgen-logo.png"
                alt="nextgen"
              />
            </Col>
          </Row>
          <Row className="pt-5">
            <Col>
              <PdfViewer file={PDF_LINK} />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
