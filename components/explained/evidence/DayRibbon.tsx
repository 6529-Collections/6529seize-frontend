import type { SupportedLocale } from "@/i18n/locales";
import { formatCount, formatUtcDay } from "@/lib/explained/format";
import { kt } from "../i18n";
import { ageText } from "../age";
import { Glyph } from "../marks/glyphs";
import Ribbon from "../figures/Ribbon";

/**
 * Every result so far (EXPLAINED.md §6.4): a day is a tile whose snapshot is
 * the bar on its right edge, its fill the verdict. Equal is Tested, Differs
 * Shown false, a known cause Tested with the words, a missing file Not
 * guaranteed; the open day is a dashed blue tile with its progress; days to
 * come are dashed; the cutover is outlined and "about". ↻ marks a file
 * rewritten after its run.
 */
export type DayKind =
  | "equal"
  | "differs"
  | "knownCause"
  | "missing"
  | "open"
  | "future"
  | "cutover"
  | "simulated";

export interface DayTileProps {
  readonly kind: DayKind;
  readonly date: string;
  readonly locale: SupportedLocale;
  readonly cycle?: number;
  /** Identities equal (or differing, for a failing day). */
  readonly count?: number;
  /** When the file was written: a time, or the day it was rewritten. */
  readonly written?: { readonly rewritten: boolean; readonly at: string };
  /** The open day: minutes to its snapshot and the share gone, 0 to 100. */
  readonly open?: { readonly minutesLeft: number; readonly progress: number };
}

const FRAME: Record<DayKind, string> = {
  equal: "tw-border-solid tw-border-green/45 tw-bg-green/[0.09]",
  knownCause: "tw-border-solid tw-border-green/45 tw-bg-green/[0.09]",
  differs: "tw-border-solid tw-border-error/60 tw-bg-error/[0.09]",
  simulated: "tw-border-solid tw-border-error/60 tw-bg-error/[0.09]",
  missing: "tw-border-dashed tw-border-iron-400",
  open: "tw-border-dashed tw-border-primary-400/70 tw-bg-primary-400/[0.12]",
  future: "tw-border-dashed tw-border-iron-700",
  cutover: "tw-border-solid tw-border-iron-400",
};

const SNAPSHOT: Partial<Record<DayKind, string>> = {
  equal: "tw-bg-green",
  knownCause: "tw-bg-green",
  differs: "tw-bg-error",
  simulated: "tw-bg-error",
  open: "tw-bg-primary-400/35",
};

const VERDICT_WORD: Partial<Record<DayKind, Parameters<typeof kt>[1]>> = {
  equal: "explained.kit.verdict.equal",
  knownCause: "explained.kit.verdict.knownCause",
  differs: "explained.kit.verdict.differs",
  simulated: "explained.kit.verdict.differs",
  missing: "explained.kit.verdict.missing",
};

function glyphFor(kind: DayKind) {
  if (kind === "equal" || kind === "knownCause") return <Glyph kind="tested" />;
  if (kind === "differs" || kind === "simulated")
    return <Glyph kind="shownFalse" />;
  if (kind === "missing") return <Glyph kind="notGuaranteed" />;
  return null;
}

function accessibleName(props: DayTileProps, day: string): string {
  const { kind, locale, cycle, open } = props;
  if (kind === "open") {
    const left = open?.minutesLeft ?? 0;
    return left <= 0
      ? kt(locale, "explained.kit.day.dueName", { date: day })
      : kt(locale, "explained.kit.day.openName", {
          date: day,
          time: ageText(locale, left),
        });
  }
  if (kind === "future")
    return kt(locale, "explained.kit.day.futureName", { date: day });
  if (kind === "cutover")
    return kt(locale, "explained.kit.day.cutoverName", { date: day });
  const word = VERDICT_WORD[kind];
  const name = kt(locale, "explained.kit.day.name", {
    date: day,
    cycle: formatCount(locale, cycle ?? 0),
    verdict: word ? kt(locale, word) : "",
  });
  const { written } = props;
  return written?.rewritten
    ? `${name}, ${kt(locale, "explained.kit.day.rewritten", { date: formatUtcDay(locale, written.at) })}`
    : name;
}

