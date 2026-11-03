"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { WhatIsStatus, type WhatIsStatusKind } from "./WhatIsStatus";
import { MAIN_STAGE_HREF, WhatIsLink, WhatIsSection } from "./WhatIsParts";

// Direction C: the institutions of a network state, each with its stage.
const PARTS: ReadonlyArray<{
  readonly id: "museum" | "decide" | "private" | "check" | "venue" | "ai";
  readonly status: WhatIsStatusKind;
  readonly link: {
    readonly href: string;
    readonly trackingAction: string;
    readonly label:
      | "home.whatIs.c.museum.action"
      | "home.whatIs.c.decide.action"
      | "home.whatIs.c.check.action";
  } | null;
}> = [
  {
    id: "museum",
    status: "running",
    link: {
      href: "/museum/network",
      trackingAction: "Visit the Network Museum",
      label: "home.whatIs.c.museum.action",
    },
  },
  {
    id: "decide",
    status: "running",
    link: {
      href: MAIN_STAGE_HREF,
      trackingAction: "Open Main Stage",
      label: "home.whatIs.c.decide.action",
    },
  },
  { id: "private", status: "running", link: null },
  {
    id: "check",
    status: "testing",
    link: {
      href: "/network/tdh",
      trackingAction: "How TDH works",
      label: "home.whatIs.c.check.action",
    },
  },
  { id: "venue", status: "planned", link: null },
  { id: "ai", status: "design", link: null },
];

export default function HomeWhatIsNetworkState() {
  const locale = useBrowserLocale();

  return (
    <WhatIsSection
      title={t(locale, "home.whatIs.title")}
      lead={t(locale, "home.whatIs.c.lead")}
    >
      <ul className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.08] tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.08] tw-p-0">
        {PARTS.map(({ id, status, link }) => (
          <li
            key={id}
            className="tw-grid tw-grid-cols-1 tw-gap-2 tw-py-5 md:tw-grid-cols-[132px_minmax(0,220px)_minmax(0,1fr)_170px] md:tw-items-baseline md:tw-gap-6 md:tw-py-6 lg:tw-grid-cols-[150px_minmax(0,250px)_minmax(0,1fr)_190px]"
          >
            <WhatIsStatus kind={status} locale={locale} />
            <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-[1.4] tw-tracking-[-0.02em] tw-text-iron-100 md:tw-text-[17px]">
              {t(locale, `home.whatIs.c.${id}.title`)}
            </h3>
            <p className="tw-m-0 tw-text-sm tw-leading-[1.65] tw-text-iron-400 md:tw-text-[15px]">
              {t(locale, `home.whatIs.c.${id}.body`)}
            </p>
            <div className="md:tw-justify-self-end">
              {link && (
                <WhatIsLink
                  href={link.href}
                  trackingAction={link.trackingAction}
                >
                  {t(locale, link.label)}
                </WhatIsLink>
              )}
            </div>
          </li>
        ))}
      </ul>
    </WhatIsSection>
  );
}
