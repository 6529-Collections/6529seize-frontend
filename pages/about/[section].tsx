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
import AboutMinting from "../../components/about/AboutMinting";
import AboutLicense from "../../components/about/AboutLicense";
import AboutApply from "../../components/about/AboutApply";
import AboutContactUs from "../../components/about/AboutContactUs";
import AboutReleaseNotes from "../../components/about/AboutReleaseNotes";
import AboutTermsOfService from "../../components/about/AboutTermsOfService";
import AboutPrivacyPolicy from "../../components/about/AboutPrivacyPolicy";
import AboutCookiePolicy from "../../components/about/AboutCookiePolicy";
import Head from "next/head";
import AboutDataDecentral from "../../components/about/AboutDataDecentral";
import AboutGDRC1 from "../../components/about/AboutGDRC1";
import AboutNFTDelegation from "../../components/about/AboutNFTDelegation";
import AboutHTML from "../../components/about/AboutHTML";
import AboutSubscriptions from "../../components/about/AboutSubscriptions";

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
  DATA_DECENTR = "data-decentralization",
  GDRC1 = "gdrc1",
  NFT_DELEGATION = "nft-delegation",
  ENS = "ens",
  SUBSCRIPTIONS = "subscriptions",
}

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

interface Props {
  section: AboutSection;
  sectionTitle: string;
  gdrc1Text: string;
  releaseNotesText: string;
  faqText: string;
  ensText: string;
}

