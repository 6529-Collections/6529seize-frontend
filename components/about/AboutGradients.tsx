"use client";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCalendarDays,
  faCode,
  faFilm,
  faLandmark,
  faLayerGroup,
  faPalette,
  faPeopleGroup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import {
  AboutFeatureCallout,
  AboutFeatureCard,
  AboutFeaturePageHeader,
  AboutTimelineStep,
} from "./AboutFeaturePage";
import {
  ABOUT_FEATURE_PANEL_CLASS,
  ABOUT_FEATURE_SECTION_HEADING_CLASS,
} from "./aboutFeaturePageStyles";
import { ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS } from "./AboutLayout";

type GradientMessageKey = Extract<MessageKey, `about.gradient.${string}`>;

interface GradientFeature {
  readonly bodyKey: GradientMessageKey;
  readonly icon: IconDefinition;
  readonly iconClassName: string;
  readonly iconWrapperClassName: string;
  readonly titleKey: GradientMessageKey;
}

const GRADIENT_FEATURES: readonly GradientFeature[] = [
  {
    bodyKey: "about.gradient.overview.pieces.body",
    icon: faLayerGroup,
    iconClassName: "tw-text-[#00f0ff]",
    iconWrapperClassName: "tw-bg-[#00f0ff]/10",
    titleKey: "about.gradient.overview.pieces.title",
  },
  {
    bodyKey: "about.gradient.overview.auction.body",
    icon: faCalendarDays,
    iconClassName: "tw-text-[#8f5cff]",
    iconWrapperClassName: "tw-bg-[#7000ff]/20",
    titleKey: "about.gradient.overview.auction.title",
  },
  {
    bodyKey: "about.gradient.overview.onChain.body",
    icon: faCode,
    iconClassName: "tw-text-iron-200",
    iconWrapperClassName: "tw-bg-iron-900",
    titleKey: "about.gradient.overview.onChain.title",
  },
] as const;

