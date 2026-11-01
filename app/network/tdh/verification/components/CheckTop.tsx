import Link from "next/link";
import type { ReactNode } from "react";
import type { ResultDay } from "@/components/explained/evidence/DayRibbon";
import Equation, {
  type EquationRow,
} from "@/components/explained/evidence/Equation";
import { LimitNote } from "@/components/explained/evidence/notes";
import {
  SimulationButton,
  SimulationSwitch,
  WhenReal,
  WhenSimulated,
} from "@/components/explained/evidence/Simulation";
import FactValue from "@/components/explained/facts/FactValue";
import Hash from "@/components/explained/marks/Hash";
import { EX_BUTTON, EX_LINK } from "@/components/explained/tokens";
import { formatList, formatTime } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { factText, type Fact, type FactBook } from "@/lib/explained/facts";
import {
  formatCount,
  formatUtcClock,
  formatUtcDay,
} from "@/lib/explained/format";
import CheckRibbon, {
  AllResults,
  resultSlots,
  ribbonResults,
  type RibbonInput,
} from "./CheckRibbon";
import { pt } from "./copy";
import { FactText } from "@/components/explained/facts/FactText";
import { rich } from "@/components/explained/rich";
import {
  VERDICT_FRAME,
  checkState,
  snapshotInstant,
  type CheckState,
  type DayView,
} from "./dayModel";
import FailDayVerdict, { type VerdictFace } from "./FailDayVerdict";
import type { SimulatedDay } from "./simulatedDay";

/**
 * The daily check's first screen below its header (TDH-DESIGN.md §4.4):
 * the verdict with its limit inside, the totals as an equation, the file's
 * hash against the index, the actions with Break it, and every result so
 * far. "Show a day that fails" turns the verdict and the latest tile into
 * the constructed failing day together (§5.10).
 */
const DETAIL = "tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300";
/** "00:52": a time of day in UTC, where the page has already said UTC. */
const UTC_TIME: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
};

/** "days/20744.json": the file's path in the feed, from its URL. */
function fileName(url: string | null): string | null {
  return url === null ? null : url.split("/").slice(-2).join("/");
}

/** The day's file, its SHA-256 and whether it equals the index. */
function FileLine({
  day,
  locale,
}: {
  readonly day: DayView;
  readonly locale: SupportedLocale;
}) {
  const url = day.text("file.url");
  const name = fileName(url);
  const stated = day.text("file.sha256");
  const read = day.text("file.sha256Read");
  let status = <span>{pt(locale, "explained.tdh.check.file.unhashed")}</span>;
  if (stated !== null && read !== null) {
    status =
      stated === read ? (
        <span className="tw-text-green">
          {pt(locale, "explained.tdh.check.file.equals")}
        </span>
      ) : (
        <span className="tw-text-error">
          {pt(locale, "explained.tdh.check.file.differs")}
        </span>
      );
  }
  return (
    <p className="tw-m-0 tw-mt-3.5 tw-flex tw-flex-wrap tw-items-center tw-gap-x-5 tw-gap-y-1 tw-text-[13px] tw-leading-5 tw-text-iron-400">
      {name !== null && (
        <FactText fact={day.fact("file.url")} locale={locale}>
          {name}
        </FactText>
      )}
      <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-1.5">
        <span>{pt(locale, "explained.tdh.check.file.sha")}</span>
        {stated === null ? (
          <FactValue fact={null} locale={locale} />
        ) : (
          <Hash value={stated} locale={locale} stripes />
        )}
        {status}
      </span>
      {url !== null && name !== null && (
        <>
          <a
            className={`${EX_LINK} tw-font-semibold`}
            href={url}
            aria-label={pt(locale, "explained.tdh.check.file.jsonLabel", {
              file: name,
            })}
          >
            {pt(locale, "explained.tdh.check.file.json")}
          </a>
        </>
      )}
    </p>
  );
}

