import Head from "next/head";
import styles from "../styles/Home.module.scss";
import Image from "next/image";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function Buidl() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "BUIDL" },
  ]);

  return (
    <>
      <Head>
        <title>BUIDL | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="BUIDL | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/buidl`}
        />
        <meta property="og:title" content="BUIDL" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container
          fluid
          className={`${styles.mainContainer} ${styles.pageNotFound} text-center`}>
          <Row>
            <Col>
              <Image
                src="/SummerGlasses.svg"
                width={100}
                height={100}
                alt="SummerGlasses"
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <h4>
                <p>
                  We are going to BUIDL together to spread the word about a
                  decentralized metaverse.
                </p>
                <p>Tools to help in this goal are coming soon.</p>
              </h4>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
