"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import { AboutSection } from "@/enums";
import useCapacitor from "@/hooks/useCapacitor";
import { useRouter } from "next/navigation";
import { useCookieConsent } from "../cookies/CookieConsentContext";

// Section components
import { capitalizeEveryWord } from "@/helpers/Helpers";
import { Col, Container, Row } from "react-bootstrap";
import AboutApply from "./AboutApply";
import AboutContactUs from "./AboutContactUs";
import AboutCookiePolicy from "./AboutCookiePolicy";
import AboutCopyright from "./AboutCopyright";
import AboutDataDecentral from "./AboutDataDecentral";
import AboutGDRC1 from "./AboutGDRC1";
import AboutGradients from "./AboutGradients";
import AboutHTML from "./AboutHTML";
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

export default function About({ section }: { readonly section: AboutSection }) {
  const router = useRouter();
  const sectionTitle = capitalizeEveryWord(section.replaceAll("-", " "));
  useSetTitle(`${sectionTitle} | About`);

  const setNewSection = (newSection: AboutSection) => {
    router.push(`/about/${newSection}`);
  };

  const renderSection = () => {
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
    <Container className="pt-2">
      <Row>
        <Col>
          <div className="tw-flex tw-flex-col md:tw-flex-row">
            <div className="tw-hidden md:tw-block tw-w-1/5">
              <AboutMenu currentSection={section} setSection={setNewSection} />
            </div>
            <div className="tw-w-full md:tw-w-4/5">{renderSection()}</div>
          </div>

          <div className="tw-block md:tw-hidden tw-mt-6 tw-text-center">
            <AboutMenu currentSection={section} setSection={setNewSection} />
          </div>
        </Col>
      </Row>
    </Container>
  );
}

function AboutMenu({
  currentSection,
  setSection,
}: {
  readonly currentSection: AboutSection | undefined;
  readonly setSection: (section: AboutSection) => void;
}) {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();

  return (
    <div>
      <h3 className="tw-text-xl tw-font-semibold tw-mb-2">About</h3>
      <MenuItem
        section={AboutSection.MEMES}
        title="The Memes"
        setSection={setSection}
        currentSection={currentSection}
      />
      {(!capacitor.isIos || country === "US") && (
        <MenuItem
          section={AboutSection.SUBSCRIPTIONS}
          title="Subscriptions"
          setSection={setSection}
          currentSection={currentSection}
        />
      )}
      <MenuItem
        section={AboutSection.MEMES_CALENDAR}
        title="Memes Calendar"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.MEME_LAB}
        title="Meme Lab"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.GRADIENTS}
        title="Gradient"
        setSection={setSection}
        currentSection={currentSection}
      />

      <hr className="tw-my-2" />

      <MenuItem
        section={AboutSection.GDRC1}
        title="GDRC1"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.NFT_DELEGATION}
        title="NFT Delegation"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.PRIMARY_ADDRESS}
        title="Primary Address"
        setSection={setSection}
        currentSection={currentSection}
      />

      <hr className="tw-my-2" />

      <MenuItem
        section={AboutSection.FAQ}
        title="FAQ"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.ENS}
        title="ENS"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.MINTING}
        title="Minting"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.NAKAMOTO_THRESHOLD}
        title="Nakamoto Threshold"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.LICENSE}
        title="License"
        setSection={setSection}
        currentSection={currentSection}
      />

      <hr className="tw-my-2" />

      <MenuItem
        section={AboutSection.APPLY}
        title="Apply"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.CONTACT_US}
        title="Contact Us"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.RELEASE_NOTES}
        title="Release Notes"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.DATA_DECENTR}
        title="Data Decentralization"
        setSection={setSection}
        currentSection={currentSection}
      />

      <hr className="tw-my-2" />

      <MenuItem
        section={AboutSection.TERMS_OF_SERVICE}
        title="Terms of Service"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.PRIVACY_POLICY}
        title="Privacy Policy"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.COPYRIGHT}
        title="Copyright"
        setSection={setSection}
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.COOKIE_POLICY}
        title="Cookie Policy"
        setSection={setSection}
        currentSection={currentSection}
      />
    </div>
  );
}

function MenuItem({
  title,
  section,
  setSection,
  currentSection,
}: {
  readonly title: string;
  readonly section: AboutSection;
  readonly setSection: (section: AboutSection) => void;
  readonly currentSection?: AboutSection;
}) {
  return (
    <div className="tw-py-1">
      <button
        onClick={() => setSection(section)}
        className="btn-link tw-no-underline tw-font-medium hover:tw-text-gray-400"
        style={{
          borderBottom: currentSection === section ? "1px solid" : "none",
        }}>
        {title}
      </button>
    </div>
  );
}
