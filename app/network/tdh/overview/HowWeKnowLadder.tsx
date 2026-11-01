import Link from "next/link";
import AssuranceLadder, {
  type Rung,
} from "@/components/explained/evidence/AssuranceLadder";
import { FailureSentence } from "@/components/explained/evidence/notes";
import type { ResultDay } from "@/components/explained/evidence/DayRibbon";
import { dateOfCycleDay } from "@/components/explained/engine/tdh";
import { Icon } from "@/components/explained/marks/glyphs";
import { EX_BUTTON, EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { fmt, type FactBook, type FactId } from "@/lib/explained/facts";
import { formatUtcDay } from "@/lib/explained/format";
import { orich, ot } from "./copy";
import ProofChain from "./ProofChain";
import SectionLabel from "./SectionLabel";

/**
 * §04 How we know (TDH-DESIGN.md §4.1): seven rungs by what each rules out,
 * three marks at most per rung, and the blue line after rung 3 where
 * today's evidence stops. Rungs 5 and 6 carry the zero-knowledge proofs in
 * full: programs A and B, each in its own prover, and the D128 contract
 * that needs both. Then the failure sentence and the candour line.
 */
const NOT_AVAILABLE = "-";

function factText(book: FactBook, id: FactId, locale: SupportedLocale): string {
  const fact = book.maybe(id);
  return fact === null ? NOT_AVAILABLE : fmt(fact, locale);
}

/**
 * Days inside the comparison's range with no result in the index (a run
 * that failed and is not yet published again), as dates: "Oct 23".
 */
export function missingResultDays(
  days: readonly Pick<ResultDay, "cycle">[],
  locale: SupportedLocale
): string[] {
  if (days.length === 0) return [];
  const cycles = new Set(days.map((day) => day.cycle));
  const first = Math.min(...cycles);
  const last = Math.max(...cycles);
  const missing: string[] = [];
  for (let cycle = first + 1; cycle < last; cycle += 1) {
    if (!cycles.has(cycle)) {
      missing.push(formatUtcDay(locale, dateOfCycleDay(cycle)));
    }
  }
  return missing;
}

function dailyRef(book: FactBook, locale: SupportedLocale): string {
  const f = (id: FactId) => factText(book, id, locale);
  const params = {
    equal: f("tdh.days.equal"),
    compared: f("tdh.days.compared"),
    first: f("tdh.days.first"),
  };
  const missing = missingResultDays(
    book.maybe<ResultDay[]>("tdh.days")?.value ?? [],
    locale
  );
  return missing.length === 0
    ? ot(locale, "rung.dailyRef", params)
    : ot(locale, "rung.dailyRefMissing", {
        ...params,
        missing: new Intl.ListFormat(locale, { type: "conjunction" }).format(
          missing
        ),
      });
}

function rungs(book: FactBook, locale: SupportedLocale): Rung[] {
  const f = (id: FactId) => factText(book, id, locale);
  return [
    {
      what: ot(locale, "rung.written"),
      detail: ot(locale, "rung.writtenBody"),
      marks: [
        {
          kind: "proposed",
          refText: ot(locale, "rung.writtenStanding"),
        },
        {
          kind: "tested",
          refText: ot(locale, "rung.writtenVectors", {
            vectors: f("rules.vectors"),
          }),
        },
      ],
    },
    {
      what: ot(locale, "rung.proved"),
      detail: ot(locale, "rung.provedBody", {
        p53: f("manifest.proved.p53"),
      }),
      marks: [
        {
          kind: "proved",
          label: ot(locale, "rung.provedMark", {
            proved: f("manifest.proved.tdh"),
          }),
          refText: ot(locale, "rung.provedRef", {
            shownFalse: f("manifest.shownFalse.tdh"),
          }),
        },
      ],
    },
    {
      what: ot(locale, "rung.daily"),
      detail: ot(locale, "rung.dailyBody"),
      marks: [
        {
          kind: "tested",
          refText: dailyRef(book, locale),
        },
      ],
    },
    {
      what: ot(locale, "rung.inputs"),
      detail: ot(locale, "rung.inputsBody"),
      marks: [{ kind: "notYet" }],
    },
    {
      what: ot(locale, "rung.zk"),
      detail: <ProofChain book={book} locale={locale} />,
      marks: [
        {
          halfPair: { a: book.maybe("site.proofA.cycle") !== null, b: false },
        },
      ],
    },
    {
      what: ot(locale, "rung.recorded"),
      detail: ot(locale, "rung.recordedBody"),
      marks: [
        { kind: "decided", refText: ot(locale, "rung.recordedRef") },
        { maturity: "built" },
      ],
    },
    {
      what: ot(locale, "rung.signed"),
      detail: ot(locale, "rung.signedBody"),
      marks: [
        { kind: "decided", refText: ot(locale, "rung.signedRef") },
        {
          maturity: "built",
          refText: ot(locale, "rung.builtRef", {
            version: f("site.validator.version"),
          }),
        },
      ],
    },
  ];
}

/** Rung numbers by what they rule out, for the failure sentence. */
const INPUTS_RUNG = 4;
const PROOFS_RUNG = 2;
const TODAY_AFTER = 3;

export default function HowWeKnowLadder({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  return (
    <section id="tdh-verified" className={EX_LAYOUT.section}>
      <div className={EX_LAYOUT.stmt}>
        <div>
          <SectionLabel no="04" label={ot(locale, "know.label")} />
          <h2 className={EX_TEXT.stmt}>{ot(locale, "know.title")}</h2>
        </div>
        <div className="lg:tw-pt-1.5">
          <p className={`${EX_TEXT.body} tw-m-0`}>{ot(locale, "know.body")}</p>
        </div>
      </div>
      <div className="tw-mt-10 md:tw-mt-12" data-ex-allow-number="">
        <AssuranceLadder
          locale={locale}
          tracks={[{ rungs: rungs(book, locale), todayAfter: TODAY_AFTER }]}
        />
      </div>
      <div className="tw-mt-10 tw-grid tw-grid-cols-1 tw-items-start tw-gap-8 lg:tw-grid-cols-2 lg:tw-gap-6">
        <FailureSentence
          locale={locale}
          ifs={[ot(locale, "know.fail1"), ot(locale, "know.fail2")]}
          closedBy={orich(locale, "know.closedBy", {
            inputs: <span>{INPUTS_RUNG}</span>,
            proofs: <span>{PROOFS_RUNG}</span>,
          })}
        />
        <div className="lg:tw-pt-2">
          <p className={EX_TEXT.candour}>{ot(locale, "know.candour")}</p>
          <p className="tw-m-0 tw-mt-4 tw-flex tw-flex-col tw-items-start tw-gap-3">
            <Link className={EX_BUTTON.link} href="/network/tdh/verification">
              {ot(locale, "know.link")}
              <Icon kind="arrow" className="tw-size-4" />
            </Link>
            <Link className={EX_BUTTON.link} href="/network/tdh/formal">
              {ot(locale, "know.linkSure")}
              <Icon kind="arrow" className="tw-size-4" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
