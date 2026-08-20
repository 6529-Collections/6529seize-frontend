"use client";

import Image from "next/image";
import Link from "next/link";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";

import {
  ABOUT_PAGE_TITLE_CLASS_NAME,
  ABOUT_EDITORIAL_SECTION_HEADING_CLASS_NAME,
  ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME,
  ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS,
  ABOUT_SECTION_DIVIDER_CLASS_NAME,
} from "./AboutLayout";

type GradientMessageKey = Extract<MessageKey, `about.gradient.${string}`>;

const m = (
  locale: SupportedLocale,
  key: GradientMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

const BODY_CLASS =
  "tw-m-0 tw-text-pretty tw-text-base tw-leading-6 tw-text-iron-300 sm:tw-text-lg sm:tw-leading-7";

export default function AboutGradients() {
  const locale = useBrowserLocale();

  return (
    <article
      className={`tw-w-full tw-overflow-hidden tw-bg-[#0D0D0F] tw-pb-12 tw-text-iron-100 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <GradientHeader locale={locale} />
      <GradientOverview locale={locale} />
      <GradientDesign locale={locale} />
      <GradientPurpose locale={locale} />
    </article>
  );
}

function GradientHeader({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <header
      className={`tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid ${ABOUT_SECTION_DIVIDER_CLASS_NAME}`}
    >
      <div
        className={`${ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME} tw-pb-10 tw-pt-4 sm:tw-pb-12 sm:tw-pt-8`}
      >
        <h1 className={ABOUT_PAGE_TITLE_CLASS_NAME}>
          {m(locale, "about.gradient.hero.title")}
        </h1>

        <div className="tw-mt-6 tw-text-center sm:tw-mt-8">
          <Image
            alt={m(locale, "about.gradient.preview.alt")}
            height="0"
            loading="eager"
            priority
            src="/gradients-preview.png"
            style={{
              height: "auto",
              width: "auto",
              maxHeight: "400px",
              maxWidth: "100%",
            }}
            unoptimized
            width="0"
          />
        </div>
      </div>
    </header>
  );
}

function GradientOverview({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div
      className={`${ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME} tw-max-w-3xl tw-py-8 sm:tw-py-12`}
    >
      <p className={BODY_CLASS}>{m(locale, "about.gradient.overview.intro")}</p>
      <p className={`${BODY_CLASS} tw-mt-6`}>
        {m(locale, "about.gradient.museum.permanent")}
      </p>
      <p className={`${BODY_CLASS} tw-mt-5 sm:tw-mt-6`}>
        {m(locale, "about.gradient.museum.held")}
      </p>
    </div>
  );
}

function GradientDesign({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="gradient-design-heading"
      className={`${ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME} tw-grid tw-gap-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-py-8 sm:tw-gap-8 sm:tw-py-12 lg:tw-grid-cols-[minmax(14rem,0.72fr)_minmax(0,1.28fr)] lg:tw-gap-16 ${ABOUT_SECTION_DIVIDER_CLASS_NAME}`}
    >
      <header className="lg:tw-sticky lg:tw-top-24 lg:tw-self-start">
        <h2
          className={ABOUT_EDITORIAL_SECTION_HEADING_CLASS_NAME}
          id="gradient-design-heading"
        >
          {m(locale, "about.gradient.design.title")}
        </h2>
      </header>

      <div className="tw-max-w-3xl tw-space-y-5 sm:tw-space-y-6">
        <p className={BODY_CLASS}>
          {m(locale, "about.gradient.design.system")}
        </p>
        <p className={BODY_CLASS}>
          {tRich(locale, "about.gradient.design.artist", {
            artistLink: (
              <Link
                key="artist-link"
                className="tw-rounded-sm tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-500/50 tw-underline-offset-4 hover:tw-text-primary-400 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                href="https://x.com/6529er"
                rel="noopener noreferrer"
                target="_blank"
              >
                @6529er
              </Link>
            ),
          })}
        </p>
        <p className={BODY_CLASS}>
          {m(locale, "about.gradient.design.onChain")}
        </p>
        <p className={BODY_CLASS}>
          {m(locale, "about.gradient.design.specialToken")}
        </p>
      </div>
    </section>
  );
}

function GradientPurpose({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="gradient-purpose-heading"
      className={`${ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME} tw-grid tw-gap-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-py-8 sm:tw-gap-8 sm:tw-py-12 lg:tw-grid-cols-[minmax(14rem,0.72fr)_minmax(0,1.28fr)] lg:tw-gap-16 ${ABOUT_SECTION_DIVIDER_CLASS_NAME}`}
    >
      <header className="lg:tw-sticky lg:tw-top-24 lg:tw-self-start">
        <h2
          className={ABOUT_EDITORIAL_SECTION_HEADING_CLASS_NAME}
          id="gradient-purpose-heading"
        >
          {m(locale, "about.gradient.purpose.title")}
        </h2>
      </header>
      <div className="tw-max-w-3xl tw-space-y-5 sm:tw-space-y-6">
        <p className={BODY_CLASS}>
          {m(locale, "about.gradient.purpose.answer")}
        </p>
        <p className={BODY_CLASS}>
          {m(locale, "about.gradient.purpose.community")}
        </p>
      </div>
    </section>
  );
}
