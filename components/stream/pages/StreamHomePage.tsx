"use client";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import {
  Empty,
  Loading,
  PageHeader,
  PlaceholderNote,
  Section,
  WorkGrid,
} from "@/components/stream/pages/common";
import { STREAM_CARD, STREAM_HELP } from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";

/** /stream: live and upcoming, ending soon, editions live, recent results. */
export default function StreamHomePage() {
  const locale = useBrowserLocale();
  const { data: feed } = useStreamQuery("home-feed", [], (source) =>
    source.homeFeed()
  );
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.home.title")}
        intro={t(locale, "stream.home.intro")}
      >
        <PlaceholderNote locale={locale} />
      </PageHeader>
      {feed === undefined ? (
        <Loading />
      ) : (
        <>
          <Section title={t(locale, "stream.home.endingSoon")}>
            <WorkGrid
              keys={feed.endingSoon}
              locale={locale}
              empty={t(locale, "stream.home.endingSoonEmpty")}
            />
          </Section>
          <Section title={t(locale, "stream.home.live")}>
            <WorkGrid
              keys={feed.live}
              locale={locale}
              empty={t(locale, "stream.home.liveEmpty")}
            />
          </Section>
          <Section title={t(locale, "stream.home.editionsLive")}>
            <WorkGrid
              keys={feed.editionsLive}
              locale={locale}
              empty={t(locale, "stream.home.editionsEmpty")}
            />
          </Section>
          <Section title={t(locale, "stream.home.upcoming")}>
            {feed.upcoming.length === 0 ? (
              <Empty text={t(locale, "stream.home.upcomingEmpty")} />
            ) : (
              <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-2">
                {feed.upcoming.map((item) => (
                  <li key={item.itemHash} className={`${STREAM_CARD} tw-p-4`}>
                    <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
                      {item.title}
                    </p>
                    <p className={`${STREAM_HELP} tw-mt-1`}>
                      {t(locale, "stream.home.upcomingReady")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title={t(locale, "stream.home.results")}>
            <WorkGrid
              keys={feed.recentResults}
              locale={locale}
              empty={t(locale, "stream.home.resultsEmpty")}
            />
          </Section>
        </>
      )}
    </div>
  );
}
