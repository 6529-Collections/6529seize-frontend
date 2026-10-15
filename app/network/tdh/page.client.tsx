"use client";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { VerificationSummary } from "@/lib/tdh/verification/summary.server";
import TdhPager from "./shared/TdhPager";
import TdhSubnav from "./shared/TdhSubnav";
import {
  TDHGlossary,
  TDHGoDeeper,
  TDHHoldingChanges,
} from "./TDHCalculationDetails";
import TDHCurrentRules from "./TDHCurrentRules";
import TDHHero from "./TDHHero";
import TDHInAMinute from "./TDHInAMinute";
import TDHProfile from "./TDHProfile";
import { TDHRelatedLinks, useTDHSectionHashFocus } from "./TDHPageNavigation";
import TDHSection from "./TDHSection";
import TDHVerifiedDaily from "./TDHVerifiedDaily";

const SECTION_IDS = [
  "tdh-minute",
  "tdh-verified",
  "tdh-profile",
  "tdh-1-4",
  "tdh-changes",
  "glossary",
  "tdh-deeper",
  "tdh-explore",
];

/** Anchors of sections that moved: old links still land in the right place. */
const MOVED_ANCHORS: Readonly<Record<string, string>> = {
  "tdh-exact": "/network/tdh/how-it-works",
  "tdh-how": "/network/tdh/how-it-works",
  "tdh-example": "/network/tdh/how-it-works#step-12",
  "tdh-reference": "#tdh-minute",
};

const RELATED = [
  { href: "/network/tdh/consolidation", key: "consolidation" },
  { href: "/network/health/network-tdh", key: "stats" },
  { href: "/network/levels", key: "levels" },
] as const;

export default function TDHMainPage({
  verification = null,
}: {
  readonly verification?: VerificationSummary | null;
}) {
  const locale = useBrowserLocale();
  useSetTitle(t(locale, "network.tdh.explainer.pageTitle"));

  useTDHSectionHashFocus(SECTION_IDS, MOVED_ANCHORS);

  return (
    <div className={NETWORK_REFERENCE_PAGE_CLASSES}>
      <AboutContentsDropdown
        className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
        currentHref="/network/tdh"
        desktopFlush
        withDivider
      />
      <article className="tw-mx-auto tw-max-w-6xl tw-pb-8">
        <TdhSubnav current="/network/tdh" locale={locale} />
        <TDHHero locale={locale} verification={verification} />
        <TDHInAMinute locale={locale} />
        <TDHVerifiedDaily locale={locale} summary={verification} />
        <TDHProfile locale={locale} />
        <TDHCurrentRules locale={locale} />
        <TDHHoldingChanges locale={locale} />
        <TDHGlossary locale={locale} />
        <TDHGoDeeper locale={locale} />
        <TDHSection
          id="tdh-explore"
          title={t(locale, "network.tdh.explainer.related")}
        >
          <TDHRelatedLinks
            links={RELATED.map(({ href, key }) => ({
              href,
              title: t(locale, `network.tdh.related.${key}.title`),
              description: t(locale, `network.tdh.related.${key}.description`),
            }))}
          />
        </TDHSection>
        <TdhPager current="/network/tdh" locale={locale} />
      </article>
    </div>
  );
}
