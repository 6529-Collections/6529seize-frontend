import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { DIFFTEST_ROUNDS } from "./tdhFacts";
import {
  TDH_CAPTION,
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TD_STACK_MD,
  TDH_TH,
} from "./tdhStyles";

/**
 * The four rounds of differential tests of 15 October 2026 as one compact
 * table (the validator's tools/difftest/README.md): the generated inputs,
 * what each round found, and the P26 round that settled it. Rows become
 * cards below md.
 */
export default function DifftestRounds({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const m = (key: string, values?: Record<string, string>) =>
    t(locale, `network.tdh.shared.difftest.${key}` as MessageKey, values);
  return (
    <div className="tw-space-y-2">
      <div className={TDH_TABLE_FRAME}>
        <table className={`${TDH_TABLE} tw-block md:tw-table`}>
          <caption className={`${TDH_CAPTION} tw-block md:tw-table-caption`}>
            {m("caption")}
          </caption>
          <thead className="tw-hidden md:tw-table-header-group">
            <tr>
              <th scope="col" className={`${TDH_TH} tw-w-24`}>
                {m("round")}
              </th>
              <th scope="col" className={`${TDH_TH} tw-w-40`}>
                {m("cases")}
              </th>
              <th scope="col" className={TDH_TH}>
                {m("found")}
              </th>
              <th scope="col" className={`${TDH_TH} tw-w-44`}>
                {m("settled")}
              </th>
            </tr>
          </thead>
          <tbody className="tw-block md:tw-table-row-group">
            {DIFFTEST_ROUNDS.map((round, index) => {
              const n = String(index + 1);
              return (
                <tr
                  key={n}
                  className="tw-grid tw-gap-1.5 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3 first:tw-border-t-0 md:tw-table-row md:tw-p-0"
                >
                  <th
                    scope="row"
                    className={`${TDH_TD_STACK_MD} tw-font-semibold tw-text-iron-50`}
                  >
                    {m("roundN", { n: formatInteger(locale, index + 1) })}
                  </th>
                  <td
                    className={`${TDH_TD_STACK_MD} tw-text-[13px] tw-tabular-nums tw-text-iron-300`}
                  >
                    {m("casesValue", {
                      cases: formatInteger(locale, round.cases),
                      edge: formatInteger(locale, round.edge),
                    })}
                  </td>
                  <td className={`${TDH_TD_STACK_MD} tw-text-sm tw-leading-6`}>
                    {m(`found.${n}`)}
                  </td>
                  <td
                    className={`${TDH_TD_STACK_MD} tw-text-[13px] tw-text-iron-300`}
                  >
                    {m(`settled.${n}`, { commit: round.settledBy })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="tw-m-0 tw-max-w-prose tw-text-sm tw-leading-6 tw-text-iron-300">
        {m("otherVectors")}
      </p>
    </div>
  );
}
