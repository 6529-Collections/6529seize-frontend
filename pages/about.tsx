import Head from "next/head";
import styles from "../styles/Home.module.scss";
import menuStyles from "../components/about/About.module.scss";
import { Col, Container, Row } from "react-bootstrap";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { useRouter } from "next/router";
import AboutSectionComponent, {
  AboutSection,
} from "../components/about/AboutSection";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function About() {
  const router = useRouter();
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "About" },
  ]);

  const [section, setSection] = useState<AboutSection>();

  useEffect(() => {
    if (router.isReady) {
      if (!router.query.section) {
        setSection(AboutSection.MEMES);
      } else {
        setSection(router.query.section as AboutSection);
      }
    }
  }, [router.isReady]);

  useEffect(() => {
    if (section) {
      router.push(`?section=${section}`, undefined, {
        shallow: true,
      });
      window.scrollTo(0, 0);
    }
  }, [section]);

  return (
    <>
      <Head>
        <title>About | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="About | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/about`}
        />
        <meta property="og:title" content={`About`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
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
                  <Col className={menuStyles.aboutMenuLeft}>
                    <Container>
                      <Row>
                        <Col>
                          <h3>About</h3>
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.MEMES)}
                          className={menuStyles.aboutMenuLeftItem}>
                          The Memes
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setSection(AboutSection.MEMES_CALENDAR)
                          }
                          className={menuStyles.aboutMenuLeftItem}>
                          Memes Calendar
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.MEMES_FAQ)}
                          className={menuStyles.aboutMenuLeftItem}>
                          Memes FAQ
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.GRADIENTS)}
                          className={menuStyles.aboutMenuLeftItem}>
                          6529 Gradient
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.GRADIENTS_FAQ)}
                          className={menuStyles.aboutMenuLeftItem}>
                          Gradients FAQ
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.MISSION)}
                          className={menuStyles.aboutMenuLeftItem}>
                          Mission
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.RELEASE_NOTES)}
                          className={menuStyles.aboutMenuLeftItem}>
                          Release Notes
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.CONTACT_US)}
                          className={menuStyles.aboutMenuLeftItem}>
                          Contact Us
                        </Col>
                      </Row>
                    </Container>
                  </Col>
                  {section && <AboutSectionComponent section={section} />}
                </Row>
                <Row className="pt-4">
                  <Col className={menuStyles.aboutMenuLeftFull}>
                    <Container>
                      <Row>
                        <Col>
                          <h3 className="float-none">About</h3>
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.MEMES)}
                          className={menuStyles.aboutMenuLeftItem}>
                          The Memes
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setSection(AboutSection.MEMES_CALENDAR)
                          }
                          className={menuStyles.aboutMenuLeftItem}>
                          Memes Calendar
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.MEMES_FAQ)}
                          className={menuStyles.aboutMenuLeftItem}>
                          Memes FAQ
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.GRADIENTS)}
                          className={menuStyles.aboutMenuLeftItem}>
                          6529 Gradient
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.GRADIENTS_FAQ)}
                          className={menuStyles.aboutMenuLeftItem}>
                          Gradients FAQ
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.MISSION)}
                          className={menuStyles.aboutMenuLeftItem}>
                          Mission
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.RELEASE_NOTES)}
                          className={menuStyles.aboutMenuLeftItem}>
                          Release Notes
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.CONTACT_US)}
                          className={menuStyles.aboutMenuLeftItem}>
                          Contact Us
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
