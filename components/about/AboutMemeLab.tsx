"use client";

import Image from "next/image";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import { ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS } from "./AboutLayout";

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
      <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06]">
        <div className="tw-px-1 tw-pb-10 tw-pt-4 sm:tw-px-0 sm:tw-pb-12 sm:tw-pt-8 lg:tw-px-2">
          <h1 className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
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

      <div className="tw-max-w-3xl tw-px-1 tw-py-8 sm:tw-px-0 sm:tw-py-12 lg:tw-px-2">
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
