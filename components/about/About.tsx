"use client";

import { Container, Row, Col } from "react-bootstrap";
import styles from "./About.module.scss";
import { AboutSection } from "@/enums";
import AboutHTML from "./AboutHTML";
import useCapacitor from "@/hooks/useCapacitor";
import { useRouter } from "next/navigation";
import { useCookieConsent } from "../cookies/CookieConsentContext";
import AboutApply from "./AboutApply";
import AboutContactUs from "./AboutContactUs";
import AboutCookiePolicy from "./AboutCookiePolicy";
import AboutCopyright from "./AboutCopyright";
import AboutDataDecentral from "./AboutDataDecentral";
import AboutGDRC1 from "./AboutGDRC1";
import AboutGradients from "./AboutGradients";
import AboutLicense from "./AboutLicense";
import AboutMemeLab from "./AboutMemeLab";
import AboutMemes from "./AboutMemes";
import AboutMemesCalendar from "./AboutMemesCalendar";
import AboutMinting from "./AboutMinting";
import AboutNakamotoThreshold from "./AboutNakamotoThreshold";
import AboutNFTDelegation from "./AboutNFTDelegation";
import AboutPrimaryAddress from "./AboutPrimaryAddress";
import AboutPrivacyPolicy from "./AboutPrivacyPolicy";
import AboutReleaseNotes from "./AboutReleaseNotes";
import AboutSubscriptions from "./AboutSubscriptions";
import AboutTermsOfService from "./AboutTermsOfService";
import { useSetTitle } from "@/contexts/TitleContext";
import { capitalizeEveryWord } from "@/helpers/Helpers";

export default function About({ section }: { section: AboutSection }) {
  const router = useRouter();

  const sectionTitle = capitalizeEveryWord(section.replaceAll("-", " "));
  useSetTitle(`${sectionTitle} | About`);

  const setNewSection = (newSection: AboutSection) => {
    router.push(`/about/${newSection}`);
  };

  const printSection = () => {
    switch (section) {
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
        return <AboutReleaseNotes />;
      case AboutSection.TERMS_OF_SERVICE:
        return <AboutTermsOfService />;
      case AboutSection.PRIVACY_POLICY:
        return <AboutPrivacyPolicy />;
      case AboutSection.COOKIE_POLICY:
        return <AboutCookiePolicy />;
      case AboutSection.DATA_DECENTR:
        return <AboutDataDecentral />;
      case AboutSection.GDRC1:
        return <AboutGDRC1 />;
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
        return <AboutHTML path="faq" title="FAQ" />;
      case AboutSection.ENS:
        return <AboutHTML path="ens" title="ENS" />;
      default:
        return null;
    }
  };

  return (
    <Container className="pt-4">
      <Row>
        <Col className={styles.aboutMenuLeft}>
          <AboutMenu currentSection={section} setSection={setNewSection} />
        </Col>
        <Col className={styles.aboutMenuRight}>{printSection()}</Col>
      </Row>
      <Row className="pt-4">
        <Col className={styles.aboutMenuLeftFull}>
          <AboutMenu currentSection={section} setSection={setNewSection} />
        </Col>
      </Row>
    </Container>
  );
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
        className={`${styles.aboutMenuLeftItem} ${
          props.currentSection === props.section
            ? styles.aboutMenuLeftItemActive
            : ""
        }`}>
        {props.title}
      </Col>
    </Row>
  );
}
