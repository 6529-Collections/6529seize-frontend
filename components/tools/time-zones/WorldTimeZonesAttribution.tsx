import type { ReactNode } from "react";

import type { SupportedLocale } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";

const NATURAL_EARTH_URL = "https://www.naturalearthdata.com/";
const IANA_TZ_URL = "https://www.iana.org/time-zones";

const LINK_CLASS_NAME =
  "tw-rounded-sm tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-500/50 tw-underline-offset-4 hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

function SourceLink({
  href,
  locale,
  labelKey,
}: {
  readonly href: string;
  readonly locale: SupportedLocale;
  readonly labelKey: MessageKey;
}): ReactNode {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK_CLASS_NAME}
    >
      {t(locale, labelKey)}
      <span className="tw-sr-only">
        {" "}
        {t(locale, "tools.timeZones.attribution.opensInNewTab")}
      </span>
    </a>
  );
}

// Server-rendered courtesy credits for the public-domain map data, plus the
// source of every time shown on the page.
export default function WorldTimeZonesAttribution({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section
      aria-labelledby="world-time-zones-sources-heading"
      className="tw-mt-12 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-6"
    >
      <h2
        id="world-time-zones-sources-heading"
        className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100"
      >
        {t(locale, "tools.timeZones.attribution.heading")}
      </h2>
      <div className="tw-mt-3 tw-max-w-3xl tw-space-y-2 tw-text-sm tw-leading-6 tw-text-iron-400">
        <p className="tw-m-0">
          {tRich(locale, "tools.timeZones.attribution.sources", {
            naturalEarth: (
              <SourceLink
                key="natural-earth"
                href={NATURAL_EARTH_URL}
                locale={locale}
                labelKey="tools.timeZones.attribution.naturalEarthLink"
              />
            ),
            iana: (
              <SourceLink
                key="iana"
                href={IANA_TZ_URL}
                locale={locale}
                labelKey="tools.timeZones.attribution.ianaLink"
              />
            ),
          })}
        </p>
        <p className="tw-m-0">
          {t(locale, "tools.timeZones.attribution.times")}
        </p>
      </div>
    </section>
  );
}
