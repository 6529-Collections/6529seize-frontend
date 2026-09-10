"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TDHCalculationDetails from "./TDHCalculationDetails";
import TDHCurrentRules from "./TDHCurrentRules";
import TDHExample from "./TDHExample";
import TDHProfile from "./TDHProfile";
import TDHSection, { TDH_FOCUS, TDH_PANEL, TDH_TEXT } from "./TDHSection";

const NAVIGATION = [
  { id: "tdh-reference", key: "reference" },
  { id: "tdh-example", key: "example" },
  { id: "tdh-profile", key: "profile" },
  { id: "tdh-1-4", key: "rules" },
  { id: "tdh-exact", key: "details" },
] as const;
const STEPS = ["days", "weight", "boost"] as const;
const RELATED = [
  { href: "/network/health/network-tdh", key: "stats" },
  { href: "/network/levels", key: "levels" },
] as const;

export default function TDHMainPage() {
  const locale = useBrowserLocale();
  useSetTitle(t(locale, "network.tdh.explainer.pageTitle"));

  useEffect(() => {
    const focusAnchor = () => {
      const id = globalThis.location.hash.slice(1);
      if (!NAVIGATION.some((item) => item.id === id)) return;
      globalThis.requestAnimationFrame(() => {
        globalThis.document
          .getElementById(id)
          ?.scrollIntoView({ block: "start" });
        globalThis.document
          .getElementById(`${id}-heading`)
          ?.focus({ preventScroll: true });
      });
    };
    focusAnchor();
    globalThis.addEventListener("hashchange", focusAnchor);
    return () => globalThis.removeEventListener("hashchange", focusAnchor);
  }, []);

  return (
    <div className={NETWORK_REFERENCE_PAGE_CLASSES}>
      <AboutContentsDropdown
        className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
        currentHref="/network/tdh"
        desktopFlush
        withDivider
      />
      <article className="tw-mx-auto tw-max-w-6xl tw-pb-8 tw-pt-7 sm:tw-pt-10">
        <header className="tw-pb-8 sm:tw-pb-10">
          <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-3xl">
            {t(locale, "network.tdh.explainer.title")}
          </h1>
          <p className="tw-mb-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-200">
            {t(locale, "network.tdh.explainer.intro")}
          </p>
          <p className={`${TDH_TEXT} tw-mt-3 tw-max-w-3xl`}>
            {t(locale, "network.tdh.explainer.eligible")}
          </p>
          <nav
            aria-label={t(locale, "network.tdh.explainer.nav")}
            className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-2"
          >
            {NAVIGATION.map(({ id, key }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-px-3 tw-py-2.5 tw-text-sm tw-font-medium tw-text-iron-200 tw-no-underline hover:tw-bg-iron-800 hover:tw-text-iron-50 ${TDH_FOCUS}`}
              >
                {t(locale, `network.tdh.explainer.nav.${key}`)}
              </a>
            ))}
          </nav>
        </header>
        <TDHSection
          id="tdh-reference"
          title={t(locale, "network.tdh.explainer.reference.title")}
        >
          <div className={`${TDH_PANEL} tw-space-y-4 tw-p-5`}>
            <p className={TDH_TEXT}>
              {t(locale, "network.tdh.explainer.reference.body")}
            </p>
            <p className="tw-m-0 tw-font-mono tw-text-base tw-font-medium tw-leading-7 tw-text-iron-100">
              {t(locale, "network.tdh.explainer.reference.unit")}
            </p>
            <p className={TDH_TEXT}>
              {t(locale, "network.tdh.explainer.reference.weight")}
            </p>
          </div>
        </TDHSection>
        <HowTDHWorks locale={locale} />
        <TDHExample locale={locale} />
        <TDHProfile locale={locale} />
        <TDHCurrentRules locale={locale} />
        <TDHCalculationDetails locale={locale} />
        <TDHSection
          id="tdh-explore"
          title={t(locale, "network.tdh.explainer.related")}
        >
          <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
            {RELATED.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className={`${TDH_PANEL} tw-block tw-p-5 tw-no-underline hover:tw-border-iron-600 ${TDH_FOCUS}`}
              >
                <span className="tw-block tw-text-base tw-font-medium tw-text-iron-100">
                  {t(locale, `network.tdh.related.${key}.title`)}
                </span>
                <span className="tw-mt-2 tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
                  {t(locale, `network.tdh.related.${key}.description`)}
                </span>
              </Link>
            ))}
          </div>
        </TDHSection>
      </article>
    </div>
  );
}

function HowTDHWorks({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <TDHSection id="tdh-how" title={t(locale, "network.tdh.explainer.how")}>
      <ol className="tw-m-0 tw-list-none tw-space-y-6 tw-p-0">
        {STEPS.map((step, index) => (
          <li
            key={step}
            className="tw-grid tw-grid-cols-[2rem_minmax(0,1fr)] tw-gap-3"
          >
            <span className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-sm tw-font-medium tw-text-iron-200">
              {formatInteger(locale, index + 1)}
            </span>
            <div>
              <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-7 tw-text-iron-100">
                {t(locale, `network.tdh.explainer.step.${step}.title`)}
              </h3>
              <p className={`${TDH_TEXT} tw-mt-1`}>
                {t(locale, `network.tdh.explainer.step.${step}.body`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="tw-mb-0 tw-mt-6 tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-600 tw-pl-4 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "network.tdh.explainer.snapshot")}
      </p>
    </TDHSection>
  );
}
