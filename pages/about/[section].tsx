import styles from "../../styles/Home.module.scss";
import menuStyles from "../../components/about/About.module.scss";
import { Col, Container, Row } from "react-bootstrap";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
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
import AboutDataDecentral from "../../components/about/AboutDataDecentral";
import AboutGDRC1 from "../../components/about/AboutGDRC1";
import AboutNFTDelegation from "../../components/about/AboutNFTDelegation";
import AboutHTML from "../../components/about/AboutHTML";
import AboutSubscriptions from "../../components/about/AboutSubscriptions";
import AboutNakamotoThreshold from "../../components/about/AboutNakamotoThreshold";
import AboutCopyright from "../../components/about/AboutCopyright";
import AboutPrimaryAddress from "../../components/about/AboutPrimaryAddress";
import { useTitle } from "../../contexts/TitleContext";
import useCapacitor from "../../hooks/useCapacitor";
import { useCookieConsent } from "../../components/cookies/CookieConsentContext";

const AboutCookiePolicy = dynamic(
  () => import("../../components/about/AboutCookiePolicy"),
  { ssr: false }
);

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
  PRIMARY_ADDRESS = "primary-address",
  ENS = "ens",
  SUBSCRIPTIONS = "subscriptions",
  NAKAMOTO_THRESHOLD = "nakamoto-threshold",
  COPYRIGHT = "copyright",
}

interface Props {
  section: AboutSection;
  sectionTitle: string;
  gdrc1Text: string;
  releaseNotesText: string;
  faqText: string;
  ensText: string;
}