const m = (
  locale: SupportedLocale,
  key: GradientMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

export default function AboutGradients() {
  const locale = useBrowserLocale();

  return (
    <article
      className={`tw-w-full tw-pb-12 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <AboutFeaturePageHeader
        description={m(locale, "about.gradient.hero.description")}
        eyebrow={m(locale, "about.gradient.hero.eyebrow")}
        primaryAction={{
          href: "/6529-gradient",
          label: m(locale, "about.gradient.hero.primaryAction"),
        }}
        secondaryAction={{
          external: true,
          href: "https://x.com/6529er",
          label: m(locale, "about.gradient.hero.secondaryAction"),
        }}
        title={m(locale, "about.gradient.hero.title")}
      />

      <GradientOverview locale={locale} />
      <GradientDesign locale={locale} />
      <GradientMuseum locale={locale} />
      <GradientPurpose locale={locale} />
    </article>
  );
}

function GradientOverview({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="gradient-overview-heading"
      className="tw-px-1 tw-pb-8 sm:tw-px-2 sm:tw-pb-12"
    >
      <div className="tw-max-w-3xl">
        <h2
          className={ABOUT_FEATURE_SECTION_HEADING_CLASS}
          id="gradient-overview-heading"
        >
          {m(locale, "about.gradient.overview.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-font-light tw-leading-7 tw-text-iron-400">
          {m(locale, "about.gradient.overview.intro")}
        </p>
      </div>

      <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 md:tw-grid-cols-3 md:tw-gap-6">
        {GRADIENT_FEATURES.map((feature) => (
          <AboutFeatureCard
            icon={feature.icon}
            iconClassName={feature.iconClassName}
            iconWrapperClassName={feature.iconWrapperClassName}
            key={feature.titleKey}
            title={m(locale, feature.titleKey)}
          >
            {m(locale, feature.bodyKey)}
          </AboutFeatureCard>
        ))}
      </ul>

      <figure
        className={`${ABOUT_FEATURE_PANEL_CLASS} tw-mx-0 tw-mb-0 tw-mt-4 tw-overflow-hidden tw-p-3 sm:tw-mt-6 sm:tw-p-5`}
      >
        <div className="tw-overflow-hidden tw-rounded-lg tw-bg-iron-900">
          <Image
            alt={m(locale, "about.gradient.preview.alt")}
            className="tw-h-auto tw-w-full"
            height={600}
            loading="eager"
            sizes="(max-width: 767px) 100vw, 1200px"
            src="/gradients-preview.png"
            width={2100}
          />
        </div>
        <figcaption className="tw-flex tw-flex-col tw-gap-1 tw-px-1 tw-pb-1 tw-pt-4 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between sm:tw-gap-6">
          <span className="tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-200">
            {m(locale, "about.gradient.preview.title")}
          </span>
          <span className="tw-max-w-2xl tw-text-sm tw-leading-6 tw-text-iron-500 sm:tw-text-right">
            {m(locale, "about.gradient.preview.description")}
          </span>
        </figcaption>
      </figure>
    </section>
  );
}

function GradientDesign({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="gradient-design-heading"
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-px-1 tw-py-8 sm:tw-px-2 sm:tw-py-12"
    >
      <h2
        className={ABOUT_FEATURE_SECTION_HEADING_CLASS}
        id="gradient-design-heading"
      >
        {m(locale, "about.gradient.design.title")}
      </h2>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2 lg:tw-gap-6">
        <div className={`${ABOUT_FEATURE_PANEL_CLASS} tw-p-4 sm:tw-p-6`}>
          <div className="tw-flex tw-items-center tw-gap-3">
            <span className="tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#00f0ff]/10 tw-text-[#00f0ff]">
              <FontAwesomeIcon aria-hidden="true" icon={faPalette} />
            </span>
            <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
              {m(locale, "about.gradient.design.system.title")}
            </h3>
          </div>
          <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-400">
            {m(locale, "about.gradient.design.system.body")}
          </p>
        </div>

        <div className={`${ABOUT_FEATURE_PANEL_CLASS} tw-p-4 sm:tw-p-6`}>
          <div className="tw-flex tw-items-center tw-gap-3">
            <span className="tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#7000ff]/20 tw-text-[#8f5cff]">
              <FontAwesomeIcon aria-hidden="true" icon={faPeopleGroup} />
            </span>
            <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
              {m(locale, "about.gradient.design.artist.title")}
            </h3>
          </div>
          <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-400">
            {m(locale, "about.gradient.design.artist.body")}
          </p>
        </div>
      </div>

      <div className="tw-relative tw-mt-8 tw-max-w-5xl tw-space-y-8 sm:tw-mt-10 sm:tw-space-y-10">
        <div
          aria-hidden="true"
          className="tw-absolute tw-bottom-4 tw-left-4 tw-top-4 tw-w-px tw-bg-iron-800 sm:tw-left-5"
        />
        <AboutTimelineStep
          markerClassName="tw-border-iron-500 tw-text-iron-100"
          number="1"
          title={m(locale, "about.gradient.design.sequence.endpoints.title")}
        >
          <p className="tw-m-0">
            {m(locale, "about.gradient.design.sequence.endpoints.body")}
          </p>
        </AboutTimelineStep>
        <AboutTimelineStep
          markerClassName="tw-border-[#00f0ff]/40 tw-text-[#00f0ff]"
          number="2"
          title={m(locale, "about.gradient.design.sequence.steps.title")}
        >
          <p className="tw-m-0">
            {m(locale, "about.gradient.design.sequence.steps.body")}
          </p>
        </AboutTimelineStep>
        <AboutTimelineStep
          markerClassName="tw-border-[#7000ff]/40 tw-text-[#8f5cff]"
          number="3"
          title={m(locale, "about.gradient.design.sequence.fifty.title")}
        >
          <p className="tw-m-0">
            {m(locale, "about.gradient.design.sequence.fifty.body")}
          </p>
          <Link
            className="tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-px-1 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            href="/6529-gradient/50"
          >
            {m(locale, "about.gradient.design.sequence.fifty.link")}
          </Link>
        </AboutTimelineStep>
      </div>
    </section>
  );
}

function GradientMuseum({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="gradient-museum-heading"
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-px-1 tw-py-8 sm:tw-px-2 sm:tw-py-12"
    >
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-orange-500/10 tw-text-orange-400 sm:tw-size-12">
          <FontAwesomeIcon aria-hidden="true" icon={faLandmark} />
        </span>
        <h2
          className={ABOUT_FEATURE_SECTION_HEADING_CLASS}
          id="gradient-museum-heading"
        >
          {m(locale, "about.gradient.museum.title")}
        </h2>
      </div>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2 lg:tw-gap-6">
        <div
          className={`${ABOUT_FEATURE_PANEL_CLASS} tw-border-t-2 tw-border-t-orange-400/50 tw-p-4 sm:tw-p-6`}
        >
          <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
            {m(locale, "about.gradient.museum.permanent.title")}
          </h3>
          <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-400">
            {m(locale, "about.gradient.museum.permanent.body")}
          </p>
        </div>
        <div className={`${ABOUT_FEATURE_PANEL_CLASS} tw-p-4 sm:tw-p-6`}>
          <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
            {m(locale, "about.gradient.museum.held.title")}
          </h3>
          <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-400">
            {m(locale, "about.gradient.museum.held.body")}
          </p>
        </div>
      </div>
    </section>
  );
}

function GradientPurpose({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="gradient-purpose-heading"
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-px-1 tw-py-8 sm:tw-px-2 sm:tw-py-12"
    >
      <h2
        className={ABOUT_FEATURE_SECTION_HEADING_CLASS}
        id="gradient-purpose-heading"
      >
        {m(locale, "about.gradient.purpose.title")}
      </h2>
      <AboutFeatureCallout
        className="tw-mt-4 tw-border-t-2 tw-border-t-[#00f0ff]/50"
        icon={faFilm}
        iconClassName="tw-text-[#00f0ff]"
        iconWrapperClassName="tw-bg-[#00f0ff]/10"
        title={m(locale, "about.gradient.purpose.answer")}
      >
        <p className="tw-m-0">
          {m(locale, "about.gradient.purpose.community")}
        </p>
      </AboutFeatureCallout>
    </section>
  );
}
