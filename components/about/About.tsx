"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import { AboutSection } from "@/types/enums";

// Section components
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "./AboutLayout";
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
import AboutSubscriptions from "./AboutSubscriptions";
import AboutTech from "./tech/AboutTech";
import AboutTermsOfService from "./AboutTermsOfService";
import { AboutContentsDropdown } from "./AboutContentsDropdown";
import { getAboutSectionDocumentTitle } from "./about.routes";

export default function About({ section }: { readonly section: AboutSection }) {
  const locale = DEFAULT_LOCALE;
  const sectionTitle = getAboutSectionDocumentTitle(section, locale);
  const isSubscriptions = section === AboutSection.SUBSCRIPTIONS;
  useSetTitle(
    t(locale, "about.contents.documentTitle", { section: sectionTitle })
  );

  if (section === AboutSection.MEMES) {
    return (
      <div className="tw-min-h-[calc(100vh-100px)] tw-bg-[#0D0D0F]">
        <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-pt-4 sm:tw-px-6 lg:tw-px-8">
          <AboutContentsDropdown currentSection={section} />
        </div>
        <AboutMemes />
      </div>
    );
  }

  return (
    <Container
      fluid={
        section === AboutSection.TECH || section === AboutSection.SUBSCRIPTIONS
      }
      className="tw-pt-2"
    >
      <Row>
        <Col>
          <AboutContentsDropdown
            className={
              isSubscriptions
                ? "-tw-mx-6 -tw-mt-6 tw-w-[calc(100%+3rem)] tw-px-6"
                : undefined
            }
            currentSection={section}
            withDivider={isSubscriptions}
          />
          <div className="tw-w-full">
            <AboutSectionContent section={section} />
          </div>
        </Col>
      </Row>
    </Container>
  );
}

function AboutSectionContent({ section }: { readonly section: AboutSection }) {
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
}
