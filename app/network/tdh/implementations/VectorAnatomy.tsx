import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhSource from "../shared/TdhSource";
import TdhTableFrame from "../shared/TdhTableFrame";
import {
  TDH_CAPTION,
  TDH_CARD,
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TD,
  TDH_TD_NUM,
  TDH_TH,
  TDH_TH_NUM,
  tdhNarrowCell,
} from "../shared/tdhStyles";

/**
 * Vector 36-erc1155-send-and-return of P26 §13, as its file states it: eight
 * transfers in canonical order and the values a program must produce. Every
 * address, transaction and token in it is synthetic: A is 0x…a1, the
 * marketplace W 0x…ee and the buyer B 0x…b2. Transfers 4 to 8 share one
 * transaction (block 2000, txIndex 3), five days before the snapshot. Ages
 * are whole days before the vector's T, 1,791,676,799 (2026-10-10 23:59:59
 * UTC); its registry lists one season, starting at Meme 1.
 */
/** The vector's addresses, by the letters the derivation uses. */
const NAMES: Readonly<Record<string, string>> = { a1: "A", ee: "W", b2: "B" };
const who = (address: string, mint: string) =>
  address === "mint" ? mint : (NAMES[address] ?? address);
const SAME_TX_BLOCK = 2000;
const VECTOR = {
  id: "36-erc1155-send-and-return",
  transfers: [
    {
      block: 1001,
      age: 100,
      tx: 0,
      log: 0,
      token: "memes#1",
      from: "mint",
      to: "a1",
      amount: 3,
    },
    {
      block: 1002,
      age: 40,
      tx: 0,
      log: 0,
      token: "memes#1",
      from: "mint",
      to: "a1",
      amount: 2,
    },
    {
      block: 1003,
      age: 60,
      tx: 0,
      log: 0,
      token: "memes#2",
      from: "mint",
      to: "a1",
      amount: 4,
    },
    {
      block: 2000,
      age: 5,
      tx: 3,
      log: 0,
      token: "memes#1",
      from: "a1",
      to: "ee",
      amount: 3,
    },
    {
      block: 2000,
      age: 5,
      tx: 3,
      log: 1,
      token: "memes#2",
      from: "a1",
      to: "ee",
      amount: 3,
    },
    {
      block: 2000,
      age: 5,
      tx: 3,
      log: 2,
      token: "memes#1",
      from: "ee",
      to: "a1",
      amount: 3,
    },
    {
      block: 2000,
      age: 5,
      tx: 3,
      log: 3,
      token: "memes#2",
      from: "ee",
      to: "a1",
      amount: 2,
    },
    {
      block: 2000,
      age: 5,
      tx: 3,
      log: 4,
      token: "memes#2",
      from: "ee",
      to: "b2",
      amount: 1,
    },
  ],
  /** The vector's expected values for the cycle as a whole. */
  cycle: {
    H: 5,
    editions: "memes#1 5, memes#2 4",
    rates: "memes#1 100, memes#2 125",
  },
  /**
   * The expected records: each identity, then its tokens. boost_c is the
   * identity's boost in cents; a token has none of its own.
   */
  records: [
    {
      id: "a1",
      token: null,
      balance: 8,
      raw: 560,
      base: 605,
      boost: 108,
      final: 653,
    },
    {
      id: "a1",
      token: "memes#1",
      balance: 5,
      raw: 380,
      base: 380,
      boost: null,
      final: 410,
    },
    {
      id: "a1",
      token: "memes#2",
      balance: 3,
      raw: 180,
      base: 225,
      boost: null,
      final: 243,
    },
    {
      id: "b2",
      token: null,
      balance: 1,
      raw: 5,
      base: 6,
      boost: 100,
      final: 6,
    },
    {
      id: "b2",
      token: "memes#2",
      balance: 1,
      raw: 5,
      base: 6,
      boost: null,
      final: 6,
    },
  ],
  /** Addresses that must have no record: the marketplace W. */
  absent: "ee",
  totals: { final: 659, base: 611, raw: 565, finalExcludingSinks: 659 },
} as const;
const RECORD_FIELDS = ["balance", "raw", "base", "boost", "final"] as const;

