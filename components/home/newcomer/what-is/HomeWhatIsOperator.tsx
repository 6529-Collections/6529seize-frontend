"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { WhatIsStatus, type WhatIsStatusKind } from "./WhatIsStatus";
import { MAIN_STAGE_HREF, WhatIsLink, WhatIsSection } from "./WhatIsParts";

// Direction A: the purpose first, then a ladder from what runs to what is
// still in design.
const STEPS: ReadonlyArray<{
  readonly id: "vote" | "check" | "orgs" | "ai";
  readonly status: WhatIsStatusKind;
  readonly link: {
    readonly href: string;
    readonly trackingAction: string;
    readonly label:
      | "home.whatIs.a.vote.action"
      | "home.whatIs.a.check.action"
      | "home.whatIs.a.orgs.action";
  } | null;
  readonly track: string;
}> = [
  {
    id: "vote",
    status: "running",
    link: {
      href: MAIN_STAGE_HREF,
      trackingAction: "Open Main Stage",
      label: "home.whatIs.a.vote.action",
    },
    track: "tw-border-solid tw-border-emerald-400/70",
  },
  {
    id: "check",
    status: "testing",
    link: {
      href: "/network/tdh",
      trackingAction: "How TDH works",
      label: "home.whatIs.a.check.action",
    },
    track: "tw-border-dashed tw-border-amber-300/60",
  },
  {
    id: "orgs",
    status: "design",
    link: {
      href: "/museum/network",
      trackingAction: "Visit the Network Museum",
      label: "home.whatIs.a.orgs.action",
    },
    track: "tw-border-dotted tw-border-iron-500",
  },
  {
    id: "ai",
    status: "design",
    link: null,
    track: "tw-border-dotted tw-border-iron-700",
  },
];

export default function HomeWhatIsOperator() {
  const locale = useBrowserLocale();

  return (
    <WhatIsSection
      title={t(locale, "home.whatIs.title")}
      lead={t(locale, "home.whatIs.a.lead")}
    >
      <ol className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-10 tw-p-0 md:tw-grid-cols-2 md:tw-gap-x-8 md:tw-gap-y-12 lg:tw-grid-cols-4 lg:tw-gap-10">
        {STEPS.map(({ id, status, link, track }) => (
          <li
            key={id}
            className={`tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-border-x-0 tw-border-b-0 tw-border-t-2 tw-pt-5 ${track}`}
          >
            <WhatIsStatus kind={status} locale={locale} />
            <h3 className="tw-mb-0 tw-mt-4 tw-text-lg tw-font-semibold tw-leading-[1.35] tw-tracking-[-0.025em] tw-text-iron-100 md:tw-text-[19px]">
              {t(locale, `home.whatIs.a.${id}.title`)}
            </h3>
            <p className="tw-mb-4 tw-mt-2.5 tw-max-w-[340px] tw-text-sm tw-leading-[1.65] tw-text-iron-400 md:tw-mb-6 md:tw-mt-3 md:tw-text-[15px]">
              {t(locale, `home.whatIs.a.${id}.body`)}
            </p>
            {link && (
              <div className="tw-mt-auto">
                <WhatIsLink
                  href={link.href}
                  trackingAction={link.trackingAction}
                >
                  {t(locale, link.label)}
                </WhatIsLink>
              </div>
            )}
          </li>
        ))}
      </ol>
    </WhatIsSection>
  );
}