export default function About(props: any) {
  const pageProps: Props = props.pageProps;
  const router = useRouter();
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "About" },
  ]);

  const [section, setSection] = useState<AboutSection>(pageProps.section);
  const [sectionTitle, setSectionTitle] = useState<string>(
    pageProps.sectionTitle
  );

  function setNewSection(section: AboutSection) {
    setSection(section);
    setSectionTitle(section.toUpperCase().replaceAll("-", " "));
  }

  useEffect(() => {
    if (section && sectionTitle) {
      router.push(
        {
          pathname: `${section}`,
        },
        undefined,
        { shallow: true }
      );

      setBreadcrumbs([
        { display: "Home", href: "/" },
        { display: `About - ${sectionTitle}` },
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
        return <AboutHTML title="FAQ" html={pageProps.faqText} />;
      case AboutSection.MINTING:
        return <AboutMinting />;
      case AboutSection.LICENSE:
        return <AboutLicense />;
      case AboutSection.APPLY:
        return <AboutApply />;
      case AboutSection.CONTACT_US:
        return <AboutContactUs />;
      case AboutSection.RELEASE_NOTES:
        return <AboutReleaseNotes html={pageProps.releaseNotesText} />;
      case AboutSection.TERMS_OF_SERVICE:
        return <AboutTermsOfService />;
      case AboutSection.PRIVACY_POLICY:
        return <AboutPrivacyPolicy />;
      case AboutSection.COOKIE_POLICY:
        return <AboutCookiePolicy />;
      case AboutSection.DATA_DECENTR:
        return <AboutDataDecentral />;
      case AboutSection.GDRC1:
        return <AboutGDRC1 html={pageProps.gdrc1Text} />;
      case AboutSection.NFT_DELEGATION:
        return <AboutNFTDelegation />;
      case AboutSection.ENS:
        return <AboutHTML title="ENS" html={pageProps.ensText} />;
      case AboutSection.SUBSCRIPTIONS:
        return <AboutSubscriptions />;
    }
  }

  return (
    <>
      <Head>
        <title>{`About - ${sectionTitle} | 6529 SEIZE`}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content={`About - ${sectionTitle} | 6529 SEIZE`}
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/about/${section}`}
        />
        <meta property="og:title" content={`About - ${sectionTitle}`} />
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
                          onClick={() => setNewSection(AboutSection.MEMES)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.MEMES
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          The Memes
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setNewSection(AboutSection.SUBSCRIPTIONS)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.SUBSCRIPTIONS
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Subscriptions
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setNewSection(AboutSection.MEMES_CALENDAR)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.MEMES_CALENDAR
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Memes Calendar
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.MEME_LAB)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.MEME_LAB
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Meme Lab
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.GRADIENTS)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.GRADIENTS
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
                          onClick={() => setNewSection(AboutSection.GDRC1)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.GDRC1
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          GDRC1
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
                            setNewSection(AboutSection.NFT_DELEGATION)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.NFT_DELEGATION
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          NFT Delegation
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <hr />
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.FAQ)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.FAQ
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          FAQ
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.ENS)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.ENS
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          ENS
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.MINTING)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.MINTING
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Minting
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.LICENSE)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.LICENSE
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
                          onClick={() => setNewSection(AboutSection.APPLY)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.APPLY
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Apply
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.CONTACT_US)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.CONTACT_US
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Contact Us
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setNewSection(AboutSection.RELEASE_NOTES)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.RELEASE_NOTES
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Release Notes
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setNewSection(AboutSection.DATA_DECENTR)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.DATA_DECENTR
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Data Decentralization
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
                            setNewSection(AboutSection.TERMS_OF_SERVICE)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.TERMS_OF_SERVICE
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Terms of Service
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setNewSection(AboutSection.PRIVACY_POLICY)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.PRIVACY_POLICY
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Privacy Policy
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setNewSection(AboutSection.COOKIE_POLICY)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.COOKIE_POLICY
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
                          onClick={() => setNewSection(AboutSection.MEMES)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.MEMES
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          The Memes
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setNewSection(AboutSection.SUBSCRIPTIONS)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.SUBSCRIPTIONS
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Subscriptions
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setNewSection(AboutSection.MEMES_CALENDAR)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.MEMES_CALENDAR
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Memes Calendar
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.MEME_LAB)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.MEME_LAB
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          MemeLab
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.GRADIENTS)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.GRADIENTS
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
                          onClick={() => setNewSection(AboutSection.GDRC1)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.GDRC1
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          GDRC1
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
                            setNewSection(AboutSection.NFT_DELEGATION)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.NFT_DELEGATION
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          NFT Delegation
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <hr />
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.FAQ)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.FAQ
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          FAQ
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.ENS)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.ENS
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          ENS
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.MINTING)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.MINTING
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Minting
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.LICENSE)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.LICENSE
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
                          onClick={() => setNewSection(AboutSection.APPLY)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.APPLY
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Apply
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() => setNewSection(AboutSection.CONTACT_US)}
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.CONTACT_US
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Contact Us
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setNewSection(AboutSection.RELEASE_NOTES)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.RELEASE_NOTES
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Release Notes
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setNewSection(AboutSection.DATA_DECENTR)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.DATA_DECENTR
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Data Decentralization
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
                            setNewSection(AboutSection.TERMS_OF_SERVICE)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.TERMS_OF_SERVICE
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Terms of Service
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setNewSection(AboutSection.PRIVACY_POLICY)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.PRIVACY_POLICY
                              ? menuStyles.aboutMenuLeftItemActive
                              : ""
                          }`}>
                          Privacy Policy
                        </Col>
                      </Row>
                      <Row className="pt-1 pb-1">
                        <Col
                          onClick={() =>
                            setNewSection(AboutSection.COOKIE_POLICY)
                          }
                          className={`${menuStyles.aboutMenuLeftItem} ${
                            section === AboutSection.COOKIE_POLICY
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

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const sectionPath = req.query.section;

  if (sectionPath === "tos") {
    return {
      redirect: {
        destination: "/about/terms-of-service",
        permanent: false,
      },
    };
  }

  if (
    sectionPath &&
    Object.values(AboutSection).includes(sectionPath as AboutSection)
  ) {
    const section = sectionPath as AboutSection;
    const sectionTitle = section.toUpperCase().replaceAll("-", " ");

    const gdrc1Request = await fetch(
      `https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/about/gdrc1.html`
    );
    const gdrc1Text =
      gdrc1Request.status === 200 ? await gdrc1Request.text() : "";

    const releaseNotesRequest = await fetch(
      `https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/about/release_notes.html`
    );
    const releaseNotesText =
      releaseNotesRequest.status === 200
        ? await releaseNotesRequest.text()
        : "";

    const faqRequest = await fetch(
      `https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/about/faq.html`
    );
    const faqText = faqRequest.status === 200 ? await faqRequest.text() : "";

    const ensRequest = await fetch(
      `https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/about/ens.html`
    );
    const ensText = ensRequest.status === 200 ? await ensRequest.text() : "";

    return {
      props: {
        section,
        sectionTitle,
        gdrc1Text,
        releaseNotesText,
        faqText,
        ensText,
      },
    };
  } else {
    return {
      redirect: {
        permanent: false,
        destination: "/404",
      },
      props: {},
    };
  }
}