export default function VectorAnatomy({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const m = (key: string) =>
    t(locale, `network.tdh.impl.anatomy.${key}` as Parameters<typeof t>[1]);
  return (
    <figure className={`${TDH_CARD} tw-m-0 tw-p-4 sm:tw-p-5`}>
      <figcaption>
        <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
          {m("title")}{" "}
          <code className="tw-font-mono tw-text-sm tw-font-normal tw-text-iron-300">
            {VECTOR.id}
          </code>
        </p>
        <p className="tw-m-0 tw-mt-1 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
          {m("intro")}
          <TdhSource refs={["P26 §13", "D131"]} locale={locale} />
        </p>
        <p className="tw-m-0 tw-mt-2 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
          {m("legend")}
        </p>
      </figcaption>
      <div className="tw-mt-4 tw-space-y-4">
        <div className="tw-min-w-0">
          <p className="tw-m-0 tw-mb-2 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 lg:tw-hidden">
            {m("input")}
          </p>
          <ol className="tw-m-0 tw-grid tw-list-none tw-gap-2 tw-p-0 lg:tw-hidden">
            {VECTOR.transfers.map((row) => {
              const sameTx = row.block === SAME_TX_BLOCK;
              return (
                <li
                  key={`${row.block}-${row.log}`}
                  className={`tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2.5 ${sameTx ? "tw-border-primary-400/40 tw-bg-primary-500/[0.07]" : "tw-border-white/[0.07] tw-bg-iron-950"}`}
                >
                  <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1 tw-text-sm tw-tabular-nums tw-text-iron-300">
                    <span>
                      {m("block")} {formatInteger(locale, row.block)}
                    </span>
                    <span>
                      {m("tx")} {row.tx}
                    </span>
                    <span>
                      {m("log")} {row.log}
                    </span>
                    <span>
                      {t(locale, "network.tdh.impl.anatomy.ageValue", {
                        days: formatInteger(locale, row.age),
                      })}
                    </span>
                    {sameTx && (
                      <span className="tw-text-primary-300">{m("sameTx")}</span>
                    )}
                  </p>
                  <p className="tw-m-0 tw-mt-1 tw-break-all tw-font-mono tw-text-[13px] tw-text-iron-50">
                    {row.token}
                  </p>
                  <p className="tw-m-0 tw-mt-0.5 tw-font-mono tw-text-[13px] tw-text-iron-200">
                    {who(row.from, m("mint"))} → {who(row.to, m("mint"))}
                    <span className="tw-ml-2 tw-font-sans tw-tabular-nums tw-text-iron-300">
                      × {formatInteger(locale, row.amount)}
                    </span>
                  </p>
                </li>
              );
            })}
          </ol>
          <div className={`${TDH_TABLE_FRAME} tw-hidden lg:tw-block`}>
            <table className={TDH_TABLE}>
              <caption className={TDH_CAPTION}>{m("input")}</caption>
              <thead>
                <tr>
                  <th scope="col" className={TDH_TH_NUM}>
                    {m("block")}
                  </th>
                  <th scope="col" className={TDH_TH_NUM}>
                    {m("tx")}
                  </th>
                  <th scope="col" className={TDH_TH_NUM}>
                    {m("log")}
                  </th>
                  <th scope="col" className={TDH_TH}>
                    {m("token")}
                  </th>
                  <th scope="col" className={TDH_TH}>
                    {m("move")}
                  </th>
                  <th scope="col" className={TDH_TH_NUM}>
                    {m("amount")}
                  </th>
                  <th scope="col" className={TDH_TH_NUM}>
                    {m("age")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {VECTOR.transfers.map((row) => {
                  const sameTx = row.block === SAME_TX_BLOCK;
                  return (
                    <tr
                      key={`${row.block}-${row.log}`}
                      className={
                        sameTx ? "tw-bg-primary-500/[0.07]" : undefined
                      }
                    >
                      <td className={TDH_TD_NUM}>
                        {formatInteger(locale, row.block)}
                      </td>
                      <td className={TDH_TD_NUM}>{row.tx}</td>
                      <td className={TDH_TD_NUM}>{row.log}</td>
                      <td className={TDH_TD}>{row.token}</td>
                      <td className={TDH_TD}>
                        {who(row.from, m("mint"))} → {who(row.to, m("mint"))}
                        {sameTx && (
                          <span className="tw-ml-2 tw-text-sm tw-text-primary-300">
                            {m("sameTx")}
                          </span>
                        )}
                      </td>
                      <td className={TDH_TD_NUM}>
                        {formatInteger(locale, row.amount)}
                      </td>
                      <td className={TDH_TD_NUM}>
                        {formatInteger(locale, row.age)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="tw-m-0 tw-mt-2 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
            {m("timestampsNote")}
            <TdhSource refs={["P26 §4.2"]} locale={locale} />
          </p>
        </div>
        <div className="tw-grid tw-items-start tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div className="tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-px-4 tw-py-3">
            <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
              {m("expectedCycle")}
            </p>
            <dl className="tw-m-0 tw-mt-2 tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-0.5 tw-text-sm tw-leading-6 min-[420px]:tw-grid-cols-[auto_minmax(0,1fr)] min-[420px]:tw-gap-y-2">
              <dt className="tw-text-iron-400">H</dt>
              <dd className="tw-m-0 tw-tabular-nums tw-text-iron-100">
                {formatInteger(locale, VECTOR.cycle.H)}
              </dd>
              <dt className="tw-text-iron-400">{m("editions")}</dt>
              <dd className="tw-m-0 tw-tabular-nums tw-text-iron-100">
                {VECTOR.cycle.editions}
              </dd>
              <dt className="tw-text-iron-400">{m("rates")}</dt>
              <dd className="tw-m-0 tw-tabular-nums tw-text-iron-100">
                {VECTOR.cycle.rates}
              </dd>
              <dt className="tw-text-iron-400">{m("absent")}</dt>
              <dd className="tw-m-0 tw-text-iron-100">
                {t(locale, "network.tdh.impl.anatomy.absentValue", {
                  who: who(VECTOR.absent, m("mint")),
                })}
              </dd>
              <dt className="tw-text-iron-400">{m("totals")}</dt>
              <dd className="tw-m-0 tw-tabular-nums tw-text-iron-100">
                {t(locale, "network.tdh.impl.anatomy.totalsValue", {
                  final: formatInteger(locale, VECTOR.totals.final),
                  base: formatInteger(locale, VECTOR.totals.base),
                  raw: formatInteger(locale, VECTOR.totals.raw),
                  excluding: formatInteger(
                    locale,
                    VECTOR.totals.finalExcludingSinks
                  ),
                })}
              </dd>
            </dl>
          </div>
          <TdhTableFrame label={m("expected")}>
            <table className={TDH_TABLE}>
              <caption className={TDH_CAPTION}>{m("expected")}</caption>
              <thead>
                <tr>
                  <th scope="col" className={tdhNarrowCell(TDH_TH)}>
                    {m("record")}
                  </th>
                  {RECORD_FIELDS.map((field) => (
                    <th
                      key={field}
                      scope="col"
                      className={tdhNarrowCell(TDH_TH_NUM)}
                    >
                      {field === "boost" ? "boost_c" : field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VECTOR.records.map((row) => (
                  <tr
                    key={`${row.id}-${row.token ?? "identity"}`}
                    className={
                      row.token === null ? "tw-bg-white/[0.02]" : undefined
                    }
                  >
                    <th
                      scope="row"
                      className={`${tdhNarrowCell(TDH_TD)} tw-font-normal ${row.token === null ? "tw-font-semibold tw-text-iron-50" : "tw-pl-6 tw-font-mono tw-text-[13px] tw-text-iron-300 sm:tw-pl-7"}`}
                    >
                      {row.token ?? who(row.id, m("mint"))}
                    </th>
                    {RECORD_FIELDS.map((field) => (
                      <td key={field} className={tdhNarrowCell(TDH_TD_NUM)}>
                        {row[field] === null
                          ? "–"
                          : formatInteger(locale, row[field])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </TdhTableFrame>
        </div>
      </div>
      <p className="tw-m-0 tw-mt-4 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
        <span className="tw-font-medium tw-text-iron-100">
          {m("derivation")}:
        </span>{" "}
        {m("derivationBody")}
      </p>
      <p className="tw-m-0 tw-mt-2 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
        {m("boostBody")}
      </p>
    </figure>
  );
}
