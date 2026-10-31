"use client";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import {
  Loading,
  NotFoundNote,
  Section,
} from "@/components/stream/pages/common";
import MediaViewer from "@/components/stream/ui/MediaViewer";
import WorkFacts from "@/components/stream/work/WorkFacts";
import WorkHeader from "@/components/stream/work/WorkHeader";
import {
  WorkHistory,
  WorkStatements,
} from "@/components/stream/work/WorkHistory";
import WorkSales from "@/components/stream/work/WorkSales";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { StreamWork, WorkKey } from "@/lib/stream/types";

function WorkBody({
  work,
  locale,
}: {
  readonly work: StreamWork;
  readonly locale: SupportedLocale;
}) {
  return (
    <article>
      <WorkHeader work={work} locale={locale} />
      <div className="tw-grid tw-items-start tw-gap-6 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="lg:tw-sticky lg:tw-top-24">
          <MediaViewer media={work.media} title={work.title} locale={locale} />
        </div>
        <WorkSales work={work} locale={locale} />
      </div>
      <div className="tw-mt-6">
        <Section title={t(locale, "stream.workFacts.title")}>
          <WorkFacts work={work} locale={locale} />
        </Section>
      </div>
      {work.dispute.statements.length === 0 ? null : (
        <Section title={t(locale, "stream.work.statements")}>
          <WorkStatements
            statements={work.dispute.statements}
            locale={locale}
          />
        </Section>
      )}
      <Section title={t(locale, "stream.work.history")}>
        <WorkHistory work={work} locale={locale} />
      </Section>
    </article>
  );
}

/**
 * /stream/works/[id]: every variant (a 6529 Stream 1/1, a 6529 Stream
 * Editions edition, a federated 721 or 1155, either half of a federated pair)
 * with its sale panels, facts, statements and history.
 */
export default function WorkPage({ workKey }: { readonly workKey: WorkKey }) {
  const locale = useBrowserLocale();
  const { data: work } = useStreamQuery("work", [workKey], (source) =>
    source.getWork(workKey)
  );
  if (work === undefined) {
    return <Loading />;
  }
  return work === null ? (
    <NotFoundNote locale={locale} />
  ) : (
    <WorkBody work={work} locale={locale} />
  );
}
