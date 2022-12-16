import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { Container, Row, Col } from "react-bootstrap";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
});

export default function About6529Gradient() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "About", href: "/about" },
    { display: "6529 Gradient" },
  ]);

  return (
    <>
      <Head>
        <title>About 6529 Gradient | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="6529 Gradient About | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`http://52.50.150.109:3001/about/6529-gradient`}
        />
        <meta property="og:title" content={`6529 Gradient About`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`http://52.50.150.109:3001/gradients-preview.png`}
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
                    <h1>6529 GRADIENT</h1>
                  </Col>
                </Row>
                <Row className="pt-2 pb-2">
                  <Col
                    className="pt-3 pb-3"
                    xs={{ span: 12 }}
                    sm={{ span: 12 }}
                    md={{ span: 6 }}
                    lg={{ span: 6 }}>
                    <img
                      src="/gradients-preview.png"
                      className={styles.collectionImage}
                    />
                  </Col>
                  <Col
                    className="pt-3 pb-3"
                    xs={{ span: 12 }}
                    sm={{ span: 12 }}
                    md={{ span: 6 }}
                    lg={{ span: 6 }}>
                    <Container>
                      <Row>
                        <Col>
                          <p>
                            The 6529 Gradient Collection represents the 6529
                            symbol in its original two stark black and white
                            forms as well 98 grayscale gradients in-between.
                          </p>
                          <p>
                            It is the artist&apos;s (@6529er) preferred
                            interpretation and genesis drop of his work.
                          </p>
                          <p>
                            Each of the 100 pieces is represented as a 100%
                            on-chain SVG with a secondary IPFS link.
                          </p>
                          <p>
                            The 101st piece is Gradient #50 which is a special
                            GIF - it moves!
                          </p>
                        </Col>
                      </Row>
                    </Container>
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
