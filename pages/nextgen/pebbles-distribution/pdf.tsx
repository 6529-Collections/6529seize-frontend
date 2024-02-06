import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { Col, Container, Row } from "react-bootstrap";
import React from "react";
import { NextgenLogo, PDF_LINK, PebblesHead } from ".";

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

  return (
    <>
      <PebblesHead title="Pebbles Distribution" />

      <main className={styles.main}>
        <Header />
        <Container className="pt-5 pb-5">
          <NextgenLogo />
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
