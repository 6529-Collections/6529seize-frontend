import Link from "next/link";
import type { ReactNode } from "react";

import { ABOUT_PAGE_SURFACE_CLASS_NAME } from "@/components/about/AboutLayout";

export type ValidatorSection =
  | "download"
  | "guide"
  | "known-issues"
  | "releases";

const SECTIONS: readonly {
  readonly key: ValidatorSection;
  readonly href: string;
  readonly label: string;
}[] = [
  { key: "download", href: "/validator", label: "Download" },
  { key: "guide", href: "/validator/guide", label: "Tester guide" },
  {
    key: "known-issues",
    href: "/validator/known-issues",
    label: "Known issues",
  },
  { key: "releases", href: "/validator/releases", label: "Releases" },
];

export default function ValidatorPageFrame({
  current,
  children,
}: {
  /** The section to mark in the menu; none on the password page. */
  readonly current?: ValidatorSection | undefined;
  readonly children: ReactNode;
}) {
  return (
    <main
      className={`tailwind-scope ${ABOUT_PAGE_SURFACE_CLASS_NAME} tw-text-iron-300`}
    >
      <div className="tw-mx-auto tw-w-full tw-max-w-4xl tw-px-4 tw-pb-20 tw-pt-6 sm:tw-px-6 sm:tw-pt-10 lg:tw-px-8">
        {current && (
          <nav aria-label="Validator pages" className="tw-mb-8 sm:tw-mb-10">
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
                      {section.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
        {children}
      </div>
    </main>
  );
}

export function ValidatorPageHeader({
  eyebrow,
  title,
  children,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly children?: ReactNode;
}) {
  return (
    <header className="tw-mb-10">
      <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wide tw-text-primary-300">
        {eyebrow}
      </p>
      <h1 className="tw-m-0 tw-text-balance tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-[-0.03em] tw-text-iron-50 md:tw-text-4xl">
        {title}
      </h1>
      {children}
    </header>
  );
}
