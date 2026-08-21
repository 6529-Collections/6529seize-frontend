"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";

import { FaqSection } from "./FaqSection";
import { FocusSections } from "./FocusSections";
import { JoinHeader } from "./JoinHeader";
import { JourneyTimelineSection } from "./JourneyTimelineSection";
import { m } from "./page.utils";
import { useJoin6529Journey } from "./useJoin6529Journey";

export default function Join6529PageClient() {
  const locale = useBrowserLocale();
  useSetTitle(m(locale, "join6529.metadata.title"));

  const {
    pageState,
    primaryAction,
    profileHref,
    secondaryAction,
    subscriptionsHref,
    timelineProgress,
  } = useJoin6529Journey(locale);
  const links = { profileHref, subscriptionsHref };

  return (
    <main className="tailwind-scope tw-relative tw-isolate tw-min-h-screen tw-overflow-x-clip tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-800 tw-bg-[#030303] tw-text-iron-100">
      <JoinPageAmbient />
      <JoinHeader
        locale={locale}
        pageState={pageState}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />
      <div className="tw-relative tw-z-10 tw-flex tw-w-full tw-flex-col">
        <JourneyTimelineSection
          links={links}
          locale={locale}
          pageState={pageState}
          timelineProgress={timelineProgress}
        />
        <FocusSections links={links} locale={locale} />
        <FaqSection links={links} locale={locale} />
      </div>
    </main>
  );
}

function JoinPageAmbient() {
  return (
    <div
      aria-hidden="true"
      className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-0 tw-overflow-hidden"
    >
      <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-h-[55rem] tw-bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.10)_0%,rgba(30,64,175,0.04)_42%,transparent_72%)]" />
      <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-[48rem] tw-bg-[radial-gradient(ellipse_at_bottom_right,rgba(30,64,175,0.08)_0%,rgba(49,46,129,0.03)_40%,transparent_72%)]" />
    </div>
  );
}
