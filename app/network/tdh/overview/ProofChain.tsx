import { dateOfCycleDay } from "@/components/explained/engine/tdh";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";
import { formatUtcDay } from "@/lib/explained/format";
import { ot } from "./copy";

/**
 * Rung 5 in full (TDH-DESIGN.md §4.1; EXPLAINED.md §2.1, §4.2): the two
 * separately written programs, each run inside its own zero-knowledge
 * prover, with the proof capsule beside each, filled when the program has
 * proved a day and dashed when it has not. The words say the same, so the
 * capsules are drawing only. Proof A's day comes from the facts layer.
 */
const NOT_AVAILABLE = "-";

function Capsule({
  letter,
  done,
}: {
  readonly letter: "A" | "B";
  readonly done: boolean;
}) {
  return (
    <span
      className={`tw-mt-px tw-inline-grid tw-size-[22px] tw-place-items-center tw-rounded-full tw-text-xs tw-font-bold tw-leading-none ${done ? "tw-bg-green tw-text-[#0D0D0F]" : "tw-border-[1.5px] tw-border-dashed tw-border-iron-400 tw-text-iron-400"}`}
      aria-hidden="true"
      data-proof={letter}
      data-proved={done ? "1" : "0"}
    >
      {letter}
    </span>
  );
}

export default function ProofChain({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const cycle = book.maybe<number>("site.proofA.cycle");
  const date =
    cycle === null
      ? NOT_AVAILABLE
      : formatUtcDay(locale, dateOfCycleDay(cycle.value));
  const line =
    "tw-grid tw-grid-cols-[22px_minmax(0,1fr)] tw-items-start tw-gap-x-2.5";
  return (
    <span className="tw-flex tw-flex-col tw-gap-2" data-proof-chain="">
      <span>{ot(locale, "zk.lead")}</span>
      <span className={line}>
        <Capsule letter="A" done={cycle !== null} />
        <span>
          {ot(locale, "zk.lineA", {
            date,
            version:
              book.maybe<string>("proofs.day.ruleVersion")?.value ??
              NOT_AVAILABLE,
          })}
        </span>
      </span>
      <span className={line}>
        <Capsule letter="B" done={false} />
        <span>{ot(locale, "zk.lineB")}</span>
      </span>
    </span>
  );
}
