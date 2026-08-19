"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import { AboutSection } from "@/types/enums";

// Section components
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  AboutCol as Col,
  AboutContainer as Container,
  ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS,
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
import {
  getAboutSectionDocumentTitle,
  isAboutFeatureSection,
  isAboutLegalSection,
} from "./about.routes";

const ABOUT_LEGAL_CONTENT_CLASS = [
  `tw-mx-auto tw-w-full tw-max-w-3xl tw-break-words tw-px-1 tw-pb-12 tw-pt-4 tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300 sm:tw-px-3 sm:tw-pt-8 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`,
  "[&_a]:tw-break-words [&_a]:tw-font-medium [&_a]:tw-text-primary-300 [&_a]:tw-underline [&_a]:tw-decoration-primary-400/50 [&_a]:tw-underline-offset-4 hover:[&_a]:tw-text-primary-200 focus-visible:[&_a]:tw-rounded-sm focus-visible:[&_a]:tw-outline-none focus-visible:[&_a]:tw-ring-2 focus-visible:[&_a]:tw-ring-primary-400",
  "[&_b]:tw-font-semibold [&_b]:tw-text-iron-100 [&_strong]:tw-font-semibold [&_strong]:tw-text-iron-100",
  "[&_h1]:tw-m-0 [&_h1]:tw-text-[22px] [&_h1]:tw-font-semibold [&_h1]:tw-leading-tight [&_h1]:tw-tracking-tight [&_h1]:tw-text-iron-50 sm:[&_h1]:tw-text-[26px]",
  "[&_h2]:tw-mb-3 [&_h2]:tw-mt-8 [&_h2]:tw-text-xl [&_h2]:tw-font-semibold [&_h2]:tw-leading-tight [&_h2]:tw-tracking-tight [&_h2]:tw-text-iron-50 sm:[&_h2]:tw-mt-10 sm:[&_h2]:tw-text-2xl",
  "[&_h3]:tw-mb-3 [&_h3]:tw-mt-8 [&_h3]:tw-text-lg [&_h3]:tw-font-semibold [&_h3]:tw-leading-7 [&_h3]:tw-text-iron-100",
  "[&_h4]:tw-mb-3 [&_h4]:tw-mt-6 [&_h4]:tw-text-base [&_h4]:tw-font-semibold [&_h4]:tw-leading-7 [&_h4]:tw-text-iron-100",
  "[&_li]:tw-mb-3 [&_li]:tw-text-base [&_li]:tw-leading-7 [&_li]:tw-text-iron-300 [&_li::marker]:tw-text-iron-600",
  "[&_ol]:tw-my-5 [&_ol]:tw-pl-6 [&_p]:tw-mb-5 [&_p]:tw-text-base [&_p]:tw-leading-7 [&_p]:tw-text-iron-300 [&_ul]:tw-my-5 [&_ul]:tw-pl-6",
].join(" ");

export default function About({ section }: { readonly section: AboutSection }) {
  const locale = DEFAULT_LOCALE;
  const sectionTitle = getAboutSectionDocumentTitle(section, locale);
  const usesFeatureLayout = isAboutFeatureSection(section);
  const usesLegalLayout = isAboutLegalSection(section);
  const usesFullWidthLayout = usesFeatureLayout || usesLegalLayout;
  useSetTitle(
    t(locale, "about.contents.documentTitle", { section: sectionTitle })
  );

  if (section === AboutSection.MEMES) {
    return (
      <div className="tw-min-h-[calc(100dvh-100px)]">
        <AboutContentsDropdown
          className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 sm:tw-px-6 lg:tw-px-8"
          currentSection={section}
          flushBottom
          withDivider
        />
        <AboutMemes />
      </div>
    );
  }

  return (
    <Container
      fluid={section === AboutSection.TECH || usesFullWidthLayout}
      className="tw-pt-2"
    >
      <Row>
        <Col>
          <AboutContentsDropdown
            className={
              usesFullWidthLayout
                ? "-tw-mx-6 -tw-mt-6 tw-w-[calc(100%+3rem)] tw-px-6"
                : undefined
            }
            currentSection={section}
            withDivider
          />
          <div
            className={
              usesLegalLayout ? ABOUT_LEGAL_CONTENT_CLASS : "tw-w-full"
            }
          >
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
