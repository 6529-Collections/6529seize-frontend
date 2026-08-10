"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

export const MUSEUM_NAVIGATION_ITEMS: ReadonlyArray<{
  readonly section: MuseumNavigationSection;
  readonly labelKey: MessageKey;
  readonly href: string;
  readonly activePrefixes: readonly string[];
}> = [
  {
    section: "collection",
    labelKey: "museum.network.nav.collection",
    href: "/museum/network/collection",
    activePrefixes: ["/museum/network/collection"],
  },
  {
    section: "artists",
    labelKey: "museum.network.nav.artists",
    href: "/museum/network/artists",
    activePrefixes: ["/museum/network/artists"],
  },
  {
    section: "acquisitions",
    labelKey: "museum.network.nav.acquisitions",
    href: "/museum/network/acquisitions",
    activePrefixes: [
      "/museum/network/acquisitions",
      "/museum/network/acquisition-programs",
      "/museum/network/programs",
      "/museum/network/gifts",
      "/museum/network/accessions",
    ],
  },
  {
    section: "research",
    labelKey: "museum.network.nav.research",
    href: "/museum/network/research",
    activePrefixes: [
      "/museum/network/research",
      "/museum/network/stories",
      "/museum/network/methodology",
    ],
  },
  {
    section: "about",
    labelKey: "museum.network.nav.about",
    href: "/museum/network/about",
    activePrefixes: [
      "/museum/network/about",
      "/museum/network/governance",
      "/museum/network/rights",
    ],
  },
];

function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

type MuseumNavigationSection =
  | "collection"
  | "artists"
  | "acquisitions"
  | "research"
  | "about";

export function museumNavigationActiveSection(
  pathname: string
): MuseumNavigationSection | null {
  return (
    MUSEUM_NAVIGATION_ITEMS.find(({ activePrefixes }) =>
      activePrefixes.some((prefix) => pathMatchesPrefix(pathname, prefix))
    )?.section ?? null
  );
}

export function MuseumNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label={t(DEFAULT_LOCALE, "museum.network.accessibility.sections")}
      className="tw-min-w-0"
    >
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-x-5 tw-gap-y-1 tw-p-0">
        {MUSEUM_NAVIGATION_ITEMS.map(({ section, labelKey, href }) => {
          const isActive = museumNavigationActiveSection(pathname) === section;

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