function equationRows(
  day: DayView,
  locale: SupportedLocale
): readonly EquationRow[] {
  return [
    {
      who: pt(locale, "explained.tdh.check.eq.rust"),
      sub: pt(locale, "explained.tdh.check.eq.rustSub"),
      value: day.fact("total"),
    },
    {
      who: pt(locale, "explained.tdh.check.eq.python"),
      sub: pt(locale, "explained.tdh.check.eq.pythonSub"),
      value: day.fact("total.python"),
    },
    {
      who: pt(locale, "explained.tdh.check.eq.live"),
      sub: pt(locale, "explained.tdh.check.eq.liveSub"),
      value: day.fact("total.live"),
    },
  ];
}

function differing(
  day: DayView,
  locale: SupportedLocale,
  pair: "live" | "python"
): ReactNode {
  const equal = day.num(`agree.${pair}.identities.equal`);
  const total = day.num(`agree.${pair}.identities.total`);
  const fact = day.fact(`agree.${pair}.identities.equal`);
  return (
    <FactText
      fact={equal === null || total === null ? null : fact}
      locale={locale}
    >
      {formatCount(locale, Math.max(0, (total ?? 0) - (equal ?? 0)))}
    </FactText>
  );
}

/** The holder sentence and its detail, for each state of a day. */
function verdictWords(
  state: CheckState,
  day: DayView,
  locale: SupportedLocale
): { readonly headline: ReactNode; readonly detail: ReactNode } {
  const v = (field: Parameters<DayView["fact"]>[0]) => (
    <FactValue fact={day.fact(field)} locale={locale} />
  );
  const identities = v("agree.live.identities.total");
  switch (state) {
    case "equal":
      return {
        headline: rich(locale, "explained.tdh.check.verdict.equal", {
          identities,
        }),
        detail: rich(locale, "explained.tdh.check.verdict.equalDetail", {
          wallets: v("agree.live.wallets.total"),
        }),
      };
    case "knownCause":
      return {
        headline: rich(locale, "explained.tdh.check.verdict.knownCause", {
          equal: v("agree.live.identities.equal"),
          identities,
        }),
        detail: pt(locale, "explained.tdh.check.verdict.knownCauseDetail"),
      };
    case "liveDiffers":
      return {
        headline: rich(locale, "explained.tdh.check.verdict.liveDiffers", {
          differ: differing(day, locale, "live"),
          identities,
        }),
        detail: pt(locale, "explained.tdh.check.verdict.liveDiffersDetail"),
      };
    case "programsDiffer":
      return {
        headline: rich(locale, "explained.tdh.check.verdict.programsDiffer", {
          differ: differing(day, locale, "python"),
          identities: v("agree.python.identities.total"),
        }),
        detail: pt(locale, "explained.tdh.check.verdict.programsDifferDetail"),
      };
    case "notCompared":
      return {
        headline: pt(locale, "explained.tdh.check.verdict.notCompared"),
        detail: pt(locale, "explained.tdh.check.verdict.notComparedDetail"),
      };
    case "unknown":
      return {
        headline: rich(locale, "explained.tdh.check.verdict.unknown", {
          verdict: v("verdict"),
        }),
        detail: pt(locale, "explained.tdh.check.verdict.unknownDetail"),
      };
  }
}

const WORD: Partial<Record<CheckState, "notComparedWord" | "unknownWord">> = {
  notCompared: "notComparedWord",
  unknown: "unknownWord",
};

/** The limit inside the verdict, while the history is not checked. */
function HistoryLimit({
  day,
  locale,
}: {
  readonly day: DayView;
  readonly locale: SupportedLocale;
}) {
  if (day.text("mode") !== "unchecked-history") {
    return null;
  }
  return (
    <div className="tw-mt-4">
      <LimitNote title={pt(locale, "explained.tdh.check.limit.title")}>
        {pt(locale, "explained.tdh.check.limit.body")}
      </LimitNote>
    </div>
  );
}

