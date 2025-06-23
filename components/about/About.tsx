"use client";

import { AboutSection } from "@/enums";
import { useRouter } from "next/navigation";
import { useSetTitle } from "@/contexts/TitleContext";
import { capitalizeEveryWord } from "@/helpers/Helpers";
import { useCookieConsent } from "../cookies/CookieConsentContext";
import useCapacitor from "@/hooks/useCapacitor";

// Section components
import AboutHTML from "./AboutHTML";
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
    <div className="tw-px-4 tw-pt-6 tw-max-w-screen-xl tw-mx-auto">
      <div className="tw-flex tw-flex-col md:tw-flex-row">
        <div className="tw-hidden md:tw-block tw-w-1/5">
          <AboutMenu currentSection={section} setSection={setNewSection} />
        </div>
        <div className="tw-w-full md:tw-w-4/5">{renderSection()}</div>
      </div>

      <div className="tw-block md:tw-hidden tw-mt-6 tw-text-center">
        <AboutMenu currentSection={section} setSection={setNewSection} />
      </div>
    </div>
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

  const MenuItem = ({
    title,
    section,
  }: {
    title: string;
    section: AboutSection;
  }) => (
    <div
      onClick={() => setSection(section)}
      className={`tw-cursor-pointer tw-py-1 tw-font-medium hover:tw-text-gray-400 ${
        currentSection === section ? "tw-underline" : ""
      }`}>
      {title}
    </div>
  );

  return (
    <div>
      <h3 className="tw-text-xl tw-font-semibold tw-mb-2">About</h3>
      <MenuItem section={AboutSection.MEMES} title="The Memes" />
      {(!capacitor.isIos || country === "US") && (
        <MenuItem section={AboutSection.SUBSCRIPTIONS} title="Subscriptions" />
      )}
      <MenuItem section={AboutSection.MEMES_CALENDAR} title="Memes Calendar" />
      <MenuItem section={AboutSection.MEME_LAB} title="Meme Lab" />
      <MenuItem section={AboutSection.GRADIENTS} title="Gradient" />

      <hr className="tw-my-2" />

      <MenuItem section={AboutSection.GDRC1} title="GDRC1" />
      <MenuItem section={AboutSection.NFT_DELEGATION} title="NFT Delegation" />
      <MenuItem
        section={AboutSection.PRIMARY_ADDRESS}
        title="Primary Address"
      />

      <hr className="tw-my-2" />

      <MenuItem section={AboutSection.FAQ} title="FAQ" />
      <MenuItem section={AboutSection.ENS} title="ENS" />
      <MenuItem section={AboutSection.MINTING} title="Minting" />
      <MenuItem
        section={AboutSection.NAKAMOTO_THRESHOLD}
        title="Nakamoto Threshold"
      />
      <MenuItem section={AboutSection.LICENSE} title="License" />

      <hr className="tw-my-2" />

      <MenuItem section={AboutSection.APPLY} title="Apply" />
      <MenuItem section={AboutSection.CONTACT_US} title="Contact Us" />
      <MenuItem section={AboutSection.RELEASE_NOTES} title="Release Notes" />
      <MenuItem
        section={AboutSection.DATA_DECENTR}
        title="Data Decentralization"
      />

      <hr className="tw-my-2" />

      <MenuItem
        section={AboutSection.TERMS_OF_SERVICE}
        title="Terms of Service"
      />
      <MenuItem section={AboutSection.PRIVACY_POLICY} title="Privacy Policy" />
      <MenuItem section={AboutSection.COPYRIGHT} title="Copyright" />
      <MenuItem section={AboutSection.COOKIE_POLICY} title="Cookie Policy" />
    </div>
  );
}
