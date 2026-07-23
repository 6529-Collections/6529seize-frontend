"use client";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faFlask,
  faPalette,
  faPeopleGroup,
  faSeedling,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import {
  AboutFeatureCallout,
  AboutFeatureCard,
  AboutFeaturePageHeader,
  AboutTimelineStep,
} from "./AboutFeaturePage";
import { ABOUT_FEATURE_SECTION_HEADING_CLASS } from "./aboutFeaturePageStyles";
import { ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS } from "./AboutLayout";

type MemeLabMessageKey = Extract<MessageKey, `about.memeLab.${string}`>;

interface MemeLabFeature {
  readonly bodyKey: MemeLabMessageKey;
  readonly icon: IconDefinition;
  readonly iconClassName: string;
  readonly iconWrapperClassName: string;
  readonly titleKey: MemeLabMessageKey;
}

const MEME_LAB_FEATURES: readonly MemeLabFeature[] = [
  {
    bodyKey: "about.memeLab.overview.cc0.body",
    icon: faFlask,
    iconClassName: "tw-text-[#00f0ff]",
    iconWrapperClassName: "tw-bg-[#00f0ff]/10",
    titleKey: "about.memeLab.overview.cc0.title",
  },
  {
    bodyKey: "about.memeLab.overview.artistLed.body",
    icon: faPalette,
    iconClassName: "tw-text-[#8f5cff]",
    iconWrapperClassName: "tw-bg-[#7000ff]/20",
    titleKey: "about.memeLab.overview.artistLed.title",
  },
  {
    bodyKey: "about.memeLab.overview.community.body",
    icon: faPeopleGroup,
    iconClassName: "tw-text-orange-400",
    iconWrapperClassName: "tw-bg-orange-500/10",
    titleKey: "about.memeLab.overview.community.title",
  },
] as const;

const m = (
  locale: SupportedLocale,
  key: MemeLabMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

export default function AboutMemeLab() {
  const locale = useBrowserLocale();

  return (
    <article
      className={`tw-w-full tw-pb-12 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <AboutFeaturePageHeader
        artwork={
          <Image
            alt={m(locale, "about.memeLab.hero.logoAlt")}
            className="tw-h-auto tw-w-full tw-max-w-sm"
            height={90}
            loading="eager"
            src="/memelab.png"
            width={420}
          />
        }
        description={m(locale, "about.memeLab.hero.description")}
        eyebrow={m(locale, "about.memeLab.hero.eyebrow")}
        primaryAction={{
          href: "/meme-lab",
          label: m(locale, "about.memeLab.hero.primaryAction"),
        }}
        title={m(locale, "about.memeLab.hero.title")}
      />

      <MemeLabOverview locale={locale} />
      <MemeLabHowItWorks locale={locale} />
    </article>
  );
}

function MemeLabOverview({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="meme-lab-overview-heading"
      className="tw-px-1 tw-pb-8 sm:tw-px-2 sm:tw-pb-12"
    >
      <div className="tw-max-w-3xl">
        <h2
          className={ABOUT_FEATURE_SECTION_HEADING_CLASS}
          id="meme-lab-overview-heading"
        >
          {m(locale, "about.memeLab.overview.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-font-light tw-leading-7 tw-text-iron-400">
          {m(locale, "about.memeLab.overview.intro")}
        </p>
      </div>

      <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 md:tw-grid-cols-3 md:tw-gap-6">
        {MEME_LAB_FEATURES.map((feature) => (
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
    </section>
  );
}

function MemeLabHowItWorks({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="meme-lab-how-heading"
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-px-1 tw-py-8 sm:tw-px-2 sm:tw-py-12"
    >
      <div className="tw-max-w-3xl">
        <h2
          className={ABOUT_FEATURE_SECTION_HEADING_CLASS}
          id="meme-lab-how-heading"
        >
          {m(locale, "about.memeLab.how.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-leading-7 tw-text-iron-400">
          {m(locale, "about.memeLab.how.intro")}
        </p>
      </div>

      <div className="tw-relative tw-mt-6 tw-max-w-5xl tw-space-y-8 sm:tw-mt-8 sm:tw-space-y-10">
        <div
          aria-hidden="true"
          className="tw-absolute tw-bottom-4 tw-left-4 tw-top-4 tw-w-px tw-bg-iron-800 sm:tw-left-5"
        />
        <AboutTimelineStep
          markerClassName="tw-border-[#00f0ff]/40 tw-text-[#00f0ff]"
          number="1"
          title={m(locale, "about.memeLab.how.eligibility.title")}
        >
          <p className="tw-m-0">
            {m(locale, "about.memeLab.how.eligibility.body")}
          </p>
        </AboutTimelineStep>
        <AboutTimelineStep
          markerClassName="tw-border-[#7000ff]/40 tw-text-[#8f5cff]"
          number="2"
          title={m(locale, "about.memeLab.how.experiment.title")}
        >
          <p className="tw-m-0">
            {m(locale, "about.memeLab.how.experiment.body")}
          </p>
        </AboutTimelineStep>
        <AboutTimelineStep
          markerClassName="tw-border-orange-500/40 tw-text-orange-400"
          number="3"
          title={m(locale, "about.memeLab.how.learn.title")}
        >
          <p className="tw-m-0">{m(locale, "about.memeLab.how.learn.body")}</p>
        </AboutTimelineStep>
      </div>

      <AboutFeatureCallout
        className="tw-mt-8 tw-border-t-2 tw-border-t-[#8f5cff]/50 sm:tw-mt-10"
        icon={faSeedling}
        iconClassName="tw-text-[#8f5cff]"
        iconWrapperClassName="tw-bg-[#7000ff]/20"
        title={m(locale, "about.memeLab.outcomes.title")}
      >
        <p className="tw-m-0">{m(locale, "about.memeLab.outcomes.body")}</p>
      </AboutFeatureCallout>
    </section>
  );
}
