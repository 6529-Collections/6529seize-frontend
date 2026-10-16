import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhDisclosure from "../shared/TdhDisclosure";
import TdhTableFrame from "../shared/TdhTableFrame";
import {
  TDH_CAPTION,
  TDH_TABLE,
  TDH_TD,
  TDH_TD_NUM,
  TDH_TH,
  TDH_TH_NUM,
  tdhNarrowCell,
} from "../shared/tdhStyles";
import {
  BY_HAND_VECTORS,
  type ByHandRecord,
  type ByHandVector,
} from "./byHandVectors";

const TH = tdhNarrowCell(TDH_TH);
const TH_NUM = tdhNarrowCell(TDH_TH_NUM);
const TD = tdhNarrowCell(TDH_TD);
const TD_NUM = tdhNarrowCell(TDH_TD_NUM);
const RECORD_FIELDS = ["balance", "raw", "base", "boostC", "final"] as const;

/** A wallet by its letter and the end of its address: "A (0x…a1)". */
function walletName(vector: ByHandVector, tail: string): string {
  return `${vector.names[tail] ?? tail} (0x…${tail})`;
}

function recordName(vector: ByHandVector, record: ByHandRecord): string {
  return record.wallets.map((tail) => vector.names[tail] ?? tail).join(" + ");
}

