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
 * transaction (block 2000, txIndex 3), five days before the snapshot.
 */
const SAME_TX_BLOCK = 2000;
const VECTOR = {
  id: "36-erc1155-send-and-return",
  transfers: [
    {
      block: 1001,
      tx: 0,
      log: 0,
      token: "memes#1",
      from: "mint",
      to: "a1",
      amount: 3,
    },
    {
      block: 1002,
      tx: 0,
      log: 0,
      token: "memes#1",
      from: "mint",
      to: "a1",
      amount: 2,
    },
    {
      block: 1003,
      tx: 0,
      log: 0,
      token: "memes#2",
      from: "mint",
      to: "a1",
      amount: 4,
    },
    {
      block: 2000,
      tx: 3,
      log: 0,
      token: "memes#1",
      from: "a1",
      to: "ee",
      amount: 3,
    },
    {
      block: 2000,
      tx: 3,
      log: 1,
      token: "memes#2",
      from: "a1",
      to: "ee",
      amount: 3,
    },
    {
      block: 2000,
      tx: 3,
      log: 2,
      token: "memes#1",
      from: "ee",
      to: "a1",
      amount: 3,
    },
    {
      block: 2000,
      tx: 3,
      log: 3,
      token: "memes#2",
      from: "ee",
      to: "a1",
      amount: 2,
    },
    {
      block: 2000,
      tx: 3,
      log: 4,
      token: "memes#2",
      from: "ee",
      to: "b2",
      amount: 1,
    },
  ],
  /** The two identities' expected records: wallet A and buyer B. */
  expected: [
    { field: "balance", a: "8", b: "1" },
    { field: "raw", a: "560", b: "5" },
    { field: "base", a: "605", b: "6" },
    { field: "boost_c", a: "108", b: "100" },
    { field: "final", a: "653", b: "6" },
  ],
  rates: "memes#1 100, memes#2 125",
} as const;

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
        <p className="tw-m-0 tw-mt-1 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {m("intro")}
          <TdhSource refs={["P26 §13", "D131"]} locale={locale} />
        </p>
      </figcaption>
      <div className="tw-mt-4 tw-grid tw-items-start tw-gap-4 xl:tw-grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
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
                  <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-tabular-nums tw-text-iron-300">
                    <span>
                      {m("block")} {formatInteger(locale, row.block)}
                    </span>
                    <span>
                      {m("tx")} {row.tx}
                    </span>
                    <span>
                      {m("log")} {row.log}
                    </span>
                    {sameTx && (
                      <span className="tw-text-primary-300">{m("sameTx")}</span>
                    )}
                  </p>
                  <p className="tw-m-0 tw-mt-1 tw-break-all tw-font-mono tw-text-[13px] tw-text-iron-50">
                    {row.token}
                  </p>
                  <p className="tw-m-0 tw-mt-0.5 tw-font-mono tw-text-[13px] tw-text-iron-200">
                    {row.from === "mint" ? m("mint") : `0x…${row.from}`} →{" "}
                    {`0x…${row.to}`}
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
                      <td className={`${TDH_TD} tw-font-mono tw-text-xs`}>
                        {row.token}
                      </td>
                      <td className={`${TDH_TD} tw-font-mono tw-text-xs`}>
                        {row.from === "mint" ? m("mint") : `0x…${row.from}`} →{" "}
                        {`0x…${row.to}`}
                        {sameTx && (
                          <span className="tw-ml-2 tw-font-sans tw-text-xs tw-text-primary-300">
                            {m("sameTx")}
                          </span>
                        )}
                      </td>
                      <td className={TDH_TD_NUM}>
                        {formatInteger(locale, row.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="tw-min-w-0 tw-space-y-3">
          <TdhTableFrame label={m("expected")}>
            <table className={TDH_TABLE}>
              <caption className={TDH_CAPTION}>{m("expected")}</caption>
              <thead>
                <tr>
                  <th scope="col" className={tdhNarrowCell(TDH_TH)}>
                    {m("field")}
                  </th>
                  <th scope="col" className={tdhNarrowCell(TDH_TH_NUM)}>
                    {m("value")}
                  </th>
                  <th scope="col" className={tdhNarrowCell(TDH_TH_NUM)}>
                    {m("valueB")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {VECTOR.expected.map((row) => (
                  <tr key={row.field}>
                    <th
                      scope="row"
                      className={`${tdhNarrowCell(TDH_TD)} tw-font-mono tw-text-xs tw-font-normal`}
                    >
                      {row.field}
                    </th>
                    <td
                      className={`${tdhNarrowCell(TDH_TD_NUM)} tw-font-mono tw-text-xs`}
                    >
                      {row.a}
                    </td>
                    <td
                      className={`${tdhNarrowCell(TDH_TD_NUM)} tw-font-mono tw-text-xs`}
                    >
                      {row.b}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TdhTableFrame>
          <p className="tw-m-0 tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-400">
            rates: {VECTOR.rates}
          </p>
        </div>
      </div>
      <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
        <span className="tw-font-medium tw-text-iron-100">
          {m("derivation")}:
        </span>{" "}
        {m("derivationBody")}
      </p>
    </figure>
  );
}
