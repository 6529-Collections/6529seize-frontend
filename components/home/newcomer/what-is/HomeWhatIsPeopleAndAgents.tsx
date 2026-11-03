"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { WhatIsStatus, type WhatIsStatusKind } from "./WhatIsStatus";
import { WhatIsLink, WhatIsSection } from "./WhatIsParts";

// Direction B: people and AI agents on the same terms, with standing that
// only time builds, and AI models served by members.
const CARDS: ReadonlyArray<{
  readonly id: "time" | "agents" | "ai";
  readonly status: WhatIsStatusKind;
  readonly link: {
    readonly href: string;
    readonly trackingAction: string;
    readonly label: "home.whatIs.b.time.action" | "home.whatIs.waves.action";
  } | null;
}> = [
  {
    id: "time",
    status: "running",
    link: {
      href: "/network/tdh",
      trackingAction: "How TDH works",
      label: "home.whatIs.b.time.action",
    },
  },
  {
    id: "agents",
    status: "design",
    link: {
      href: "/waves",
      trackingAction: "Browse Waves",
      label: "home.whatIs.waves.action",
    },
  },
  { id: "ai", status: "design", link: null },
];

export default function HomeWhatIsPeopleAndAgents() {
  const locale = useBrowserLocale();

  return (
    <WhatIsSection
      title={t(locale, "home.whatIs.title")}
      lead={t(locale, "home.whatIs.b.lead")}
    >
      <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 md:tw-grid-cols-3 md:tw-gap-5">
        {CARDS.map(({ id, status, link }) => (
          <li
            key={id}
            className="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.09] tw-bg-white/[0.025] tw-p-5 md:tw-p-6 lg:tw-p-7"
          >
            <WhatIsStatus kind={status} locale={locale} />
            <h3 className="tw-mb-0 tw-mt-5 tw-text-lg tw-font-semibold tw-leading-[1.35] tw-tracking-[-0.025em] tw-text-iron-100 md:tw-text-[19px]">
              {t(locale, `home.whatIs.b.${id}.title`)}
            </h3>
            <p className="tw-mb-0 tw-mt-2.5 tw-text-sm tw-leading-[1.65] tw-text-iron-400 md:tw-mt-3 md:tw-text-[15px]">
              {t(locale, `home.whatIs.b.${id}.body`)}
            </p>
            {link && (
              <div className="tw-mt-auto tw-pt-4 md:tw-pt-6">
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
      </ul>
    </WhatIsSection>
  );
}
