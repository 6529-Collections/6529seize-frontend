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
        const section: AboutSection = router.query.section as AboutSection;
        if (section) {
          setSection(section);
        } else {
          setSection(AboutSection.MEMES);
        }
      }
    }
  }, [router.isReady]);

  useEffect(() => {
    if (section) {
      router.push(`?section=${section}`, undefined, {
        shallow: true,
      });
      const sectionTitle = section
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      setBreadcrumbs([
        { display: "Home", href: "/" },
        { display: "About" },
        { display: sectionTitle },
      ]);
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
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.MEMES
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          The Memes
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setSection(AboutSection.MEMES_CALENDAR)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.MEMES_CALENDAR
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Memes Calendar
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.MEME_LAB)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.MEME_LAB
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          MemeLab
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.GRADIENTS)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.GRADIENTS
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Gradient
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.FAQ)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.FAQ
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          FAQ
                        </Col>
                      </Row>
					  <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.MINTING)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.MINTING
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Minting
                        </Col>
                      </Row>
					  <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.LICENSE)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.LICENSE
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          License
                        </Col>
                      </Row>
					  <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.APPLY)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.APPLY
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Apply
                        </Col>
                      </Row>
					  <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.CONTACT_US)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.CONTACT_US
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Contact Us
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.RELEASE_NOTES)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.RELEASE_NOTES
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Release Notes
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setSection(AboutSection.TERMS_OF_SERVICE)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.TERMS_OF_SERVICE
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Terms of Service
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setSection(AboutSection.PRIVACY_POLICY)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.PRIVACY_POLICY
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Privacy Policy
                        </Col>
                      </Row>
					  <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setSection(AboutSection.COOKIE_POLICY)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.COOKIE_POLICY
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Cookie Policy
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
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.MEMES
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          The Memes
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setSection(AboutSection.MEMES_CALENDAR)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.MEMES_CALENDAR
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Memes Calendar
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.MEME_LAB)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.MEME_LAB
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          MemeLab
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.GRADIENTS)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.GRADIENTS
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Gradient
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.FAQ)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.FAQ
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          FAQ
                        </Col>
                      </Row>
					  <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.MINTING)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.MINTING
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Minting
                        </Col>
                      </Row>
					  <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.LICENSE)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.LICENSE
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          License
                        </Col>
                      </Row>
					  <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.APPLY)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.APPLY
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Apply
                        </Col>
                      </Row>
					  <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.CONTACT_US)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.CONTACT_US
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Contact Us
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setSection(AboutSection.RELEASE_NOTES)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.RELEASE_NOTES
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Release Notes
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setSection(AboutSection.TERMS_OF_SERVICE)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.TERMS_OF_SERVICE
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Terms of Service
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setSection(AboutSection.PRIVACY_POLICY)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.PRIVACY_POLICY
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Privacy Policy
                        </Col>
                      </Row>
					  <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setSection(AboutSection.COOKIE_POLICY)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section == AboutSection.COOKIE_POLICY
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Cookie Policy
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