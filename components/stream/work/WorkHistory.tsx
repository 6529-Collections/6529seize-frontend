"use client";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import { Empty, Loading } from "@/components/stream/pages/common";
import EthAmount from "@/components/stream/ui/EthAmount";
import StreamTime from "@/components/stream/work/StreamTime";
import { TABLE_RESET } from "@/components/stream/work/FactTable";
import KnownAddress from "@/components/stream/work/KnownAddress";
import { useAddressLabels } from "@/components/stream/work/useAddressLabels";
import type { SupportedLocale } from "@/i18n/locales";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { StatementView, StreamWork } from "@/lib/stream/types";

const HEAD =
  "tw-pb-2 tw-pr-3 tw-text-left tw-text-xs tw-font-medium tw-text-iron-400";
const CELL = "tw-py-2 tw-pr-3 tw-align-top";
const ROW = "tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07]";

/** The work's record of events (mints, bids, settlement, transfers, disputes), newest first. */
export function WorkHistory({
  work,
  locale,
}: {
  readonly work: StreamWork;
  readonly locale: SupportedLocale;
}) {
  const label = useAddressLabels(locale, work.parties);
  const { data: events } = useStreamQuery("provenance", [work.key], (source) =>
    source.provenance(work.key)
  );
  if (events === undefined) {
    return <Loading />;
  }
  if (events.length === 0) {
    return <Empty text={t(locale, "stream.work.noHistory")} />;
  }
  // The log is append-only, so a line's position identifies it.
  const newestFirst = events
    .map((event, position) => ({
      event,
      key: `${position}-${event.kind}-${event.txHash}`,
    }))
    .reverse();
  return (
    <div className="tw-overflow-x-auto">
      <table
        className={`tw-w-full tw-min-w-[20rem] tw-border-collapse tw-text-sm ${TABLE_RESET}`}
      >
        <caption className="tw-sr-only">
          {t(locale, "stream.workHistory.caption", { title: work.title })}
        </caption>
        <thead>
          <tr>
            <th scope="col" className={`${HEAD} tw-w-2/5 sm:tw-w-60`}>
              {t(locale, "stream.workHistory.when")}
            </th>
            <th scope="col" className={HEAD}>
              {t(locale, "stream.workHistory.event")}
            </th>
            <th scope="col" className={`${HEAD} tw-pr-0 tw-text-right`}>
              {t(locale, "stream.workHistory.amount")}
            </th>
          </tr>
        </thead>
        <tbody>
          {newestFirst.map(({ event, key }) => (
            <tr key={key} className={ROW}>
              <td className={`${CELL} tw-text-iron-400`}>
                <StreamTime seconds={event.at} locale={locale} />
              </td>
              <td className={CELL}>
                <span className="tw-block tw-text-iron-100">
                  {t(locale, `stream.provenance.${event.kind}`)}
                </span>
                {event.actor === null ? null : (
                  <KnownAddress
                    address={event.actor}
                    label={label}
                    locale={locale}
                  />
                )}
              </td>
              <td
                className={`${CELL} tw-pr-0 tw-text-right tw-font-medium tw-text-iron-50`}
              >
                {event.amount === undefined ? null : (
                  <EthAmount wei={event.amount} locale={locale} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const STATEMENT_KINDS: Readonly<Record<string, MessageKey>> = {
  DISPUTE_OUTCOME: "stream.workStatements.kind.DISPUTE_OUTCOME",
  DELISTING: "stream.workStatements.kind.DELISTING",
  RELISTING: "stream.workStatements.kind.RELISTING",
};

/** A statement kind in words; a kind this version does not know shows its label. */
function statementKind(locale: SupportedLocale, kind: string): string {
  const key = Object.hasOwn(STATEMENT_KINDS, kind)
    ? STATEMENT_KINDS[kind]
    : undefined;
  return key === undefined ? kind : t(locale, key);
}

/** `StatementAppended` entries about the work: dispute outcomes and other statements. */
export function WorkStatements({
  statements,
  locale,
}: {
  readonly statements: readonly StatementView[];
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-overflow-x-auto">
      <table
        className={`tw-w-full tw-min-w-[20rem] tw-border-collapse tw-text-sm ${TABLE_RESET}`}
      >
        <caption className="tw-sr-only">
          {t(locale, "stream.work.statements")}
        </caption>
        <thead>
          <tr>
            <th scope="col" className={HEAD}>
              {t(locale, "stream.workHistory.when")}
            </th>
            <th scope="col" className={`${HEAD} tw-pr-0`}>
              {t(locale, "stream.workStatements.statement")}
            </th>
          </tr>
        </thead>
        <tbody>
          {statements.map((statement) => (
            <tr key={statement.entryHash} className={ROW}>
              <td className={`${CELL} tw-text-iron-400`}>
                <StreamTime seconds={statement.at} locale={locale} />
              </td>
              <td className={`${CELL} tw-pr-0`}>
                <span className="tw-block tw-text-iron-100">
                  {statement.summary}
                </span>
                <span className="tw-block tw-text-xs tw-text-iron-400">
                  {t(locale, "stream.workStatements.meta", {
                    role: t(
                      locale,
                      `stream.workStatements.role.${statement.role}`
                    ),
                    kind: statementKind(locale, statement.kind),
                  })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
