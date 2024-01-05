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

interface Props {
  html: string;
}

export default function CommunityMetrics(props: Readonly<any>) {
  const pageProps: Props = props.pageProps;
  const breadcrumbs = [
    { display: "Home", href: "/" },
    { display: "Community Metrics" },
  ];

  return (
    <>
      <Head>
        <title>Community Metrics | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Community Metrics | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/community-metrics`}
        />
        <meta property="og:title" content="Community Metrics" />
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
                    <h1>COMMUNITY METRICS</h1>
                  </Col>
                </Row>
                <Row className="pt-3 pb-3">
                  <Col
                    className={styles.htmlContainer}
                    dangerouslySetInnerHTML={{
                      __html: pageProps.html,
                    }}></Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const request = await fetch(
    `https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/community-metrics.html`
  );
  const text = request.status === 200 ? await request.text() : "";
  return {
    props: {
      html: text,
    },
  };
}
