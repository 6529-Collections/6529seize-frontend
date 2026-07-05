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

  const { currentPanel, profileHref, subscriptionsHref, timelineProgress } =
    useJoin6529Journey(locale);
  const links = { profileHref, subscriptionsHref };

  return (
    <main className="tailwind-scope tw-min-h-screen tw-overflow-x-clip tw-bg-[#030303] tw-text-white">
      <JoinHeader
        currentPanel={currentPanel}
        isReturningVisitor={
          timelineProgress.visible && timelineProgress.completed > 0
        }
        locale={locale}
      />
      <div className="tw-relative tw-z-10 tw-mx-auto tw-flex tw-w-full tw-max-w-[1180px] tw-flex-col tw-gap-6 tw-px-4 tw-pb-6 sm:tw-px-6 lg:tw-px-8 lg:tw-pb-8">
        <JourneyTimelineSection
          links={links}
          locale={locale}
          timelineProgress={timelineProgress}
        />
        <FocusSections links={links} locale={locale} />
        <FaqSection locale={locale} />
      </div>
    </main>
  );
}
