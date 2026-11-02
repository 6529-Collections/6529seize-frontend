import Lanes from "@/components/explained/figures/Lanes";
import { fill } from "@/components/explained/i18n";
import { EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { formatNumber } from "@/i18n/format";
import { fmt, isFact } from "@/lib/explained/facts";
import type { ProofPhase } from "@/lib/explained/registry/proofFacts";
import { k } from "./_lib/copy";
import type { PageFacts } from "./_lib/facts";
import { rich } from "@/components/explained/rich";
import Section, { Para } from "./Section";

/**
 * 02 · How a proof is made: the day's pipeline as lanes, then the two
 * figures that say where the work goes. The day's blocks by their evidence
 * (bloom or receipts, P53 §4.6: one form a block), and program A's steps by
 * phase from the profiled build, drawn as shares of one bar each.
 */

function text(
  facts: PageFacts,
  locale: SupportedLocale,
  id: Parameters<PageFacts["entry"]>[0]
): string {
  const entry = facts.entry(id);
  return entry && isFact(entry) ? fmt(entry, locale) : "";
}

function share(locale: SupportedLocale, part: number, whole: number): string {
  return formatNumber(locale, part / whole, {
    style: "percent",
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  });
}

function BlocksFigure({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  const BLOCKS = "proofs.day.blocks";
  const blocks = facts.num(BLOCKS) ?? 0;
  const bloom = facts.num("proofs.day.bloomBlocks") ?? 0;
  const receipts = facts.num("proofs.day.receiptBlocks") ?? 0;
  const held = facts.num("proofs.day.txBlocks") ?? 0;
  if (blocks === 0) return null;
  const pct = (n: number) => `${(n / blocks) * 100}%`;
  const rows = [
    {
      id: "bloom",
      label: fill(locale, k("blocks.bloom")),
      n: facts.print("proofs.day.bloomBlocks"),
      width: pct(bloom),
      tone: "tw-bg-iron-700",
    },
    {
      id: "receipts",
      label: fill(locale, k("blocks.receipts")),
      n: facts.print("proofs.day.receiptBlocks"),
      width: pct(receipts),
      tone: "tw-bg-iron-400",
    },
    {
      id: "held",
      label: fill(locale, k("blocks.held")),
      n: facts.print("proofs.day.txBlocks"),
      width: pct(held),
      tone: "tw-bg-iron-50",
      // A part of the blocks whose receipts were rebuilt, not a third kind.
      within: true,
    },
  ];
  return (
    <figure className="tw-m-0" data-fig="blocks">
      <figcaption className={`${EX_TEXT.label} tw-mb-3.5`}>
        {rich(locale, k("blocks.label"), {
          blocks: facts.print(BLOCKS),
          date: facts.print("proofs.day.date"),
        })}
      </figcaption>
      {/* The blocks that held a log are a sliver at the bar's end: a
          callout above it names them, with a leader down to the sliver. */}
      <div className="tw-relative tw-h-7" aria-hidden="true">
        <span className="tw-absolute tw-bottom-1.5 tw-right-0 tw-flex tw-items-baseline tw-gap-1.5 tw-whitespace-nowrap tw-text-[13px] tw-leading-4 tw-text-iron-300">
          <b className="tw-font-semibold tw-text-iron-50">
            {facts.print("proofs.day.txBlocks")}
          </b>
          <span className="max-sm:tw-hidden">
            {fill(locale, k("blocks.held"))}
          </span>
        </span>
        <span className="tw-absolute -tw-bottom-0 tw-right-px tw-h-1.5 tw-w-px tw-bg-iron-50" />
      </div>
      <div
        className="tw-flex tw-h-7 tw-w-full tw-overflow-hidden tw-rounded-md"
        aria-hidden="true"
      >
        <span
          className="tw-h-full tw-bg-iron-700"
          style={{ width: pct(bloom) }}
        />
        <span
          className="tw-relative tw-h-full tw-bg-iron-400"
          style={{ width: pct(receipts) }}
        >
          <span
            className="tw-absolute tw-inset-y-0 tw-right-0 tw-min-w-[3px] tw-bg-iron-50"
            style={{ width: `${(held / Math.max(1, receipts)) * 100}%` }}
          />
        </span>
      </div>
      <ul className="tw-m-0 tw-mt-3.5 tw-grid tw-list-none tw-grid-cols-1 tw-gap-2 tw-p-0 md:tw-grid-cols-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className={`tw-grid tw-grid-cols-[12px_minmax(0,1fr)] tw-items-baseline tw-gap-2.5 tw-text-[15px] tw-leading-[22px] tw-text-iron-300 ${"within" in row ? "max-md:tw-pl-6" : ""}`}
          >
            <span
              className={`tw-inline-block tw-size-3 tw-rounded-sm ${row.tone}`}
              aria-hidden="true"
            />
            <span>
              <b className="tw-mr-1.5 tw-font-semibold tw-text-iron-50">
                {row.n}
              </b>
              {row.label}
            </span>
          </li>
        ))}
      </ul>
      <p className={`${EX_TEXT.cap} tw-m-0 tw-mt-3 tw-max-w-[760px]`}>
        {rich(locale, k("blocks.cap"))}
      </p>
    </figure>
  );
}

