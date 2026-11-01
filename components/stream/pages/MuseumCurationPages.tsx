"use client";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import {
  ActionMessage,
  Empty,
  Loading,
  PageHeader,
  PlaceholderNote,
  Section,
  useStreamAction,
  WorkGrid,
} from "@/components/stream/pages/common";
import StatusBadge from "@/components/stream/ui/StatusBadge";
import {
  STREAM_BUTTON_PRIMARY,
  STREAM_CARD,
  STREAM_HELP,
} from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { CurationItem } from "@/lib/stream/types";

/** /stream/museum: unbid canonical works, held by the 6529 Network Museum. */
export function MuseumPage() {
  const locale = useBrowserLocale();
  const { data: holdings } = useStreamQuery("museum", [], (source) =>
    source.museumHoldings()
  );
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.museum.title")}
        intro={t(locale, "stream.museum.intro")}
      >
        <PlaceholderNote locale={locale} />
      </PageHeader>
      {holdings === undefined ? (
        <Loading />
      ) : (
        <WorkGrid
          keys={holdings.map((holding) => holding.work)}
          locale={locale}
          empty={t(locale, "stream.museum.empty")}
        />
      )}
    </div>
  );
}

function itemState(
  item: CurationItem
): "consumed" | "ready" | "move" | "accept" {
  if (item.consumed) {
    return "consumed";
  }
  if (item.startable) {
    return "ready";
  }
  return item.moveSigned ? "accept" : "move";
}

function CurationRow({
  item,
  locale,
}: {
  readonly item: CurationItem;
  readonly locale: SupportedLocale;
}) {
  const { run, pending, message } = useStreamAction(locale);
  const state = itemState(item);
  return (
    <li className={`${STREAM_CARD} tw-flex tw-flex-col tw-gap-2 tw-p-4`}>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
          {item.title}
        </p>
        <StatusBadge
          tone={state === "ready" ? "live" : "neutral"}
          label={t(locale, `stream.curation.state.${state}`)}
        />
      </div>
      <p className={STREAM_HELP}>
        {t(locale, "stream.curation.parties", {
          accepted: formatInteger(locale, item.accepted),
          parties: formatInteger(locale, item.parties),
        })}
      </p>
      {state === "ready" ? (
        <div>
          <button
            type="button"
            className={STREAM_BUTTON_PRIMARY}
            disabled={pending}
            onClick={() => {
              void run((actions, from) =>
                actions.startAuction(from, item.itemHash)
              );
            }}
          >
            {t(locale, "stream.curation.start")}
          </button>
          <ActionMessage message={message} />
        </div>
      ) : null}
    </li>
  );
}

/** /stream/curation: approved packages and the items waiting to start. */
export function CurationPage() {
  const locale = useBrowserLocale();
  const { data: packages } = useStreamQuery("curation", [], (source) =>
    source.curationQueue()
  );
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.curation.title")}
        intro={t(locale, "stream.curation.intro")}
      >
        <PlaceholderNote locale={locale} />
      </PageHeader>
      {packages === undefined ? <Loading /> : null}
      {packages?.length === 0 ? (
        <Empty text={t(locale, "stream.curation.empty")} />
      ) : null}
      {(packages ?? []).map((entry) => (
        <Section
          key={entry.packageRoot}
          title={t(locale, "stream.curation.package", {
            date: formatUtcDate(locale, entry.registeredAt * 1_000),
          })}
          aside={<span className={STREAM_HELP}>{entry.waveVote}</span>}
        >
          <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-2">
            {entry.items.map((item) => (
              <CurationRow key={item.itemHash} item={item} locale={locale} />
            ))}
          </ul>
        </Section>
      ))}
    </div>
  );
}