export default function About(props: any) {
  const router = useRouter();
  const { setTitle } = useTitle();
  const { section, sectionTitle, gdrc1Text, releaseNotesText, faqText, ensText } = props.pageProps;
  
  const [activeSection, setActiveSection] = useState<AboutSection | undefined>(section);
  
  useEffect(() => {
    setTitle(`${sectionTitle} | About`);
  }, [sectionTitle, setTitle]);
  
  const setNewSection = (newSection: AboutSection) => {
    setActiveSection(newSection);
    router.push(`/about/${newSection}`, undefined, { shallow: true });
  };
  
  const printSection = () => {
    switch (activeSection) {
      case AboutSection.MEMES:
        return <AboutMemes />;
      case AboutSection.MEMES_CALENDAR:
        return <AboutMemesCalendar />;
      case AboutSection.MEME_LAB:
        return <AboutMemeLab />;
      case AboutSection.GRADIENTS:
        return <AboutGradients />;
      case AboutSection.MINTING:
        return <AboutMinting />;
      case AboutSection.LICENSE:
        return <AboutLicense />;
      case AboutSection.APPLY:
        return <AboutApply />;
      case AboutSection.CONTACT_US:
        return <AboutContactUs />;
      case AboutSection.RELEASE_NOTES:
        return <AboutReleaseNotes html={releaseNotesText} />;
      case AboutSection.TERMS_OF_SERVICE:
        return <AboutTermsOfService />;
      case AboutSection.PRIVACY_POLICY:
        return <AboutPrivacyPolicy />;
      case AboutSection.COOKIE_POLICY:
        return <AboutCookiePolicy />;
      case AboutSection.DATA_DECENTR:
        return <AboutDataDecentral />;
      case AboutSection.GDRC1:
        return <AboutGDRC1 html={gdrc1Text} />;
      case AboutSection.NFT_DELEGATION:
        return <AboutNFTDelegation />;
      case AboutSection.SUBSCRIPTIONS:
        return <AboutSubscriptions />;
      case AboutSection.NAKAMOTO_THRESHOLD:
        return <AboutNakamotoThreshold />;
      case AboutSection.COPYRIGHT:
        return <AboutCopyright />;
      case AboutSection.PRIMARY_ADDRESS:
        return <AboutPrimaryAddress />;
      case AboutSection.FAQ:
        return <AboutHTML html={faqText} title="FAQ" />;
      case AboutSection.ENS:
        return <AboutHTML html={ensText} title="ENS" />;
      default:
        return null;
    }
  };

  return (
    <main className={styles.main}>
      <Container fluid>
        <Row>
          <Col>
            <Container className="pt-4">
              <Row>
                <Col className={menuStyles.aboutMenuLeft}>
                  <AboutMenu
                    currentSection={activeSection}
                    setSection={setNewSection}
                  />
                </Col>
                {activeSection && (
                  <Col className={menuStyles.aboutMenuRight}>
                    {printSection()}
                  </Col>
                )}
              </Row>
              <Row className="pt-4">
                <Col className={menuStyles.aboutMenuLeftFull}>
                  <AboutMenu
                    currentSection={activeSection}
                    setSection={setNewSection}
                  />
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </main>
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
        metadata: {
          title: sectionTitle,
          description: "About",
        },
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

function AboutMenu(
  props: Readonly<{
    currentSection: AboutSection | undefined;
    setSection: (section: AboutSection) => void;
  }>
) {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { currentSection, setSection } = props;

  return (
    <Container>
      <Row>
        <Col>
          <h3>About</h3>
        </Col>
      </Row>
      <AboutRow
        section={AboutSection.MEMES}
        currentSection={currentSection}
        setSection={setSection}
        title="The Memes"
      />
      {(!capacitor.isIos || country === "US") && (
        <AboutRow
          section={AboutSection.SUBSCRIPTIONS}
          currentSection={currentSection}
          setSection={setSection}
          title="Subscriptions"
        />
      )}
      <AboutRow
        section={AboutSection.MEMES_CALENDAR}
        currentSection={currentSection}
        setSection={setSection}
        title="Memes Calendar"
      />
      <AboutRow
        section={AboutSection.MEME_LAB}
        currentSection={currentSection}
        setSection={setSection}
        title="Meme Lab"
      />
      <AboutRow
        section={AboutSection.GRADIENTS}
        currentSection={currentSection}
        setSection={setSection}
        title="Gradient"
      />
      <Row>
        <Col>
          <hr />
        </Col>
      </Row>
      <AboutRow
        section={AboutSection.GDRC1}
        currentSection={currentSection}
        setSection={setSection}
        title="GDRC1"
      />
      <Row>
        <Col>
          <hr />
        </Col>
      </Row>
      <AboutRow
        section={AboutSection.NFT_DELEGATION}
        currentSection={currentSection}
        setSection={setSection}
        title="NFT Delegation"
      />
      <AboutRow
        section={AboutSection.PRIMARY_ADDRESS}
        currentSection={currentSection}
        setSection={setSection}
        title="Primary Address"
      />
      <Row>
        <Col>
          <hr />
        </Col>
      </Row>
      <AboutRow
        section={AboutSection.FAQ}
        currentSection={currentSection}
        setSection={setSection}
        title="FAQ"
      />
      <AboutRow
        section={AboutSection.ENS}
        currentSection={currentSection}
        setSection={setSection}
        title="ENS"
      />
      <AboutRow
        section={AboutSection.MINTING}
        currentSection={currentSection}
        setSection={setSection}
        title="Minting"
      />
      <AboutRow
        section={AboutSection.NAKAMOTO_THRESHOLD}
        currentSection={currentSection}
        setSection={setSection}
        title="Nakamoto Threshold"
      />
      <AboutRow
        section={AboutSection.LICENSE}
        currentSection={currentSection}
        setSection={setSection}
        title="License"
      />
      <Row>
        <Col>
          <hr />
        </Col>
      </Row>
      <AboutRow
        section={AboutSection.APPLY}
        currentSection={currentSection}
        setSection={setSection}
        title="Apply"
      />
      <AboutRow
        section={AboutSection.CONTACT_US}
        currentSection={currentSection}
        setSection={setSection}
        title="Contact Us"
      />
      <AboutRow
        section={AboutSection.RELEASE_NOTES}
        currentSection={currentSection}
        setSection={setSection}
        title="Release Notes"
      />
      <AboutRow
        section={AboutSection.DATA_DECENTR}
        currentSection={currentSection}
        setSection={setSection}
        title="Data Decentralization"
      />
      <Row>
        <Col>
          <hr />
        </Col>
      </Row>
      <AboutRow
        section={AboutSection.TERMS_OF_SERVICE}
        currentSection={currentSection}
        setSection={setSection}
        title="Terms of Service"
      />
      <AboutRow
        section={AboutSection.PRIVACY_POLICY}
        currentSection={currentSection}
        setSection={setSection}
        title="Privacy Policy"
      />
      <AboutRow
        section={AboutSection.COPYRIGHT}
        currentSection={currentSection}
        setSection={setSection}
        title="Copyright"
      />
      <AboutRow
        section={AboutSection.COOKIE_POLICY}
        currentSection={currentSection}
        setSection={setSection}
        title="Cookie Policy"
      />
    </Container>
  );
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
