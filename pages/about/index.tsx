import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import { Col, Container, Row } from "react-bootstrap";

import { useState } from "react";
import dynamic from "next/dynamic";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
});

export default function About() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "About" },
  ]);

  return (
    <>
      <Head>
        <title>About | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="About | 6529 SEIZE" />
        <meta property="og:url" content={`http://52.50.150.109:3001/about`} />
        <meta property="og:title" content={`About`} />
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
                    <h1>ABOUT</h1>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <h2>
                      <a href="/about/the-memes">The Memes</a>
                    </h2>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <h2>
                      <a href="/about/memes-calendar">Memes Calendar</a>
                    </h2>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <h2>
                      <a href="/about/memes-faq">Memes FAQ</a>
                    </h2>
                  </Col>
                </Row>
                <hr />
                <Row className="pt-3">
                  <Col>
                    <h2>
                      <a href="/about/6529-gradient">6529 Gradient</a>
                    </h2>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <h2>
                      <a href="/about/gradients-faq">Gradients FAQ</a>
                    </h2>
                  </Col>
                </Row>
                <hr />
                <Row className="pt-3">
                  <Col>
                    <h2>
                      <a href="/about/mission">Mission</a>
                    </h2>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <h2>
                      <a href="/about/ccontact-us">Contact Us</a>
                    </h2>
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
