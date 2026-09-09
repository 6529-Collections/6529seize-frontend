"use client";

import Image from "next/image";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import {
  ABOUT_PAGE_TITLE_CLASS_NAME,
  ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME,
  ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS,
  ABOUT_SECTION_DIVIDER_CLASS_NAME,
} from "./AboutLayout";

type MemeLabMessageKey = Extract<MessageKey, `about.memeLab.${string}`>;

const m = (
  locale: SupportedLocale,
  key: MemeLabMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

export default function AboutMemeLab() {
  const locale = useBrowserLocale();

  return (
    <article
      className={`tw-w-full tw-overflow-hidden tw-bg-[#0D0D0F] tw-pb-12 tw-text-iron-100 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <header
        className={`tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid ${ABOUT_SECTION_DIVIDER_CLASS_NAME}`}
      >
        <div
          className={`${ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME} tw-pb-10 tw-pt-4 sm:tw-pb-12 sm:tw-pt-8`}
        >
          <h1 className={ABOUT_PAGE_TITLE_CLASS_NAME}>
            {m(locale, "about.memeLab.hero.title")}
          </h1>

          <Image
            alt={m(locale, "about.memeLab.hero.logoAlt")}
            className="tw-mt-6 tw-h-auto tw-w-[250px] tw-max-w-full sm:tw-mt-8"
            height={372}
            loading="eager"
            src="/memelab.png"
            width={1734}
          />
        </div>
      </header>

      <div
        className={`${ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME} tw-max-w-3xl tw-py-8 sm:tw-py-12`}
      >
        <p className="tw-m-0 tw-text-pretty tw-text-base tw-leading-6 tw-text-iron-300 sm:tw-text-lg sm:tw-leading-7">
          {m(locale, "about.memeLab.body.intro")}
        </p>
        <p className="tw-m-0 tw-mt-6 tw-text-pretty tw-text-base tw-leading-6 tw-text-iron-300 sm:tw-text-lg sm:tw-leading-7">
          {m(locale, "about.memeLab.body.experiment")}
        </p>
        <p className="tw-m-0 tw-mt-5 tw-text-pretty tw-text-base tw-leading-6 tw-text-iron-300 sm:tw-mt-6 sm:tw-text-lg sm:tw-leading-7">
          {m(locale, "about.memeLab.body.learning")}
        </p>
        <p className="tw-m-0 tw-mt-5 tw-text-pretty tw-text-base tw-leading-6 tw-text-iron-300 sm:tw-mt-6 sm:tw-text-lg sm:tw-leading-7">
          {m(locale, "about.memeLab.body.outcomes")}
        </p>
      </div>
    </article>
  );
}
