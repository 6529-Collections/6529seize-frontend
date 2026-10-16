import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhDisclosure from "./TdhDisclosure";
import { DIFFTEST_ROUNDS } from "./tdhFacts";
import {
  TDH_CAPTION,
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TD_STACK_MD,
  TDH_TH,
} from "./tdhStyles";

/** "F1, E1–E7": a round's finding codes, ranges with an en dash. */
function findingCodes(findings: readonly string[]): string {
  return findings.map((code) => code.replace("-", "–")).join(", ");
}

/**
 * The five rounds of differential tests of 15 and 16 October 2026 as one compact
 * table (the validator's tools/difftest/README.md): what each round found,
 * in one line, and the P26 round that settled it with the findings' codes.
 * The generated inputs, the same each round but the first, are in the
 * caption; each round's findings in full are one click away. Rows become
 * cards below md.
 */
export default function DifftestRounds({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const m = (key: string, values?: Record<string, string>) =>
    t(locale, `network.tdh.shared.difftest.${key}` as MessageKey, values);
  const [first, second] = DIFFTEST_ROUNDS;
  return (
    <div className="tw-space-y-2">
      <div className={TDH_TABLE_FRAME}>
        <table className={`${TDH_TABLE} tw-block md:tw-table`}>
          <caption className={`${TDH_CAPTION} tw-block md:tw-table-caption`}>
            {m("caption")}{" "}
            <span className="tw-font-normal tw-text-iron-400">
              {m("inputs", {
                cases: formatInteger(locale, second.cases),
                edge: formatInteger(locale, second.edge),
                first: formatInteger(locale, first.cases),
              })}
            </span>
          </caption>
          <thead className="tw-hidden md:tw-table-header-group">
            <tr>
              <th scope="col" className={`${TDH_TH} tw-w-24`}>
                {m("round")}
              </th>
              <th scope="col" className={TDH_TH}>
                {m("found")}
              </th>
              <th scope="col" className={`${TDH_TH} tw-w-56`}>
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
                  <td className={`${TDH_TD_STACK_MD} tw-text-sm tw-leading-6`}>
                    {m(`short.${n}`)}
                  </td>
                  <td
                    className={`${TDH_TD_STACK_MD} tw-text-sm tw-leading-6 tw-text-iron-300`}
                  >
                    {m(`settled.${n}`, { commit: round.settledBy ?? "" })}
                    <span className="tw-block tw-font-mono tw-text-xs tw-text-iron-400">
                      {findingCodes(round.findings)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TdhDisclosure summary={m("details")}>
        <ol className="tw-m-0 tw-max-w-[38em] tw-list-none tw-space-y-2 tw-pb-2 tw-pl-6 tw-text-sm tw-leading-6 tw-text-iron-300">
          {DIFFTEST_ROUNDS.map((_, index) => {
            const n = String(index + 1);
            return (
              <li key={n}>
                <strong className="tw-font-semibold tw-text-iron-100">
                  {m("roundN", { n: formatInteger(locale, index + 1) })}.
                </strong>{" "}
                {m(`found.${n}`)}
              </li>
            );
          })}
          <li>{m("otherVectors")}</li>
        </ol>
      </TdhDisclosure>
    </div>
  );
}
