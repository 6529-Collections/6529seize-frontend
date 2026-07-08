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
    <main className="tailwind-scope tw-min-h-screen tw-overflow-x-clip tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-800 tw-bg-[#030303] tw-text-iron-100">
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
