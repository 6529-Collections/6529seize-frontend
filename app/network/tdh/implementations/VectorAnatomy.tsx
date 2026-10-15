import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhSource from "../shared/TdhSource";
import {
  TDH_CAPTION,
  TDH_CARD,
  TDH_TABLE,
  TDH_TABLE_WRAP,
  TDH_TD,
  TDH_TD_NUM,
  TDH_TH,
  TDH_TH_NUM,
} from "../shared/tdhStyles";

/**
 * Vector 18-erc721-round-trip of P26 §13, as its file states it: four
 * transfers in canonical order and the values a program must produce. The
 * addresses are the vector's synthetic ones; transfers 3 and 4 share one
 * transaction (block 4000, txIndex 5).
 */
const VECTOR_18 = {
  transfers: [
    {
      block: 1001,
      tx: 0,
      log: 0,
      token: "memes#1",
      from: "mint",
      to: "c3",
      amount: 1,
    },
    {
      block: 1002,
      tx: 0,
      log: 0,
      token: "nextgen#10000000049",
      from: "mint",
      to: "c2",
      amount: 1,
    },
    {
      block: 4000,
      tx: 5,
      log: 1,
      token: "nextgen#10000000049",
      from: "c2",
      to: "c3",
      amount: 1,
    },
    {
      block: 4000,
      tx: 5,
      log: 2,
      token: "nextgen#10000000049",
      from: "c3",
      to: "c2",
      amount: 1,
    },
  ],
  expected: [
    { field: "rate (nextgen#10000000049)", value: "100" },
    { field: "balance", value: "1" },
    { field: "raw", value: "239" },
    { field: "base", value: "239" },
    { field: "boost_c", value: "100" },
    { field: "final", value: "239" },
  ],
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
            18-erc721-round-trip
          </code>
        </p>
        <p className="tw-m-0 tw-mt-1 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {m("intro")}
          <TdhSource refs={["P26 §13", "D131"]} locale={locale} />
        </p>
      </figcaption>
      <div className="tw-mt-4 tw-grid tw-gap-4 xl:tw-grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div
          className={TDH_TABLE_WRAP}
          tabIndex={0}
          role="region"
          aria-label={m("input")}
        >
          <table className={`${TDH_TABLE} tw-min-w-[30rem]`}>
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
              </tr>
            </thead>
            <tbody>
              {VECTOR_18.transfers.map((row) => {
                const sameTx = row.block === 4000;
                return (
                  <tr
                    key={`${row.block}-${row.log}`}
                    className={sameTx ? "tw-bg-primary-500/[0.07]" : undefined}
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
                        <span className="tw-ml-2 tw-font-sans tw-text-[11px] tw-text-primary-300">
                          {m("sameTx")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="tw-min-w-0 tw-space-y-3">
          <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07]">
            <table className={TDH_TABLE}>
              <caption className={TDH_CAPTION}>{m("expected")}</caption>
              <thead>
                <tr>
                  <th scope="col" className={TDH_TH}>
                    {m("field")}
                  </th>
                  <th scope="col" className={TDH_TH_NUM}>
                    {m("value")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {VECTOR_18.expected.map((row) => (
                  <tr key={row.field}>
                    <th
                      scope="row"
                      className={`${TDH_TD} tw-font-mono tw-text-xs tw-font-normal`}
                    >
                      {row.field}
                    </th>
                    <td className={`${TDH_TD_NUM} tw-font-mono tw-text-xs`}>
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
