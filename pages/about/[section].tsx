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
import AboutNakamotoThreshold from "../../components/about/AboutNakamotoThreshold";
import AboutSubscriptionsUpcoming from "../../components/about/AboutSubscriptionsUpcoming";
import AboutCopyright from "../../components/about/AboutCopyright";

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
  SUBSCRIPTIONS_UPCOMING = "upcoming-drops",
  NAKAMOTO_THRESHOLD = "nakamoto-threshold",
  COPYRIGHT = "copyright",
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

  const [section, setSection] = useState<AboutSection>();
  const [sectionTitle, setSectionTitle] = useState<string>();

  function setNewSection(section: AboutSection) {
    setSection(section);
    setSectionTitle(section.toUpperCase().replaceAll("-", " "));
  }

  useEffect(() => {
    setSection(pageProps.section);
    setSectionTitle(pageProps.sectionTitle);
  }, [pageProps]);

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
      case AboutSection.SUBSCRIPTIONS_UPCOMING:
        return <AboutSubscriptionsUpcoming />;
      case AboutSection.NAKAMOTO_THRESHOLD:
        return <AboutNakamotoThreshold />;
      case AboutSection.COPYRIGHT:
        return <AboutCopyright />;
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
                      <AboutRow
                        section={AboutSection.MEMES}
                        currentSection={section}
                        setSection={setNewSection}
                        title="The Memes"
                      />
                      <AboutRow
                        section={AboutSection.SUBSCRIPTIONS}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Subscriptions"
                      />
                      <AboutRow
                        section={AboutSection.SUBSCRIPTIONS_UPCOMING}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Upcoming Drops"
                      />
                      <AboutRow
                        section={AboutSection.MEMES_CALENDAR}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Memes Calendar"
                      />
                      <AboutRow
                        section={AboutSection.MEME_LAB}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Meme Lab"
                      />
                      <AboutRow
                        section={AboutSection.GRADIENTS}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Gradient"
                      />
                      <Row>
                        <Col>
                          <hr />
                        </Col>
                      </Row>
                      <AboutRow
                        section={AboutSection.GDRC1}
                        currentSection={section}
                        setSection={setNewSection}
                        title="GDRC1"
                      />
                      <Row>
                        <Col>
                          <hr />
                        </Col>
                      </Row>
                      <AboutRow
                        section={AboutSection.NFT_DELEGATION}
                        currentSection={section}
                        setSection={setNewSection}
                        title="NFT Delegation"
                      />
                      <Row>
                        <Col>
                          <hr />
                        </Col>
                      </Row>
                      <AboutRow
                        section={AboutSection.FAQ}
                        currentSection={section}
                        setSection={setNewSection}
                        title="FAQ"
                      />
                      <AboutRow
                        section={AboutSection.ENS}
                        currentSection={section}
                        setSection={setNewSection}
                        title="ENS"
                      />
                      <AboutRow
                        section={AboutSection.MINTING}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Minting"
                      />
                      <AboutRow
                        section={AboutSection.NAKAMOTO_THRESHOLD}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Nakamoto Threshold"
                      />
                      <AboutRow
                        section={AboutSection.LICENSE}
                        currentSection={section}
                        setSection={setNewSection}
                        title="License"
                      />
                      <Row>
                        <Col>
                          <hr />
                        </Col>
                      </Row>
                      <AboutRow
                        section={AboutSection.APPLY}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Apply"
                      />
                      <AboutRow
                        section={AboutSection.CONTACT_US}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Contact Us"
                      />
                      <AboutRow
                        section={AboutSection.RELEASE_NOTES}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Release Notes"
                      />
                      <AboutRow
                        section={AboutSection.DATA_DECENTR}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Data Decentralization"
                      />
                      <Row>
                        <Col>
                          <hr />
                        </Col>
                      </Row>
                      <AboutRow
                        section={AboutSection.TERMS_OF_SERVICE}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Terms of Service"
                      />
                      <AboutRow
                        section={AboutSection.PRIVACY_POLICY}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Privacy Policy"
                      />
                      <AboutRow
                        section={AboutSection.COPYRIGHT}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Copyright"
                      />
                      <AboutRow
                        section={AboutSection.COOKIE_POLICY}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Cookie Policy"
                      />
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
                      <AboutRow
                        section={AboutSection.MEMES}
                        currentSection={section}
                        setSection={setNewSection}
                        title="The Memes"
                      />
                      <AboutRow
                        section={AboutSection.SUBSCRIPTIONS}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Subscriptions"
                      />
                      <AboutRow
                        section={AboutSection.SUBSCRIPTIONS_UPCOMING}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Upcoming Drops"
                      />
                      <AboutRow
                        section={AboutSection.MEMES_CALENDAR}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Memes Calendar"
                      />
                      <AboutRow
                        section={AboutSection.MEME_LAB}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Meme Lab"
                      />
                      <AboutRow
                        section={AboutSection.GRADIENTS}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Gradient"
                      />
                      <Row>
                        <Col>
                          <hr />
                        </Col>
                      </Row>
                      <AboutRow
                        section={AboutSection.GDRC1}
                        currentSection={section}
                        setSection={setNewSection}
                        title="GDRC1"
                      />
                      <Row>
                        <Col>
                          <hr />
                        </Col>
                      </Row>
                      <AboutRow
                        section={AboutSection.NFT_DELEGATION}
                        currentSection={section}
                        setSection={setNewSection}
                        title="NFT Delegation"
                      />
                      <Row>
                        <Col>
                          <hr />
                        </Col>
                      </Row>
                      <AboutRow
                        section={AboutSection.FAQ}
                        currentSection={section}
                        setSection={setNewSection}
                        title="FAQ"
                      />
                      <AboutRow
                        section={AboutSection.ENS}
                        currentSection={section}
                        setSection={setNewSection}
                        title="ENS"
                      />
                      <AboutRow
                        section={AboutSection.MINTING}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Minting"
                      />
                      <AboutRow
                        section={AboutSection.NAKAMOTO_THRESHOLD}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Nakamoto Threshold"
                      />
                      <AboutRow
                        section={AboutSection.LICENSE}
                        currentSection={section}
                        setSection={setNewSection}
                        title="License"
                      />
                      <Row>
                        <Col>
                          <hr />
                        </Col>
                      </Row>
                      <AboutRow
                        section={AboutSection.APPLY}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Apply"
                      />
                      <AboutRow
                        section={AboutSection.CONTACT_US}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Contact Us"
                      />
                      <AboutRow
                        section={AboutSection.RELEASE_NOTES}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Release Notes"
                      />
                      <AboutRow
                        section={AboutSection.DATA_DECENTR}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Data Decentralization"
                      />
                      <Row>
                        <Col>
                          <hr />
                        </Col>
                      </Row>
                      <AboutRow
                        section={AboutSection.TERMS_OF_SERVICE}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Terms of Service"
                      />
                      <AboutRow
                        section={AboutSection.PRIVACY_POLICY}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Privacy Policy"
                      />
                      <AboutRow
                        section={AboutSection.COPYRIGHT}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Copyright"
                      />
                      <AboutRow
                        section={AboutSection.COOKIE_POLICY}
                        currentSection={section}
                        setSection={setNewSection}
                        title="Cookie Policy"
                      />
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

function AboutRow(
  props: Readonly<{
    section: AboutSection;
    currentSection: AboutSection | undefined;
    setSection: (section: AboutSection) => void;
    title: string;
  }>
) {
  return (
    <Row className="pt-1 pb-1">
      <Col
        onClick={() => props.setSection(props.section)}
        className={`${menuStyles.aboutMenuLeftItem} ${
          props.currentSection === props.section
            ? menuStyles.aboutMenuLeftItemActive
            : ""
        }`}>
        {props.title}
      </Col>
    </Row>
  );
}
