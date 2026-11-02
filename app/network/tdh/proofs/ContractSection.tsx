import { LimitNote } from "@/components/explained/evidence/notes";
import { fill } from "@/components/explained/i18n";
import StampLine from "@/components/explained/marks/StampLine";
import { EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCount } from "@/lib/explained/format";
import { CONTRACT_CHECKS } from "./_lib/checks";
import { k } from "./_lib/copy";
import type { PageFacts } from "./_lib/facts";
import { rich } from "@/components/explained/rich";
import Section, { Para } from "./Section";

/**
 * One submission's gas, part by part: the two verifiers, the rest of the
 * contract's own work (its execution less the two verifications), and the
 * transaction's base cost with its calldata; then the whole.
 */
function GasTable({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  const execution = facts.num("proofs.pair.executionGas");
  const verifyA = facts.num("proofs.gas.verifyA");
  const verifyB = facts.num("proofs.gas.verifyB");
  const rest =
    execution === null || verifyA === null || verifyB === null
      ? null
      : execution - verifyA - verifyB;
  const rows = [
    { id: "verifyA", value: facts.print("proofs.gas.verifyA") },
    { id: "verifyB", value: facts.print("proofs.gas.verifyB") },
    {
      id: "rest",
      value: rest === null ? "-" : formatCount(locale, rest),
    },
    {
      id: "intrinsic",
      value: facts.print("proofs.pair.intrinsicGas"),
    },
  ] as const;
  return (
    <table
      className="tw-w-full tw-max-w-[620px] tw-border-collapse tw-text-[15px] tw-leading-6"
      data-fig="gas"
    >
      <caption className={`${EX_TEXT.label} tw-pb-2 tw-text-left`}>
        {fill(locale, k("gas.caption"))}
      </caption>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800"
          >
            <th
              scope="row"
              className="tw-py-2 tw-pr-4 tw-text-left tw-font-normal tw-text-iron-300"
            >
              {rich(locale, k(`gas.${row.id}`), {
                calldata: facts.print("proofs.pair.calldataBytes"),
              })}
            </th>
            <td className="tw-whitespace-nowrap tw-py-2 tw-text-right tw-font-mono tw-text-[14px] tw-tabular-nums tw-text-iron-50">
              {row.value}
            </td>
          </tr>
        ))}
        <tr>
          <th
            scope="row"
            className="tw-py-2 tw-pr-4 tw-text-left tw-font-semibold tw-text-iron-50"
          >
            {fill(locale, k("gas.total"))}
          </th>
          <td className="tw-whitespace-nowrap tw-py-2 tw-text-right tw-font-mono tw-text-[14px] tw-font-semibold tw-tabular-nums tw-text-iron-50">
            {facts.print("proofs.pair.transactionGas")}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * 04 · The contract (D128): what a submission must satisfy, check by check
 * in the order the contract runs them, each with the refusal the record
 * names; its status in one stamp line; and its limit, not deployed.
 */
export default function ContractSection({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  return (
    <Section
      id="contract"
      number="04"
      label={fill(locale, k("s4.label"))}
      heading={rich(locale, k("s4.heading"))}
      figure={
        <div className="tw-grid tw-gap-6">
          {/* The gas table takes the full width under the row, its note
              beside it, instead of squeezing into the prose column. */}
          <div className="tw-grid tw-grid-cols-1 tw-items-center tw-gap-x-12 tw-gap-y-4 lg:tw-grid-cols-[minmax(0,620px)_minmax(0,1fr)]">
            <div>
              <p className={`${EX_TEXT.body} tw-m-0 tw-mb-4`}>
                {rich(locale, k("s4.p2"))}
              </p>
              <GasTable locale={locale} facts={facts} />
            </div>
            <p className={`${EX_TEXT.cap} tw-m-0 tw-max-w-[440px]`}>
              {rich(locale, k("gas.note"), {
                submit: facts.print("proofs.pair.submitGas"),
                cold: facts.print("proofs.pair.coldCallGas"),
                total: facts.print("proofs.pair.transactionGas"),
              })}
            </p>
          </div>
          <ol
            className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-px tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-800 tw-p-0 md:tw-grid-cols-2 lg:tw-grid-cols-4"
            aria-label={fill(locale, k("s4.checks"), {
              count: String(CONTRACT_CHECKS.length),
            })}
            data-fig="checks"
          >
            {CONTRACT_CHECKS.map((check, index) => (
              <li
                key={check.id}
                className="tw-flex tw-flex-col tw-gap-1.5 tw-bg-iron-950 tw-px-5 tw-py-[18px]"
                data-check={check.id}
              >
                <span className="tw-text-[13px] tw-font-semibold tw-text-primary-300">
                  {index + 1}
                </span>
                <b className="tw-text-base tw-font-semibold tw-leading-[22px] tw-text-iron-50">
                  {rich(locale, k(`check.${check.id}.title`))}
                </b>
                <span className="tw-text-[15px] tw-leading-[22px] tw-text-iron-300">
                  {rich(locale, k(`check.${check.id}.body`), {
                    bytes: facts.print("proofs.statement.bytes"),
                    words: facts.print("proofs.statement.words"),
                    horizon: facts.print("proofs.contract.horizon"),
                  })}
                </span>
                {/* Every cell ends on its refusals, so the grid's lower
                    edge lines up: the errors the contract, or its two
                    verifiers, revert with for that check. */}
                <span className="tw-mt-auto tw-flex tw-flex-col tw-gap-1 tw-pt-1.5 tw-text-[13px] tw-leading-5 tw-text-iron-400">
                  <span>{fill(locale, k("check.refusal"))}</span>
                  <span className="tw-flex tw-flex-wrap tw-gap-x-3 tw-gap-y-0.5">
                    {check.refusals.map((name) => (
                      <code
                        key={name}
                        className="tw-font-mono tw-text-[13px] tw-text-iron-50"
                      >
                        {name}
                      </code>
                    ))}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-5 tw-gap-y-2">
            <StampLine
              locale={locale}
              marks={[
                { kind: "decided", refText: "D128" },
                { maturity: "built" },
                { kind: "tested" },
              ]}
            />
            <span className={EX_TEXT.meta}>
              {rich(locale, k("s4.tested"), {
                unit: facts.print("proofs.contract.unitTests"),
                fork: facts.print("proofs.contract.forkTests"),
                date: facts.print("proofs.contract.testedOn"),
              })}
            </span>
          </div>
          <LimitNote title={rich(locale, k("s4.limitTitle"))}>
            {rich(locale, k("s4.limitBody"))}
          </LimitNote>
        </div>
      }
    >
      <Para>{rich(locale, k("s4.p1"), { decision: "D128" })}</Para>
    </Section>
  );
}
