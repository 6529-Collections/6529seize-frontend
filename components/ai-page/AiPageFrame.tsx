import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";

import { ABOUT_PAGE_SURFACE_CLASS_NAME } from "@/components/about/AboutLayout";
import { ValidatorPageHeader } from "@/components/validator-page/ValidatorPageFrame";
import { LINK } from "@/components/validator-page/validatorStyles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";

export type AiSection = "download" | "guide" | "known-issues";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

const SECTIONS: readonly {
  readonly key: AiSection;
  readonly href: string;
  readonly label: MessageKey;
}[] = [
  { key: "download", href: "/ai", label: "ai.nav.download" },
  { key: "guide", href: "/ai/guide", label: "ai.nav.guide" },
  {
    key: "known-issues",
    href: "/ai/known-issues",
    label: "ai.nav.knownIssues",
  },
];

/**
 * The notice under the title of every page under /ai: 6529 AI is
 * untested, and this is a test release.
 */
function AiDisclaimer() {
  return (
    <section
      aria-labelledby="ai-untested"
      className="tw-mb-10 tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-amber-400/40 tw-bg-amber-400/10 tw-p-5 sm:tw-p-6"
    >
      <ExclamationTriangleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-6 tw-flex-none tw-text-amber-300"
      />
      <div className="tw-min-w-0">
        <h2
          id="ai-untested"
          className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50"
        >
          {t(LOCALE, "ai.disclaimer.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-1 tw-text-base tw-leading-7 tw-text-iron-200">
          {tRich(LOCALE, "ai.disclaimer.body", {
            knownIssues: (
              <Link key="known-issues" href="/ai/known-issues" className={LINK}>
                {t(LOCALE, "ai.disclaimer.knownIssuesLink")}
              </Link>
            ),
          })}
        </p>
      </div>
    </section>
  );
}

/**
 * The menu of the /ai pages, the page's title, the untested notice, then
 * the page.
 */
export default function AiPageFrame({
  current,
  eyebrow,
  title,
  lead,
  children,
}: {
  readonly current: AiSection;
  readonly eyebrow: string;
  readonly title: string;
  readonly lead?: string | undefined;
  readonly children: ReactNode;
}) {
  return (
    <main
      className={`tailwind-scope ${ABOUT_PAGE_SURFACE_CLASS_NAME} tw-text-iron-300`}
    >
      <div className="tw-mx-auto tw-w-full tw-max-w-4xl tw-px-4 tw-pb-20 tw-pt-6 sm:tw-px-6 sm:tw-pt-10 lg:tw-px-8">
        <nav
          aria-label={t(LOCALE, "ai.nav.label")}
          className="tw-mb-8 sm:tw-mb-10"
        >
          <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
            {SECTIONS.map((section) => {
              const isCurrent = section.key === current;
              return (
                <li key={section.key}>
                  <Link
                    href={section.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`tw-inline-flex tw-min-h-9 tw-items-center tw-rounded-full tw-border tw-border-solid tw-px-3.5 tw-text-sm tw-font-medium tw-no-underline tw-transition tw-duration-150 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
                      isCurrent
                        ? "tw-border-primary-400/60 tw-bg-primary-500/10 tw-text-iron-50"
                        : "tw-border-white/10 tw-bg-transparent tw-text-iron-400 hover:tw-border-white/20 hover:tw-text-iron-100"
                    }`}
                  >
                    {t(LOCALE, section.label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="[&>header]:tw-mb-6">
          <ValidatorPageHeader eyebrow={eyebrow} title={title}>
            {lead && (
              <p className="tw-mb-0 tw-mt-3 tw-max-w-2xl tw-text-lg tw-leading-8 tw-text-iron-300">
                {lead}
              </p>
            )}
          </ValidatorPageHeader>
        </div>
        <AiDisclaimer />
        {children}
      </div>
    </main>
  );
}