function realFace(day: DayView, locale: SupportedLocale): VerdictFace {
  const state = checkState(day);
  const words = verdictWords(state, day, locale);
  const word = WORD[state];
  return {
    state: VERDICT_FRAME[state],
    ...(word
      ? { word: pt(locale, `explained.tdh.check.verdict.${word}`) }
      : {}),
    headline: words.headline,
    detail: (
      <>
        <p className={DETAIL}>{words.detail}</p>
        <HistoryLimit day={day} locale={locale} />
      </>
    ),
    aside: (
      <>
        <Equation
          label={rich(locale, "explained.tdh.check.eq.label", {
            cycle: <FactValue fact={day.fact("cycle")} locale={locale} />,
          })}
          rows={equationRows(day, locale)}
          locale={locale}
        />
        <FileLine day={day} locale={locale} />
      </>
    ),
  };
}

function simulatedFace(
  day: DayView,
  sim: SimulatedDay,
  locale: SupportedLocale
): VerdictFace {
  const differ = formatCount(locale, sim.differ);
  const identities = formatCount(locale, sim.identities);
  return {
    state: "simulated",
    headline: pt(locale, "explained.tdh.check.sim.headline", {
      differ,
      identities,
    }),
    detail: (
      <p className={DETAIL}>
        {pt(locale, "explained.tdh.check.sim.detail", {
          differ,
          lower: formatCount(locale, sim.lowerBy),
          class: sim.differenceClass,
        })}
      </p>
    ),
    incident: {
      steps: [
        pt(locale, "explained.tdh.check.sim.detected", {
          time: formatTime(locale, sim.detectedAt, UTC_TIME),
        }),
        pt(locale, "explained.tdh.check.sim.classed", {
          class: sim.differenceClass,
        }),
        pt(locale, "explained.tdh.check.sim.investigating"),
        pt(locale, "explained.tdh.check.sim.fixed"),
        pt(locale, "explained.tdh.check.sim.closed"),
      ],
      done: sim.stepsReached,
    },
    aside: (
      <>
        <Equation
          label={rich(locale, "explained.tdh.check.eq.label", {
            cycle: <FactValue fact={day.fact("cycle")} locale={locale} />,
          })}
          rows={equationRows(day, locale).map((row, index) =>
            index === 2
              ? { ...row, simulated: formatCount(locale, sim.liveTotal) }
              : row
          )}
          forceDiffers={[2]}
          locale={locale}
        />
        {/* A constructed day has no file: the real file's hash would mix the
            real with the example. */}
        <p className="tw-m-0 tw-mt-3.5 tw-text-[13px] tw-leading-5 tw-text-iron-400">
          {pt(locale, "explained.tdh.check.file.constructed")}
        </p>
      </>
    ),
  };
}

/** "↻ marks a file rewritten after its run: Oct 14 and Oct 15 on Oct 16 at 15:59 UTC." */
function RewrittenLine({
  days,
  daysFact,
  locale,
}: {
  readonly days: readonly ResultDay[];
  readonly daysFact: Fact | null;
  readonly locale: SupportedLocale;
}) {
  const groups = new Map<string, ResultDay[]>();
  for (const day of days) {
    if (day.rewritten && day.writtenAt) {
      const minute = day.writtenAt.slice(0, 16);
      groups.set(minute, [...(groups.get(minute) ?? []), day]);
    }
  }
  if (groups.size === 0) {
    return null;
  }
  const items = [...groups.entries()].map(([minute, group]) => {
    const at = `${minute}:00Z`;
    return (
      <FactText key={minute} fact={daysFact} locale={locale}>
        {pt(locale, "explained.tdh.check.ribbon.rewrittenGroup", {
          dates: formatList(
            locale,
            group.map((day) => formatUtcDay(locale, day.date))
          ),
          date: formatUtcDay(locale, at),
          time: formatUtcClock(locale, at),
        })}
      </FactText>
    );
  });
  const joined: ReactNode[] = [];
  items.forEach((item, index) => {
    if (index > 0) joined.push("; ");
    joined.push(item);
  });
  return (
    <>
      {" "}
      {rich(locale, "explained.tdh.check.ribbon.rewritten", { groups: joined })}
    </>
  );
}