/** The tile's first line: what the day's check found. */
function primaryText(
  kind: DayKind,
  locale: SupportedLocale,
  count: number | undefined
): string | null {
  const counted = { count: formatCount(locale, count ?? 0) };
  switch (kind) {
    case "equal":
    case "knownCause":
      return kt(locale, "explained.kit.day.equal", counted);
    case "differs":
      return kt(locale, "explained.kit.day.differ", counted);
    case "simulated":
      return kt(locale, "explained.kit.day.simulated");
    case "missing":
      return kt(locale, "explained.kit.day.missing");
    case "open":
      return kt(locale, "explained.kit.day.open");
    case "cutover":
      return kt(locale, "explained.kit.day.cutover");
    case "future":
      return null;
  }
}

/** The tile's second line: the cause, the countdown or when it was written. */
function secondaryText(props: DayTileProps): string | null {
  const { kind, locale, count, written, open } = props;
  if (kind === "knownCause") {
    return kt(locale, "explained.kit.verdict.knownCause");
  }
  if (kind === "simulated" && count !== undefined) {
    return kt(locale, "explained.kit.day.differ", {
      count: formatCount(locale, count),
    });
  }
  if (open) {
    // Past the expected time the result is due, not "in 0 min".
    return open.minutesLeft <= 0
      ? kt(locale, "explained.kit.day.due")
      : kt(locale, "explained.kit.day.openIn", {
          time: ageText(locale, open.minutesLeft),
        });
  }
  if (!written) {
    return null;
  }
  return written.rewritten
    ? `↻ ${kt(locale, "explained.kit.day.rewritten", { date: formatUtcDay(locale, written.at) })}`
    : kt(locale, "explained.kit.day.written", {
        time: written.at.slice(11, 16),
      });
}

export function DayTile(props: DayTileProps) {
  const { kind, date, locale, count, written, open } = props;
  const day = formatUtcDay(locale, date);
  const snapshot = SNAPSHOT[kind];
  const dim = kind === "future" || kind === "cutover";
  const primary = primaryText(kind, locale, count);
  const secondary = secondaryText(props);
  return (
    <div
      className={`tw-relative tw-flex tw-h-full tw-min-h-[84px] tw-flex-col tw-justify-between tw-rounded-lg tw-border tw-p-2 md:tw-min-h-[104px] md:tw-px-3 md:tw-py-2.5 ${FRAME[kind]}`}
      role="img"
      aria-label={accessibleName(props, day)}
      data-day={kind}
      {...(written?.rewritten ? { "data-rewritten": "" } : {})}
    >
      {snapshot && (
        <span
          className={`tw-absolute -tw-right-px tw-bottom-2 tw-top-2 tw-w-0.5 tw-rounded-sm md:tw-bottom-3 md:tw-top-3 ${snapshot}`}
          aria-hidden="true"
        />
      )}
      <span
        className={`tw-flex tw-items-center tw-justify-between tw-gap-1 tw-text-sm tw-font-semibold tw-leading-5 md:tw-text-[15px] ${dim ? "tw-text-iron-400" : "tw-text-iron-50"} ${kind === "open" ? "tw-text-primary-300" : ""}`}
        aria-hidden="true"
      >
        <span className="tw-whitespace-nowrap">
          {kind === "cutover"
            ? kt(locale, "explained.kit.day.about", { date: day })
            : day}
        </span>
        {glyphFor(kind)}
      </span>
      <span
        className="tw-text-xs tw-leading-4 tw-text-iron-400 md:tw-text-[13px] md:tw-leading-[18px]"
        aria-hidden="true"
      >
        {primary}
        {written?.rewritten && <span className="tw-ml-1 md:tw-hidden">↻</span>}
        {secondary && (
          <span
            className={`tw-block tw-text-xs ${written && !open ? "max-md:tw-hidden" : ""}`}
          >
            {secondary}
          </span>
        )}
      </span>
      {open && (
        <span
          className="tw-mt-1 tw-block tw-h-1 tw-overflow-hidden tw-rounded-sm tw-bg-primary-400/[0.22]"
          aria-hidden="true"
        >
          <i
            className="tw-block tw-h-full tw-bg-primary-400"
            style={{ width: `${open.progress}%` }}
          />
        </span>
      )}
    </div>
  );
}

