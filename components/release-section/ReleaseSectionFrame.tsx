import Link from "next/link";
import type { ReactNode } from "react";

import { ABOUT_PAGE_SURFACE_CLASS_NAME } from "@/components/about/AboutLayout";
import { ValidatorPageHeader } from "@/components/validator-page/ValidatorPageFrame";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

/** One entry of a release section's menu. */
export type ReleaseSectionLink<Section extends string> = {
  readonly key: Section;
  readonly href: string;
  readonly label: MessageKey;
};

/** What each page of a release section gives its frame. */
export type ReleaseSectionPageProps<Section extends string> = {
  readonly current: Section;
  readonly eyebrow: string;
  readonly title: string;
  readonly lead?: string | undefined;
  readonly children: ReactNode;
};

/**
 * The frame of a product's download pages (6529 AI under /ai, 6529 Desktop
 * under /desktop): the section's menu, the page's title, the product's
 * notice, then the page.
 */
export default function ReleaseSectionFrame<Section extends string>({
  navLabel,
  links,
  current,
  eyebrow,
  title,
  lead,
  notice,
  children,
}: ReleaseSectionPageProps<Section> & {
  readonly navLabel: MessageKey;
  readonly links: readonly ReleaseSectionLink<Section>[];
  readonly notice: ReactNode;
}) {
  return (
    <main
      className={`tailwind-scope ${ABOUT_PAGE_SURFACE_CLASS_NAME} tw-text-iron-300`}
    >
      <div className="tw-mx-auto tw-w-full tw-max-w-4xl tw-px-4 tw-pb-20 tw-pt-6 sm:tw-px-6 sm:tw-pt-10 lg:tw-px-8">
        <nav aria-label={t(LOCALE, navLabel)} className="tw-mb-8 sm:tw-mb-10">
          <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
            {links.map((link) => {
              const isCurrent = link.key === current;
              return (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`tw-inline-flex tw-min-h-9 tw-items-center tw-rounded-full tw-border tw-border-solid tw-px-3.5 tw-text-sm tw-font-medium tw-no-underline tw-transition tw-duration-150 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
                      isCurrent
                        ? "tw-border-primary-400/60 tw-bg-primary-500/10 tw-text-iron-50"
                        : "tw-border-white/10 tw-bg-transparent tw-text-iron-400 hover:tw-border-white/20 hover:tw-text-iron-100"
                    }`}
                  >
                    {t(LOCALE, link.label)}
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
        {notice}
        {children}
      </div>
    </main>
  );
}