const PHASE_KEY = {
  receipts: "phases.receipts",
  tdh: "phases.tdh",
  accounting: "phases.accounting",
  history: "phases.history",
  export: "phases.export",
  decode: "phases.decode",
  rest: "phases.rest",
} as const;

function PhasesFigure({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  const parts = facts.raw("proofs.phases.parts") as
    | readonly ProofPhase[]
    | null;
  const total = facts.num("proofs.phases.total");
  if (parts === null || total === null || total === 0) return null;
  const top = Math.max(...parts.map((part) => part.steps));
  return (
    <figure className="tw-m-0" data-fig="phases">
      <figcaption className={`${EX_TEXT.label} tw-mb-3.5`}>
        {rich(locale, k("phases.label"))}
      </figcaption>
      <ol className="tw-m-0 tw-grid tw-list-none tw-gap-2.5 tw-p-0">
        {parts.map((part, index) => {
          const key: (typeof PHASE_KEY)[keyof typeof PHASE_KEY] | undefined = (
            PHASE_KEY as Readonly<
              Record<string, (typeof PHASE_KEY)[keyof typeof PHASE_KEY]>
            >
          )[part.id];
          return (
            <li
              key={part.id}
              className="tw-grid tw-grid-cols-[minmax(0,1fr)_64px] tw-items-center tw-gap-x-3 tw-gap-y-1 md:tw-grid-cols-[300px_minmax(0,1fr)_64px]"
              data-phase={part.id}
            >
              <span className="tw-text-[15px] tw-leading-[21px] tw-text-iron-300">
                {key ? fill(locale, k(key)) : part.id}
              </span>
              <span
                className="tw-col-span-2 tw-row-start-2 tw-h-2.5 tw-overflow-hidden tw-rounded-sm tw-bg-iron-900 md:tw-col-span-1 md:tw-row-start-1"
                aria-hidden="true"
              >
                <span
                  className={`tw-block tw-h-full ${index === 0 ? "tw-bg-iron-50" : "tw-bg-iron-400"}`}
                  style={{ width: `${(part.steps / top) * 100}%` }}
                />
              </span>
              <span className="tw-text-right tw-text-[15px] tw-font-semibold tw-tabular-nums tw-text-iron-50">
                {share(locale, part.steps, total)}
              </span>
            </li>
          );
        })}
      </ol>
      <p className={`${EX_TEXT.cap} tw-m-0 tw-mt-3 tw-max-w-[760px]`}>
        {rich(locale, k("phases.cap"), {
          build: (
            <code className="tw-font-mono tw-text-[14px] tw-text-inherit">
              {facts.print("proofs.phases.build")}
            </code>
          ),
          total: facts.print("proofs.phases.total"),
          steps: facts.print("proofs.day.steps"),
        })}
      </p>
    </figure>
  );
}

export default function HowMade({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  return (
    <Section
      id="made"
      number="02"
      label={fill(locale, k("s2.label"))}
      heading={rich(locale, k("s2.heading"))}
      figure={
        <div className="tw-grid tw-gap-12 md:tw-gap-16">
          <Lanes
            locale={locale}
            label={fill(locale, k("lanes.label"), {
              date: text(facts, locale, "proofs.day.date"),
            })}
            lanes={[
              {
                kicker: fill(locale, k("lanes.eth.kicker")),
                title: fill(locale, k("lanes.eth.title")),
                cap: rich(locale, k("lanes.eth.cap"), {
                  blocks: facts.print("proofs.day.blocks"),
                }),
              },
              {
                kicker: fill(locale, k("lanes.input.kicker")),
                title: fill(locale, k("lanes.input.title")),
                cap: rich(locale, k("lanes.input.cap"), {
                  bytes: facts.print("proofs.day.inputBytes"),
                }),
              },
              {
                kicker: fill(locale, k("lanes.run.kicker")),
                title: fill(locale, k("lanes.run.title")),
                cap: rich(locale, k("lanes.run.cap"), {
                  steps: facts.print("proofs.day.steps"),
                }),
              },
              {
                kicker: fill(locale, k("lanes.proof.kicker")),
                title: fill(locale, k("lanes.proof.title")),
                cap: rich(locale, k("lanes.proof.cap"), {
                  bytes: facts.print("proofs.pair.proofBytesA"),
                  hours: facts.print("site.proofA.provedHours"),
                  minutes: facts.print("site.proofA.provedMinutes"),
                  gpu: facts.print("proofs.day.gpu"),
                }),
              },
              {
                kicker: fill(locale, k("lanes.verify.kicker")),
                title: fill(locale, k("lanes.verify.title")),
                cap: rich(locale, k("lanes.verify.cap"), {
                  block: facts.print("site.proofA.ethCallBlock"),
                }),
                ok: true,
              },
            ]}
          />
          <div className="tw-grid tw-grid-cols-1 tw-gap-12 lg:tw-grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:tw-gap-16">
            <BlocksFigure locale={locale} facts={facts} />
            <PhasesFigure locale={locale} facts={facts} />
          </div>
        </div>
      }
    >
      <Para>{rich(locale, k("s2.p1"))}</Para>
      <Para>
        {rich(locale, k("s2.p2"), {
          date: facts.print("proofs.day.date"),
          txBlocks: facts.print("proofs.day.txBlocks"),
          blocks: facts.print("proofs.day.blocks"),
          logs: facts.print("proofs.day.dayLogs"),
        })}
      </Para>
    </Section>
  );
}
