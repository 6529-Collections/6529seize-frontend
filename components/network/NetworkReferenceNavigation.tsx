import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { NETWORK_REFERENCE_SECTION_HEADING_CLASSES } from "./networkPageLayoutClasses";

interface ReferenceDestination {
  readonly href: string;
  readonly labelKey: MessageKey;
}

const REFERENCE_DESTINATIONS: readonly ReferenceDestination[] = [
  {
    href: "/network/tdh",
    labelKey: "network.references.navigation.tdh",
  },
  {
    href: "/network/tdh/historic-boosts",
    labelKey: "network.references.navigation.historicBoosts",
  },
  {
    href: "/network/definitions",
    labelKey: "network.references.navigation.definitions",
  },
  {
    href: "/network/health/network-tdh",
    labelKey: "network.references.navigation.networkTdhStats",
  },
  {
    href: "/network/levels",
    labelKey: "network.references.navigation.levels",
  },
] as const;

export default function NetworkReferenceNavigation({
  currentHref,
  locale,
}: {
  readonly currentHref: string;
  readonly locale: SupportedLocale;
}) {
  const destinations = REFERENCE_DESTINATIONS.filter(
    (destination) => destination.href !== currentHref
  );

  return (
    <nav
      aria-label={t(locale, "network.references.navigation.ariaLabel")}
      className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-6 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-py-8 sm:tw-py-12 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:tw-gap-12"
    >
      <div className="lg:tw-sticky lg:tw-top-28">
        <h2 className={NETWORK_REFERENCE_SECTION_HEADING_CLASSES}>
          {t(locale, "network.references.navigation.title")}
        </h2>
      </div>

      <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-p-0 sm:tw-grid-cols-2 sm:tw-gap-x-6">
        {destinations.map((destination) => (
          <li key={destination.href}>
            <Link
              className="tw-group tw-flex tw-min-h-16 tw-items-center tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-py-4 tw-text-iron-200 tw-no-underline tw-transition-colors tw-duration-200 hover:tw-border-white/25 hover:tw-text-iron-50 hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-[#0D0D0F] motion-reduce:tw-transition-none"
              href={destination.href}
            >
              <span className="tw-text-sm tw-font-medium tw-leading-5">
                {t(locale, destination.labelKey)}
              </span>
              <ArrowRightIcon
                aria-hidden="true"
                className="tw-size-4 tw-shrink-0 tw-text-iron-600 tw-transition group-hover:tw-translate-x-0.5 group-hover:tw-text-primary-300 motion-reduce:tw-transition-none"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
