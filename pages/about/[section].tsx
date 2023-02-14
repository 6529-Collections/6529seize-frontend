import styles from "../../styles/Home.module.scss";
import menuStyles from "../../components/about/About.module.scss";
import { Col, Container, Row } from "react-bootstrap";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import { useRouter } from "next/router";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import AboutMemes from "../../components/about/AboutMemes";
import AboutMemesCalendar from "../../components/about/AboutMemesCalendar";
import AboutMemeLab from "../../components/about/AboutMemeLab";
import AboutGradients from "../../components/about/AboutGradients";
import AboutFAQ from "../../components/about/AboutFAQ";
import AboutMinting from "../../components/about/AboutMinting";
import AboutLicense from "../../components/about/AboutLicense";
import AboutApply from "../../components/about/AboutApply";
import AboutContactUs from "../../components/about/AboutContactUs";
import AboutReleaseNotes from "../../components/about/AboutReleaseNotes";
import AboutTermsOfService from "../../components/about/AboutTermsOfService";
import AboutPrivacyPolicy from "../../components/about/AboutPrivacyPolicy";
import AboutCookiePolicy from "../../components/about/AboutCookiePolicy";

export enum AboutSection {
  MEMES = "the-memes",
  MEMES_CALENDAR = "memes-calendar",
  MEME_LAB = "meme-lab",
  GRADIENTS = "6529-gradient",
  FAQ = "faq",
  MISSION = "mission",
  RELEASE_NOTES = "release-notes",
  CONTACT_US = "contact-us",
  TERMS_OF_SERVICE = "terms-of-service",
  PRIVACY_POLICY = "privacy-policy",
  COOKIE_POLICY = "cookie-policy",
  LICENSE = "license",
  MINTING = "minting",
  APPLY = "apply",
}

const Header = dynamic(() => import("../../components/header/Header"), {
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
      if (
        router.query.section &&
        Object.values(AboutSection).includes(
          router.query.section as AboutSection
        )
      ) {
        setSection(router.query.section as AboutSection);
      }
    }
  }, [router.isReady]);

  useEffect(() => {
    if (section) {
      router.push(
        {
          pathname: `${section}`,
        },
        undefined,
        { shallow: true }
      );
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

  function printSection() {
    switch (section) {
      case AboutSection.MEMES:
        return <AboutMemes />;
      case AboutSection.MEMES_CALENDAR:
        return <AboutMemesCalendar />;
      case AboutSection.MEME_LAB:
        return <AboutMemeLab />;
      case AboutSection.GRADIENTS:
        return <AboutGradients />;
      case AboutSection.FAQ:
        return <AboutFAQ />;
      case AboutSection.MINTING:
        return <AboutMinting />;
      case AboutSection.LICENSE:
        return <AboutLicense />;
      case AboutSection.APPLY:
        return <AboutApply />;
      case AboutSection.CONTACT_US:
        return <AboutContactUs />;
      case AboutSection.RELEASE_NOTES:
        return <AboutReleaseNotes />;
      case AboutSection.TERMS_OF_SERVICE:
        return <AboutTermsOfService />;
      case AboutSection.PRIVACY_POLICY:
        return <AboutPrivacyPolicy />;
      case AboutSection.COOKIE_POLICY:
        return <AboutCookiePolicy />;
    }
  }

  return (
    <>
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
                      <Row>
                        <Col>
                          <hr />
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
                      <Row>
                        <Col>
                          <hr />
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
                      <Row>
                        <Col>
                          <hr />
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
                          onClick={() => setSection(AboutSection.COOKIE_POLICY)}
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
                  {section && (
                    <Col className={menuStyles.aboutMenuRight}>
                      {printSection()}
                    </Col>
                  )}
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
                      <Row>
                        <Col>
                          <hr />
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
                      <Row>
                        <Col>
                          <hr />
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
                      <Row>
                        <Col>
                          <hr />
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
                          onClick={() => setSection(AboutSection.COOKIE_POLICY)}
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