function RibbonCaption({
  input,
  daysFact,
  latestDate,
  locale,
}: {
  readonly input: RibbonInput;
  readonly daysFact: Fact | null;
  readonly latestDate: Fact | null;
  readonly locale: SupportedLocale;
}) {
  const shown = ribbonResults(input);
  const results = shown.flatMap((slot) =>
    slot.kind === "result" ? [slot.day] : []
  );
  const total = resultSlots(input.days).length;
  const midnight =
    latestDate === null
      ? "–"
      : formatUtcClock(locale, snapshotInstant(factText(latestDate)));
  return (
    <p className="tw-m-0 tw-mt-3 tw-text-[15px] tw-leading-[23px] tw-text-iron-400">
      {rich(locale, "explained.tdh.check.ribbon.caption", {
        midnight: (
          <FactText fact={latestDate} locale={locale}>
            {midnight}
          </FactText>
        ),
      })}
      <RewrittenLine days={results} daysFact={daysFact} locale={locale} />
      {shown.length < total && (
        <>
          {" "}
          {rich(locale, "explained.tdh.check.ribbon.window", {
            shown: (
              <FactText fact={daysFact} locale={locale}>
                {formatCount(locale, shown.length)}
              </FactText>
            ),
            total: (
              <FactText fact={daysFact} locale={locale}>
                {formatCount(locale, total)}
              </FactText>
            ),
          })}
        </>
      )}
    </p>
  );
}

/** The ribbon's input from the facts: the results, the open day, the cutover ahead. */
function ribbonInput(book: FactBook): RibbonInput {
  const days = book.maybe<ResultDay[]>("tdh.days")?.value ?? [];
  const openDate = book.maybe<string>("tdh.open.date")?.value ?? null;
  const minutesLeft = book.maybe<number>("tdh.open.minutesLeft")?.value;
  const progress = book.maybe<number>("tdh.open.progress")?.value;
  const cutover = book.maybe<string>("tdh.cutover.about")?.value ?? null;
  return {
    days,
    open:
      openDate !== null && minutesLeft !== undefined && progress !== undefined
        ? { date: openDate, minutesLeft, progress }
        : null,
    cutover:
      cutover !== null && openDate !== null && cutover > openDate
        ? cutover
        : null,
  };
}

export default function CheckTop({
  book,
  day,
  simulated,
  locale,
}: {
  readonly book: FactBook;
  readonly day: DayView;
  readonly simulated: SimulatedDay | null;
  readonly locale: SupportedLocale;
}) {
  const cycle = day.num("cycle");
  const input = ribbonInput(book);
  const actions = (
    <>
      {cycle !== null && (
        <Link
          className={EX_BUTTON.cta}
          href={`/network/tdh/verification/${cycle}`}
        >
          {pt(locale, "explained.tdh.check.act.receipt")}
        </Link>
      )}
      <Link className={EX_BUTTON.secondary} href="/network/tdh#explain">
        {pt(locale, "explained.tdh.check.act.record")}
      </Link>
      {simulated !== null && (
        <SimulationButton
          id="fail"
          edge={pt(locale, "explained.tdh.check.act.fail")}
          back={pt(locale, "explained.tdh.check.act.back")}
        />
      )}
    </>
  );
  return (
    <SimulationSwitch id="failday">
      <div className="tw-mt-8">
        <FailDayVerdict
          real={realFace(day, locale)}
          simulated={
            simulated === null ? null : simulatedFace(day, simulated, locale)
          }
          date={day.fact("date")}
          cycle={day.fact("cycle")}
          actions={actions}
          locale={locale}
        />
      </div>
      <div className="tw-mt-8 tw-scroll-mt-24" id="history">
        <WhenReal>
          <CheckRibbon input={input} locale={locale} />
        </WhenReal>
        <WhenSimulated>
          <CheckRibbon
            input={input}
            locale={locale}
            simulatedDiffer={simulated?.differ ?? null}
          />
        </WhenSimulated>
        <RibbonCaption
          input={input}
          daysFact={book.maybe("tdh.days")}
          latestDate={day.fact("date")}
          locale={locale}
        />
        <AllResults
          input={input}
          daysFact={book.maybe("tdh.days")}
          locale={locale}
        />
      </div>
    </SimulationSwitch>
  );
}
