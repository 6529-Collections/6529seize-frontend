import { LimitNote } from "@/components/explained/evidence/notes";
import { fill } from "@/components/explained/i18n";
import StampLine from "@/components/explained/marks/StampLine";
import { EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { CONTRACT_CHECKS } from "./_lib/checks";
import { k } from "./_lib/copy";
import type { PageFacts } from "./_lib/facts";
import { rich } from "@/components/explained/rich";
import Section, { Para } from "./Section";

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
                {check.refusals.length > 0 && (
                  <span className="tw-mt-auto tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-0.5 tw-pt-1.5 tw-text-[13px] tw-leading-5 tw-text-iron-400">
                    {fill(locale, k("check.refusal"))}
                    {check.refusals.map((name) => (
                      <code
                        key={name}
                        className="tw-font-mono tw-text-[13px] tw-text-iron-50"
                      >
                        {name}
                      </code>
                    ))}
                  </span>
                )}
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
      <Para>
        {rich(locale, k("s4.p2"), {
          gas: facts.print("proofs.pair.transactionGas"),
          execution: facts.print("proofs.pair.submitGas"),
          verifyA: facts.print("proofs.gas.verifyA"),
          verifyB: facts.print("proofs.gas.verifyB"),
          calldata: facts.print("proofs.pair.calldataBytes"),
        })}
      </Para>
    </Section>
  );
}
