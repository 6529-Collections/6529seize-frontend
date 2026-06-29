"use client";

import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import { useSetTitle } from "@/contexts/TitleContext";
import useCapacitor from "@/hooks/useCapacitor";
import { AboutSection } from "@/types/enums";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

// Section components
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
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
import AboutSubscriptions from "./AboutSubscriptions";
import AboutTech from "./tech/AboutTech";
import AboutTermsOfService from "./AboutTermsOfService";

type AboutContentsNavItem = {
  readonly section: AboutSection;
  readonly labelKey: MessageKey;
};

const ABOUT_CONTENTS_NAV_ITEMS: readonly AboutContentsNavItem[] = [
  { section: AboutSection.MEMES, labelKey: "about.contents.pages.theMemes" },
  {
    section: AboutSection.SUBSCRIPTIONS,
    labelKey: "about.contents.pages.subscriptions",
  },
  { section: AboutSection.MEME_LAB, labelKey: "about.contents.pages.memeLab" },
  {
    section: AboutSection.GRADIENTS,
    labelKey: "about.contents.pages.gradient",
  },
  { section: AboutSection.GDRC1, labelKey: "about.contents.pages.gdrc" },
  {
    section: AboutSection.NFT_DELEGATION,
    labelKey: "about.contents.pages.nftDelegation",
  },
  {
    section: AboutSection.PRIMARY_ADDRESS,
    labelKey: "about.contents.pages.primaryAddress",
  },
  { section: AboutSection.FAQ, labelKey: "about.contents.pages.faq" },
  { section: AboutSection.ENS, labelKey: "about.contents.pages.ens" },
  { section: AboutSection.MINTING, labelKey: "about.contents.pages.minting" },
  {
    section: AboutSection.NAKAMOTO_THRESHOLD,
    labelKey: "about.contents.pages.nakamotoThreshold",
  },
  { section: AboutSection.LICENSE, labelKey: "about.contents.pages.license" },
  { section: AboutSection.APPLY, labelKey: "about.contents.pages.apply" },
  {
    section: AboutSection.CONTACT_US,
    labelKey: "about.contents.pages.contactUs",
  },
  { section: AboutSection.TECH, labelKey: "about.contents.pages.tech" },
  {
    section: AboutSection.DATA_DECENTR,
    labelKey: "about.contents.pages.dataDecentralization",
  },
  {
    section: AboutSection.TERMS_OF_SERVICE,
    labelKey: "about.contents.pages.termsOfService",
  },
  {
    section: AboutSection.PRIVACY_POLICY,
    labelKey: "about.contents.pages.privacyPolicy",
  },
  {
    section: AboutSection.COOKIE_POLICY,
    labelKey: "about.contents.pages.cookiePolicy",
  },
  {
    section: AboutSection.COPYRIGHT,
    labelKey: "about.contents.pages.copyright",
  },
] as const;

const ABOUT_SECTION_LABEL_KEYS = new Map<AboutSection, MessageKey>([
  ...ABOUT_CONTENTS_NAV_ITEMS.map(
    (item) => [item.section, item.labelKey] as const
  ),
  [AboutSection.MISSION, "about.contents.pages.mission"],
]);

const ABOUT_SECTION_DOCUMENT_TITLE_KEYS = new Map<AboutSection, MessageKey>([
  [AboutSection.GRADIENTS, "about.contents.documentTitles.gradient"],
]);

function getAboutSectionLabel(
  section: AboutSection | undefined,
  locale: SupportedLocale
): string {
  if (section === undefined) {
    return t(locale, "about.contents.aboutFallback");
  }

  const labelKey = ABOUT_SECTION_LABEL_KEYS.get(section);

  if (labelKey !== undefined) {
    return t(locale, labelKey);
  }

  return t(locale, "about.contents.aboutFallback");
}

function getAboutSectionDocumentTitle(
  section: AboutSection | undefined,
  locale: SupportedLocale
): string {
  if (section === undefined) {
    return getAboutSectionLabel(section, locale);
  }

  const titleKey = ABOUT_SECTION_DOCUMENT_TITLE_KEYS.get(section);

  if (titleKey !== undefined) {
    return t(locale, titleKey);
  }

  return getAboutSectionLabel(section, locale);
}

