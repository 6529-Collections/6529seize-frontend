"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./About.module.css";
import { ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS } from "./AboutLayout";
import { fetchAboutSectionFile } from "./about.helpers";

type GdrcMessageKey = Extract<MessageKey, `about.gdrc.${string}`>;

const m = (locale: SupportedLocale, key: GdrcMessageKey) => t(locale, key);

export default function AboutGDRC1() {
  const locale = useBrowserLocale();
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    fetchAboutSectionFile("gdrc1").then(setHtml);
  }, []);

  return (
    <article
      className={`tw-w-full tw-pb-12 tw-text-iron-100 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-1 tw-pb-10 tw-pt-4 sm:tw-px-0 sm:tw-pb-12 sm:tw-pt-8 lg:tw-px-2">
        <h1 className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
          {m(locale, "about.gdrc.title")}
        </h1>
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-500">
          {m(locale, "about.gdrc.version")}
        </p>
      </header>

      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-1 tw-py-10 sm:tw-px-0 sm:tw-py-12 lg:tw-px-2">
        <div className="tw-max-w-4xl tw-space-y-4 tw-text-base tw-leading-7 tw-text-iron-300">
          <p className="tw-m-0">
            {tRich(locale, "about.gdrc.support", {
              charterLink: (
                <Link
                  key="charter-link"
                  className="hover:tw-text-primary-200 tw-rounded-sm tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-500/50 tw-underline-offset-4 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  href="https://digitalrightscharter.org/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {m(locale, "about.gdrc.linkLabel")}
                </Link>
              ),
            })}
          </p>
          <p className="tw-m-0">{m(locale, "about.gdrc.fullTextIntro")}</p>
        </div>
      </div>

      <section
        className={clsx(
          styles["gdrcContent"],
          "tw-px-1 tw-py-10 sm:tw-px-0 sm:tw-py-12 lg:tw-px-2"
        )}
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      />
    </article>
  );
}
