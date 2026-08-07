"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

const NAV_ITEMS: ReadonlyArray<{
  readonly labelKey: MessageKey;
  readonly href: string;
  readonly activePrefixes: readonly string[];
}> = [
  {
    labelKey: "museum.network.nav.collection",
    href: "/museum/network/collection",
    activePrefixes: [
      "/museum/network/collection",
      "/museum/network/projects",
      "/museum/network/gifts",
      "/museum/network/accessions",
    ],
  },
  {
    labelKey: "museum.network.nav.artists",
    href: "/museum/network/artists",
    activePrefixes: ["/museum/network/artists"],
  },
  {
    labelKey: "museum.network.nav.programsExhibitions",
    href: "/museum/network/programs",
    activePrefixes: ["/museum/network/programs"],
  },
  {
    labelKey: "museum.network.nav.stories",
    href: "/museum/network/stories",
    activePrefixes: [
      "/museum/network/stories",
      "/museum/network/methodology",
      "/museum/network/governance",
    ],
  },
  {
    labelKey: "museum.network.nav.about",
    href: "/museum/network/about",
    activePrefixes: ["/museum/network/about", "/museum/network/rights"],
  },
];

function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function MuseumNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label={t(DEFAULT_LOCALE, "museum.network.accessibility.sections")}
      className="tw-min-w-0"
    >
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-x-5 tw-gap-y-1 tw-p-0">
        {NAV_ITEMS.map(({ labelKey, href, activePrefixes }) => {
          const isActive = activePrefixes.some((prefix) =>
            pathMatchesPrefix(pathname, prefix)
          );

          return (
            <li key={href}>
              <Link
                href={href}
                prefetch={false}
                aria-current={isActive ? "page" : undefined}
                className={`tw-inline-flex tw-min-h-11 tw-items-center tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-text-sm tw-font-medium tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
                  isActive
                    ? "tw-border-primary-400 tw-text-primary-300"
                    : "tw-border-transparent tw-text-iron-200 hover:tw-text-white"
                }`}
              >
                {t(DEFAULT_LOCALE, labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
