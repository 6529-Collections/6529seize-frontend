import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { Container, Row, Col } from "react-bootstrap";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
});

export default function AboutTheMemes() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "About", href: "/about" },
    { display: "The Memes" },
  ]);

  return (
    <>
      <Head>
        <title>The Memes | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="The Memes About | 6529 SEIZE" />
        <meta
          property="og:url"
          content="http://52.50.150.109:3001/about/the-memes"
        />
        <meta property="og:title" content="The Memes About" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`http://52.50.150.109:3001/memes-preview.png`}
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
                    <h1>THE MEMES</h1>
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
                      src="/memes-preview.png"
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
                            The Memes Collection is focused on the fight for the
                            open metaverse (decentralization, community,
                            self-sovereignty) and spreading this message to many
                            people, many wallets.
                          </p>
                          <p>
                            It is a collection that is meant to be open and
                            accessible. Edition sizes will generally be large
                            and inexpensive, to spread the word and to avoid gas
                            wars.
                          </p>
                          <p>
                            We will try to have a good time along the way, make
                            some fun art, do great collabs and just generally
                            have a good time.
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