export default function About({ section }: { readonly section: AboutSection }) {
  const locale = DEFAULT_LOCALE;
  const sectionTitle = getAboutSectionDocumentTitle(section, locale);
  useSetTitle(
    t(locale, "about.contents.documentTitle", { section: sectionTitle })
  );

  return (
    <Container className="pt-2">
      <Row>
        <Col>
          <AboutContentsDropdown currentSection={section} />
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

export function AboutContentsDropdown({
  currentSection,
}: {
  readonly currentSection: AboutSection | undefined;
}) {
  const locale = DEFAULT_LOCALE;
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const currentLabel = getAboutSectionLabel(currentSection, locale);
  const hideSubscriptions = shouldHideSubscriptions({
    capacitorIsIos: capacitor.isIos,
    country,
  });
  const navItems = ABOUT_CONTENTS_NAV_ITEMS.filter(
    (item) => item.section !== AboutSection.SUBSCRIPTIONS || !hideSubscriptions
  );
  const items: CompactMenuItem[] = navItems.map((item) => {
    const label = t(locale, item.labelKey);
    const isCurrent = currentSection === item.section;

    return {
      id: item.section,
      label,
      href: `/about/${item.section}`,
      icon: isCurrent ? (
        <CheckIcon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
      ) : (
        <span className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
      ),
      active: isCurrent,
      ariaLabel: isCurrent
        ? t(locale, "about.contents.currentItemAriaLabel", {
            page: label,
          })
        : t(locale, "about.contents.itemAriaLabel", {
            page: label,
          }),
    };
  });

  return (
    <div className="tw-sticky tw-top-16 tw-z-30 tw-mb-4 tw-flex tw-justify-end tw-bg-black/85 tw-py-2 tw-backdrop-blur-sm md:tw-top-4">
      <CompactMenu
        aria-label={t(locale, "about.contents.triggerAriaLabel", {
          page: currentLabel,
        })}
        unstyledTrigger
        triggerClassName="tw-inline-flex tw-max-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/95 tw-px-3 tw-py-2 tw-text-left tw-shadow-sm tw-transition tw-duration-200 tw-ease-out hover:tw-border-primary-400/60 hover:tw-bg-iron-900 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
        trigger={
          <AboutContentsDropdownTrigger
            currentLabel={currentLabel}
            locale={locale}
          />
        }
        header={t(locale, "about.contents.label")}
        headerClassName="tw-px-3 tw-pb-2 tw-pt-1 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-500"
        items={items}
        activeItemId={currentSection}
        menuWidthClassName="tw-w-72 sm:tw-w-80"
        menuClassName="tw-max-h-[min(28rem,calc(100vh-7rem))] tw-overflow-y-auto tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/95 tw-p-2 tw-shadow-2xl tw-backdrop-blur"
        itemClassName="tw-px-3 tw-py-2.5"
        activeItemClassName="tw-bg-primary-500/10 tw-text-primary-200 tw-ring-1 tw-ring-primary-400/20"
        inactiveItemClassName="tw-text-iron-200 hover:tw-bg-iron-900 hover:tw-text-iron-50"
        focusItemClassName="tw-bg-iron-900 tw-text-iron-50"
      />
    </div>
  );
}

function AboutContentsDropdownTrigger({
  currentLabel,
  locale,
}: {
  readonly currentLabel: string;
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <span className="tw-hidden tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400 sm:tw-inline">
        {t(locale, "about.contents.label")}
      </span>
      <span
        className="tw-hidden tw-h-4 tw-w-px tw-bg-white/10 sm:tw-inline-block"
        aria-hidden="true"
      />
      <span className="tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-50">
        {currentLabel}
      </span>
      <ChevronDownIcon
        className="tw-size-4 tw-flex-shrink-0 tw-text-iron-400"
        aria-hidden="true"
      />
    </>
  );
}