/** "2026-10-10" from a unix timestamp, for the cycle's date. */
function dateOf(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function OneVector({
  locale,
  vector,
}: {
  readonly locale: SupportedLocale;
  readonly vector: ByHandVector;
}) {
  const m = (key: string, values?: Record<string, string>) =>
    t(locale, `network.tdh.impl.byHand.${key}` as MessageKey, values);
  const who = (tail: string) =>
    tail === "mint" ? m("mint") : (vector.names[tail] ?? tail);
  const hasRate = vector.records.some((record) => record.rateE4 !== null);
  const key = vector.id.split("-")[0] ?? vector.id;
  return (
    <section
      aria-labelledby={`by-hand-${key}`}
      className="tw-space-y-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4 first:tw-border-t-0 first:tw-pt-0"
    >
      <h4
        id={`by-hand-${key}`}
        className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50"
      >
        {m(`${key}.title`)}{" "}
        <code className="tw-font-mono tw-text-sm tw-font-normal tw-text-iron-300">
          {vector.id}
        </code>
      </h4>
      <p className="tw-m-0 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
        {m("setting", {
          wallets: Object.keys(vector.names)
            .map((tail) => walletName(vector, tail))
            .join(", "),
          seasons: vector.seasonStarts
            .map((start) => formatInteger(locale, start))
            .join(", "),
          time: formatInteger(locale, vector.cycle.timestamp),
          date: dateOf(vector.cycle.timestamp),
        })}
      </p>
      <TdhTableFrame label={m("input")}>
        <table className={TDH_TABLE}>
          <caption className={TDH_CAPTION}>{m("input")}</caption>
          <thead>
            <tr>
              <th scope="col" className={TH_NUM}>
                {m("position")}
              </th>
              <th scope="col" className={TH}>
                {m("token")}
              </th>
              <th scope="col" className={TH}>
                {m("move")}
              </th>
              <th scope="col" className={TH_NUM}>
                {m("amount")}
              </th>
              <th scope="col" className={TH_NUM}>
                {m("age")}
              </th>
            </tr>
          </thead>
          <tbody>
            {vector.transfers.map((row) => (
              <tr key={`${row.block}-${row.tx}-${row.log}`}>
                <td className={`${TD_NUM} tw-whitespace-nowrap`}>
                  {formatInteger(locale, row.block)} · {row.tx} · {row.log}
                </td>
                <td className={`${TD} tw-font-mono tw-text-[13px]`}>
                  {row.token}
                </td>
                <td className={`${TD} tw-whitespace-nowrap`}>
                  {who(row.from)} → {who(row.to)}
                </td>
                <td className={TD_NUM}>{formatInteger(locale, row.amount)}</td>
                <td className={TD_NUM}>
                  {formatInteger(locale, row.age)}
                  {row.partial ? m("partial") : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TdhTableFrame>
      {vector.links.length > 0 && (
        <p className="tw-m-0 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
          <span className="tw-font-medium tw-text-iron-100">{m("links")}</span>{" "}
          {vector.links
            .map((link) =>
              m("link", {
                block: formatInteger(locale, link.block),
                from: who(link.from),
                to: who(link.to),
              })
            )
            .join("; ")}
        </p>
      )}
      {(vector.h !== null || Object.keys(vector.rates).length > 0) && (
        <p className="tw-m-0 tw-text-sm tw-tabular-nums tw-leading-6 tw-text-iron-300">
          {[
            ...(vector.h === null
              ? []
              : [m("h", { h: formatInteger(locale, vector.h) })]),
            ...Object.entries(vector.rates).map(([token, cents]) =>
              m("rate", { token, cents: formatInteger(locale, cents) })
            ),
          ].join(" · ")}
        </p>
      )}
      <TdhTableFrame label={m("expected")}>
        <table className={TDH_TABLE}>
          <caption className={TDH_CAPTION}>{m("expected")}</caption>
          <thead>
            <tr>
              <th scope="col" className={TH}>
                {m("record")}
              </th>
              {RECORD_FIELDS.map((field) => (
                <th key={field} scope="col" className={TH_NUM}>
                  {m(`field.${field}`)}
                </th>
              ))}
              {hasRate && (
                <th scope="col" className={TH_NUM}>
                  {m("field.rateE4")}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {vector.records.flatMap((record) => [
              <tr key={`${record.kind}-${record.wallets.join("-")}`}>
                <th scope="row" className={`${TD} tw-font-normal`}>
                  <span className="tw-whitespace-nowrap tw-text-iron-50">
                    {recordName(vector, record)}
                  </span>
                  <span className="tw-block tw-text-xs tw-text-iron-400">
                    {m(`kind.${record.kind}`)}
                  </span>
                </th>
                {RECORD_FIELDS.map((field) => (
                  <td key={field} className={TD_NUM}>
                    {formatInteger(locale, record[field])}
                  </td>
                ))}
                {hasRate && (
                  <td className={TD_NUM}>
                    {record.rateE4 === null
                      ? "–"
                      : formatInteger(locale, record.rateE4)}
                  </td>
                )}
              </tr>,
              ...record.tokens.map((token) => (
                <tr
                  key={`${record.kind}-${record.wallets.join("-")}-${token.token}`}
                >
                  <th
                    scope="row"
                    className={`${TD} tw-pl-6 tw-font-mono tw-text-[13px] tw-font-normal tw-text-iron-300`}
                  >
                    {token.token}
                  </th>
                  <td className={TD_NUM}>
                    {formatInteger(locale, token.balance)}
                  </td>
                  <td className={TD_NUM}>{formatInteger(locale, token.raw)}</td>
                  <td className={TD_NUM}>
                    {formatInteger(locale, token.base)}
                  </td>
                  <td className={TD_NUM}>–</td>
                  <td className={TD_NUM}>
                    {formatInteger(locale, token.final)}
                  </td>
                  {hasRate && <td className={TD_NUM}>–</td>}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </TdhTableFrame>
      <p className="tw-m-0 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-200">
        <span className="tw-font-medium tw-text-iron-50">{m("why")}</span>{" "}
        {m(`${key}.why`)}
      </p>
    </section>
  );
}

/**
 * Three more vectors in full, one click away under the anatomy of vector
 * 36, so an implementation can be checked by hand on last in, first out
 * (04), the age carried inside an identity (06) and identity sums with
 * their rounding (23) before the vector files are published.
 */
export default function VectorsByHand({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <TdhDisclosure
      tone="strong"
      summary={t(locale, "network.tdh.impl.byHand.summary")}
    >
      <div className="tw-space-y-5 tw-pb-2 tw-pl-6">
        <p className="tw-m-0 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "network.tdh.impl.byHand.intro")}
        </p>
        {BY_HAND_VECTORS.map((vector) => (
          <OneVector key={vector.id} locale={locale} vector={vector} />
        ))}
      </div>
    </TdhDisclosure>
  );
}
