import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { Container, Row, Col } from "react-bootstrap";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import { useState } from "react";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
});

export default function AboutMission() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "About", href: "/about" },
    { display: "Mission" },
  ]);
  return (
    <>
      <Head>
        <title>Mission | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Mission | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`http://52.50.150.109:3001/about/mission`}
        />
        <meta property="og:title" content={`Mission`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`http://52.50.150.109:3001/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={styles.mainContainer}>
          <Row>
            <Col>
              <Container className="pt-4">
                <Row>
                  <Col>
                    <h1>MISSION</h1>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                      ullamco laboris nisi ut aliquip ex ea commodo consequat.
                      Duis aute irure dolor in reprehenderit in voluptate velit
                      esse cillum dolore eu fugiat nulla pariatur. Excepteur
                      sint occaecat cupidatat non proident, sunt in culpa qui
                      officia deserunt mollit anim id est laborum.
                    </p>
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
