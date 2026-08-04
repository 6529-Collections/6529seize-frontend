"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./About.module.css";
import { ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS } from "./AboutLayout";
import { fetchAboutSectionFile } from "./about.helpers";

type GdrcMessageKey = Extract<MessageKey, `about.gdrc.${string}`>;

const GDRC_ALLOWED_TAG_NAMES = new Set([
  "BR",
  "DIV",
  "EM",
  "H2",
  "H3",
  "H4",
  "H5",
  "LI",
  "OL",
  "P",
  "STRONG",
  "UL",
]);

const m = (locale: SupportedLocale, key: GdrcMessageKey) => t(locale, key);
const GDRC_SOURCE_TITLE = m(DEFAULT_LOCALE, "about.gdrc.title");
const GDRC_SOURCE_VERSION = m(DEFAULT_LOCALE, "about.gdrc.version");

function isDuplicateGdrcHeader(
  element: Element,
  title: string,
  version: string
): boolean {
  const children = Array.from(element.children);
  const containsOnlyExpectedElements = Array.from(element.childNodes).every(
    (node) => node.nodeType === Node.ELEMENT_NODE || !node.textContent?.trim()
  );

  return (
    element.tagName === "DIV" &&
    children.length === 2 &&
    children[0]?.tagName === "H2" &&
    children[0].textContent.trim() === title &&
    children[1]?.tagName === "DIV" &&
    children[1].textContent.trim() === version &&
    containsOnlyExpectedElements
  );
}

function sanitizeGdrcHtml(value: string): string {
  const document = new DOMParser().parseFromString(value, "text/html");

  for (const element of Array.from(document.body.querySelectorAll("*"))) {
    if (!GDRC_ALLOWED_TAG_NAMES.has(element.tagName)) {
      element.remove();
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      element.removeAttribute(attribute.name);
    }
  }

  const firstElement = document.body.firstElementChild;
  if (
    firstElement &&
    isDuplicateGdrcHeader(
      firstElement,
      GDRC_SOURCE_TITLE,
      GDRC_SOURCE_VERSION
    )
  ) {
    firstElement.remove();
  }

  return document.body.innerHTML;
}

export default function AboutGDRC1() {
  const locale = useBrowserLocale();
  const [html, setHtml] = useState<string>("");
  const title = m(locale, "about.gdrc.title");
  const version = m(locale, "about.gdrc.version");

  useEffect(() => {
    void fetchAboutSectionFile("gdrc1")
      .then((content) => {
        setHtml(sanitizeGdrcHtml(content));
      })
      .catch(() => {
        setHtml("");
      });
  }, []);

  return (
    <article
      className={`tw-w-full tw-pb-12 tw-text-iron-100 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-1 tw-pb-10 tw-pt-4 sm:tw-px-0 sm:tw-pb-12 sm:tw-pt-8 lg:tw-px-2">
        <h1 className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
          {title}
        </h1>
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-500">
          {version}
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
