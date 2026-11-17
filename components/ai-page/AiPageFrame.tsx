import { BeakerIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";

import { ABOUT_PAGE_SURFACE_CLASS_NAME } from "@/components/about/AboutLayout";
import { LINK } from "@/components/validator-page/validatorStyles";
import AiNavScroller from "./AiNavScroller";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";

type AiSection =
  | "download"
  | "guide"
  | "known-issues"
  | "releases"
  | "models"
  | "use";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

const SECTIONS: readonly {
  readonly key: AiSection;
  readonly href: string;
  readonly label: MessageKey;
  /** A shorter label for a phone. */
  readonly short?: MessageKey;
}[] = [
  { key: "download", href: "/ai", label: "ai.nav.download" },
  { key: "guide", href: "/ai/guide", label: "ai.nav.guide" },
  {
    key: "known-issues",
    href: "/ai/known-issues",
    label: "ai.nav.knownIssues",
    short: "ai.nav.knownIssuesShort",
  },
  { key: "releases", href: "/ai/releases", label: "ai.nav.releases" },
  { key: "models", href: "/ai/models", label: "ai.nav.models" },
  { key: "use", href: "/ai/use", label: "ai.nav.use" },
];

/** Headings and body text shared by the /ai pages. */
export const AI_H2 =
  "tw-m-0 tw-text-xl tw-font-semibold tw-leading-7 tw-tracking-tight tw-text-iron-50";
export const AI_H3 =
  "tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50";
export const AI_BODY = "tw-text-[15px] tw-leading-6 tw-text-iron-300";
export const AI_MUTED = "tw-text-sm tw-leading-6 tw-text-iron-400";
/** A secondary button: 44 px tall on a phone, 36 px from 640 px up. */
export const AI_BUTTON =
  "tw-inline-flex tw-min-h-11 tw-flex-none tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-bg-iron-900 tw-px-3.5 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition hover:tw-border-primary-400/60 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 sm:tw-min-h-9";
export const AI_CARD =
  "tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950/60";

/**
 * The notice on every page under /ai: this is an untested test release.
 * It stays calm: one line, under the title.
 */
function AiUntestedNotice({ current }: { readonly current: AiSection }) {
  return (
    <div
      role="note"
      className="tw-flex tw-items-start tw-gap-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/25 tw-bg-amber-400/[0.06] tw-px-4 tw-py-3"
    >
      <BeakerIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-flex-none tw-text-amber-300"
      />
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-200">
        <strong className="tw-font-semibold tw-text-iron-50">
          {t(LOCALE, "ai.notice.title")}
        </strong>{" "}
        {tRich(LOCALE, "ai.notice.body", {
          knownIssues:
            current === "known-issues" ? (
              ""
            ) : (
              <Link key="known-issues" href="/ai/known-issues" className={LINK}>
                {t(LOCALE, "ai.notice.link")}
              </Link>
            ),
        })}
      </p>
    </div>
  );
}

/**
 * The menu of the /ai pages (the release standard's order: Download,
 * Guide, Known issues, Releases, then the extras), the page's title and
 * lead, the release list's urgent or unsafe notice, the untested notice,
 * then the page.
 */
export default function AiPageFrame({
  current,
  eyebrow,
  version,
  notice = true,
  alert,
  wide = false,
  title,
  lead,
  children,
}: {
  readonly current: AiSection;
  readonly eyebrow: string;
  /** The release, after the eyebrow, as written: 0.1.0-rc.1. */
  readonly version?: string | undefined;
  /**
   * False where the page itself says the release is untested, as the known
   * issues do in their lead.
   */
  readonly notice?: boolean | undefined;
  /** What the release list says the visitor must know first. */
  readonly alert?: ReactNode;
  /** A wider page, for the models and the walk-through with its contents. */
  readonly wide?: boolean | undefined;
  readonly title: string;
  readonly lead?: string | undefined;
  readonly children: ReactNode;
}) {
  return (
    <main
      className={`tailwind-scope ${ABOUT_PAGE_SURFACE_CLASS_NAME} tw-text-iron-300`}
    >
      <div
        className={`tw-mx-auto tw-w-full ${wide ? "tw-max-w-6xl" : "tw-max-w-4xl"} tw-px-4 tw-pb-24 tw-pt-6 sm:tw-px-6 sm:tw-pt-10 lg:tw-px-8`}
      >
        <AiNavScroller label={t(LOCALE, "ai.nav.label")}>
          <ul className="tw-m-0 tw-flex tw-w-max tw-list-none tw-gap-1.5 tw-p-0 sm:tw-w-auto sm:tw-flex-wrap">
            {SECTIONS.map((section) => {
              const isCurrent = section.key === current;
              return (
                <li key={section.key}>
                  <Link
                    href={section.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`tw-inline-flex tw-min-h-9 tw-items-center tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-px-3 tw-text-sm tw-font-medium tw-no-underline tw-transition tw-duration-150 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
                      isCurrent
                        ? "tw-border-primary-400/60 tw-bg-primary-500/10 tw-text-iron-50"
                        : "tw-border-white/10 tw-bg-transparent tw-text-iron-400 hover:tw-border-white/20 hover:tw-text-iron-100"
                    }`}
                  >
                    {section.short ? (
                      <>
                        <span className="sm:tw-hidden">
                          {t(LOCALE, section.short)}
                        </span>
                        <span className="max-sm:tw-hidden">
                          {t(LOCALE, section.label)}
                        </span>
                      </>
                    ) : (
                      t(LOCALE, section.label)
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </AiNavScroller>
        <header className="tw-mb-6">
          <p className="tw-mb-3 tw-mt-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wider tw-text-primary-300">
            {eyebrow}
            {version && (
              <>
                <span aria-hidden="true" className="tw-mx-1.5 tw-text-iron-600">
                  ·
                </span>
                <span className="tw-font-mono tw-normal-case tw-tracking-normal tw-text-iron-300">
                  {version}
                </span>
              </>
            )}
          </p>
          <h1 className="tw-m-0 tw-text-balance tw-text-4xl tw-font-semibold tw-leading-tight tw-tracking-[-0.03em] tw-text-iron-50 md:tw-text-5xl">
            {title}
          </h1>
          {lead && (
            <p className="tw-mb-0 tw-mt-4 tw-max-w-2xl tw-text-pretty tw-text-lg tw-leading-8 tw-text-iron-300">
              {lead}
            </p>
          )}
        </header>
        {alert}
        {notice && <AiUntestedNotice current={current} />}
        {children}
      </div>
    </main>
  );
}
