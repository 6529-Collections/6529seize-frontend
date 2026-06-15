"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import useCapacitor from "@/hooks/useCapacitor";
import { AboutSection } from "@/types/enums";
import Link from "next/link";
import { useCookieConsent } from "../cookies/CookieConsentContext";

// Section components
import { capitalizeEveryWord } from "@/helpers/Helpers";
import { Col, Container, Row } from "react-bootstrap";
import AboutApply from "./AboutApply";
import AboutContactUs from "./AboutContactUs";
import AboutCookiePolicy from "./AboutCookiePolicy";
import AboutCopyright from "./AboutCopyright";
import AboutDataDecentral from "./AboutDataDecentral";
import AboutFAQ from "./AboutFAQ";
import AboutGDRC1 from "./AboutGDRC1";
import AboutGradients from "./AboutGradients";
import AboutHTML from "./AboutHTML";
import AboutLicense from "./AboutLicense";
import AboutMemeLab from "./AboutMemeLab";
import AboutMemes from "./AboutMemes";
import AboutMinting from "./AboutMinting";
import AboutNakamotoThreshold from "./AboutNakamotoThreshold";
import AboutNFTDelegation from "./AboutNFTDelegation";
import AboutPrimaryAddress from "./AboutPrimaryAddress";
import AboutPrivacyPolicy from "./AboutPrivacyPolicy";
import AboutReleaseNotes from "./AboutReleaseNotes";
import AboutSubscriptions from "./AboutSubscriptions";
import AboutTech from "./tech/AboutTech";
import AboutTermsOfService from "./AboutTermsOfService";

export default function About({ section }: { readonly section: AboutSection }) {
  const sectionTitle = capitalizeEveryWord(section.replaceAll("-", " "));
  useSetTitle(`${sectionTitle} | About`);

  const renderSection = () => {
    switch (section) {
      case AboutSection.MEMES:
        return <AboutMemes />;
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
      case AboutSection.TECH:
        return <AboutTech />;
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
        return <AboutFAQ />;
      case AboutSection.ENS:
        return <AboutHTML path="ens" title="ENS" />;
      case AboutSection.MISSION:
        return null;
      default:
        return null;
    }
  };

  return (
    <Container className="pt-2">
      <Row>
        <Col>
          <div className="tw-flex tw-flex-col md:tw-flex-row">
            <div className="tw-hidden tw-w-1/5 md:tw-block">
              <AboutMenu currentSection={section} />
            </div>
            <div className="tw-w-full md:tw-w-4/5">{renderSection()}</div>
          </div>

          <div className="tw-mt-6 tw-block tw-text-center md:tw-hidden">
            <AboutMenu currentSection={section} />
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export function AboutMenu({
  currentSection,
}: {
  readonly currentSection: AboutSection | undefined;
}) {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();

  return (
    <div>
      <h3 className="tw-mb-2 tw-text-xl tw-font-semibold">About</h3>
      <MenuItem
        section={AboutSection.MEMES}
        title="The Memes"
        currentSection={currentSection}
      />
      {(!capacitor.isIos || country === "US") && (
        <MenuItem
          section={AboutSection.SUBSCRIPTIONS}
          title="Subscriptions"
          currentSection={currentSection}
        />
      )}
      <MenuItem
        section={AboutSection.MEME_LAB}
        title="Meme Lab"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.GRADIENTS}
        title="Gradient"
        currentSection={currentSection}
      />

      <hr className="tw-my-2" />

      <MenuItem
        section={AboutSection.GDRC1}
        title="GDRC1"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.NFT_DELEGATION}
        title="NFT Delegation"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.PRIMARY_ADDRESS}
        title="Primary Address"
        currentSection={currentSection}
      />

      <hr className="tw-my-2" />

      <MenuItem
        section={AboutSection.FAQ}
        title="FAQ"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.ENS}
        title="ENS"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.MINTING}
        title="Minting"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.NAKAMOTO_THRESHOLD}
        title="Nakamoto Threshold"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.LICENSE}
        title="License"
        currentSection={currentSection}
      />

      <hr className="tw-my-2" />

      <MenuItem
        section={AboutSection.APPLY}
        title="Apply"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.CONTACT_US}
        title="Contact Us"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.RELEASE_NOTES}
        title="Release Notes"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.TECH}
        title="Tech"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.DATA_DECENTR}
        title="Data Decentralization"
        currentSection={currentSection}
      />

      <hr className="tw-my-2" />

      <MenuItem
        section={AboutSection.TERMS_OF_SERVICE}
        title="Terms of Service"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.PRIVACY_POLICY}
        title="Privacy Policy"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.COPYRIGHT}
        title="Copyright"
        currentSection={currentSection}
      />
      <MenuItem
        section={AboutSection.COOKIE_POLICY}
        title="Cookie Policy"
        currentSection={currentSection}
      />
    </div>
  );
}

function MenuItem({
  title,
  section,
  currentSection,
}: {
  readonly title: string;
  readonly section: AboutSection;
  readonly currentSection?: AboutSection | undefined;
}) {
  return (
    <div className="tw-py-1">
      <Link
        href={`/about/${section}`}
        className="btn-link tw-font-medium tw-no-underline hover:tw-text-gray-400"
        style={{
          borderBottom: currentSection === section ? "1px solid" : "none",
        }}
      >
        {title}
      </Link>
    </div>
  );
}