export interface RibbonDay extends Omit<DayTileProps, "locale"> {
  /** Days to come drop out on a phone. */
  readonly hideOnPhone?: boolean;
}

export default function DayRibbon({
  days,
  locale,
  columns = 10,
}: {
  readonly days: readonly RibbonDay[];
  readonly locale: SupportedLocale;
  readonly columns?: number;
}) {
  return (
    <Ribbon
      label={kt(locale, "explained.kit.day.ribbon")}
      columns={columns}
      items={days.map((day) => ({
        key: `${day.kind}-${day.date}`,
        hideOnPhone: day.hideOnPhone ?? false,
        node: <DayTile {...day} locale={locale} />,
      }))}
    />
  );
}

/** A result as the facts layer lists it (`tdh.days`). */
export interface ResultDay {
  readonly cycle: number;
  readonly date: string;
  readonly verdict: string;
  readonly identitiesEqual: number | null;
  readonly identitiesTotal: number | null;
  readonly writtenAt: string | null;
  readonly rewritten: boolean;
  /** As the facts layer lists it (`tdh.days`): plain values only. */
  readonly [key: string]: string | number | boolean | null;
}

/** The feed's verdict as a tile: OK is equal, a known cause is named, the rest differ. */
export function dayKindOf(verdict: string): DayKind {
  if (verdict === "OK") return "equal";
  if (verdict === "KNOWN_CAUSE" || verdict === "EXPLAINED") return "knownCause";
  return "differs";
}

/**
 * The ribbon's days from the facts: every result, the open day, the days
 * still to come before the cutover (not on a phone), and the cutover.
 */
export function ribbonDays({
  days,
  open,
  cutover,
  futureDays = 3,
}: {
  readonly days: readonly ResultDay[];
  readonly open?: {
    readonly date: string;
    readonly minutesLeft: number;
    readonly progress: number;
  };
  readonly cutover?: string;
  readonly futureDays?: number;
}): RibbonDay[] {
  const out: RibbonDay[] = days.map((day) => {
    const kind = dayKindOf(day.verdict);
    const count =
      kind === "differs"
        ? Math.max(0, (day.identitiesTotal ?? 0) - (day.identitiesEqual ?? 0))
        : (day.identitiesEqual ?? 0);
    return {
      kind,
      date: day.date,
      cycle: day.cycle,
      count,
      ...(day.writtenAt
        ? { written: { rewritten: day.rewritten, at: day.writtenAt } }
        : {}),
    };
  });
  if (open) {
    out.push({
      kind: "open",
      date: open.date,
      open: { minutesLeft: open.minutesLeft, progress: open.progress },
    });
    const start = Date.parse(`${open.date}T00:00:00Z`);
    const until = cutover
      ? Date.parse(`${cutover}T00:00:00Z`)
      : Number.POSITIVE_INFINITY;
    for (let step = 1; step <= futureDays; step += 1) {
      const at = start + step * 86_400_000;
      if (at >= until) break;
      out.push({
        kind: "future",
        date: new Date(at).toISOString().slice(0, 10),
        hideOnPhone: true,
      });
    }
  }
  if (cutover) {
    out.push({ kind: "cutover", date: cutover });
  }
  return out;
}
