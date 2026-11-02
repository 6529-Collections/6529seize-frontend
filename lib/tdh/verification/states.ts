import { cycleDayOfDate } from "@/components/explained/engine/tdh";
import type {
  DifferenceClass,
  VerificationCutover,
  VerificationDay,
  VerificationIndex,
  VerificationIndexDay,
} from "./schema";

/** D132: 6529.io switches to the Rust core's result about 23 October 2026. */
export const DEFAULT_CUTOVER: VerificationCutover = {
  plannedDate: "2026-10-23",
  status: "planned",
  cycleDay: null,
};

/**
 * D132: the daily runs start on 16 October 2026, and the cutover follows
 * "one week later". The cutover week is measured from here.
 */
const FIRST_REPORT_DATE = "2026-10-16";

/**
 * The feed's first two days (October 14 and 15, 2026) were first computed
 * together on October 15, before the scheduled runs began (the validator's
 * `tools/tdh-daily/README.md`). The file the feed serves for a day may be a
 * later run: what it is comes from its own `generatedAt`, never from here.
 */
const FIRST_RUN_DATE = "2026-10-15";

/**
 * The newest published days the RSS feed lists
 * (`/network/tdh/verification.rss`): not every day, once there are more.
 */
export const TDH_RSS_FEED_DAYS = 60;

/** The daily job's run, minutes after a cycle's 00:00 UTC boundary. */
const SCHEDULED_RUN_MINUTES = 40;
/** A file written this long after its scheduled run is called a later run. */
const LATE_AFTER_MS = 2 * 3_600_000;

/**
 * The builds of those first runs of October 15: the Rust core at validator
 * db72daa (the validator's `tools/tdh-daily/README.md`, "Cycles 20,740 and
 * 20,741"), 2b17216 and e127676 (the files the feed first published), and
 * the Python reference at 6529chain 0621ed4.
 */
const FIRST_RUN_BUILDS = {
  rust: ["db72daa", "2b17216", "e127676"],
  python: ["0621ed4"],
} as const;

/** The builds a day's file names: the Rust core's and the Python reference's commits. */
interface DayBuilds {
  readonly rust: string | null;
  readonly python: string | null;
}

/**
 * What a day's file says about the run that wrote it, for the page's note:
 * - `firstRun`: a day before the scheduled runs, from the first runs of
 *   October 15 (the file states no later time);
 * - `recomputed`: a day before the scheduled runs whose file was written
 *   after October 15 and names other builds than those first runs: it was
 *   computed again, by the builds the file names;
 * - `rewritten`: such a file written after October 15 whose builds are
 *   those of the first runs, or not stated: a later write, not shown to be
 *   a recomputation (a file's time alone does not say the day was computed
 *   again);
 * - `later`: a scheduled day whose file was written well after its 00:40
 *   UTC run (a retry or a rerun);
 * - null: the file is the day's scheduled run, or says nothing either way.
 */
type DayRunNote =
  | { readonly kind: "firstRun" }
  | { readonly kind: "recomputed"; readonly generatedAt: string }
  | { readonly kind: "rewritten"; readonly generatedAt: string }
  | { readonly kind: "later"; readonly generatedAt: string };

/** Whether a file names a build other than the first runs' (by commit prefix). */
function namesOtherBuilds(builds: DayBuilds | null): boolean {
  if (builds === null) {
    return false;
  }
  // A commit the file states as `unknown` names no build either way.
  const other = (commit: string | null, first: readonly string[]) =>
    commit !== null &&
    /^[0-9a-f]{7}/.test(commit) &&
    !first.some((build) => commit.startsWith(build));
  return (
    other(builds.rust, FIRST_RUN_BUILDS.rust) ||
    other(builds.python, FIRST_RUN_BUILDS.python)
  );
}

export function dayRunNote(
  date: string,
  generatedAt: string | null,
  builds: DayBuilds | null = null
): DayRunNote | null {
  const written = generatedAt === null ? Number.NaN : Date.parse(generatedAt);
  const known = generatedAt !== null && !Number.isNaN(written);
  if (date < FIRST_REPORT_DATE) {
    if (!known || generatedAt.slice(0, 10) <= FIRST_RUN_DATE) {
      return { kind: "firstRun" };
    }
    return namesOtherBuilds(builds)
      ? { kind: "recomputed", generatedAt }
      : { kind: "rewritten", generatedAt };
  }
  if (!known) {
    return null;
  }
  const scheduled =
    Date.parse(`${date}T00:00:00Z`) + SCHEDULED_RUN_MINUTES * 60_000;
  return written - scheduled > LATE_AFTER_MS
    ? { kind: "later", generatedAt }
    : null;
}

/** Whether the first daily report should exist by now. */
export function reportsAreLate(now: Date): boolean {
  const first = cycleDayOfDate(FIRST_REPORT_DATE);
  return first !== null && utcCycleDay(now) > first;
}

/** How the page shows a day's verdict. */
type VerdictState =
  | "equal"
  | "explained"
  | "investigating"
  | "mismatch"
  | "liveUnavailable"
  | "pending"
  | "unknown";

/**
 * The daily job's verdict as a page state. `OK` is "equal" when no record
 * differs and "explained" when records differ and each has a known cause.
 * Whether records differ comes from the counts, never from a list of records.
 * The plain names of the first data contract are still accepted.
 */
export function verdictState(
  verdict: string,
  hasDifferences: boolean
): VerdictState {
  switch (verdict) {
    case "OK":
      return hasDifferences ? "explained" : "equal";
    case "RUST_PYTHON_MISMATCH":
    case "mismatch":
      return "mismatch";
    case "LIVE_UNAVAILABLE":
      return "liveUnavailable";
    case "LIVE_UNEXPLAINED":
    case "investigating":
      return "investigating";
    case "equal":
    case "explained":
    case "pending":
      return verdict;
    default:
      return "unknown";
  }
}

/** Whether an index entry has any identity that differs from 6529.io. */
function indexDayHasDifferences(day: VerificationIndexDay): boolean {
  return (
    day.identitiesEqual !== null &&
    day.identitiesTotal !== null &&
    day.identitiesEqual < day.identitiesTotal
  );
}

export function indexDayVerdict(day: VerificationIndexDay): VerdictState {
  return verdictState(day.verdict, indexDayHasDifferences(day));
}

type ClassCounts = Record<DifferenceClass, number>;

/** A day's differences as the page shows them: counts only, never records. */
interface DayDifferences {
  /** Identity and wallet records that differ anywhere. */
  readonly identities: number;
  readonly wallets: number;
  /** Null when the day's file carries no class counts. */
  readonly byClass: ClassCounts | null;
  readonly byCause: ReadonlyArray<{
    readonly cause: string;
    readonly count: number;
  }>;
  readonly rustVsLive: number | null;
  readonly pythonVsLive: number | null;
  /** The Rust core's total minus the Python reference's: the same sign. */
  readonly rustVsPython: number | null;
}

function differing(
  agreement: VerificationDay["agreement"]["rustVsLive"],
  kind: "identities" | "wallets"
): number {
  if (agreement === null) {
    return 0;
  }
  return kind === "identities"
    ? agreement.identitiesTotal - agreement.identitiesEqual
    : agreement.walletsTotal - agreement.walletsEqual;
}

/**
 * The day's differences: the job's `differenceSummary` when the file has it.
 * Otherwise the agreement counts give a floor: records that differ from
 * 6529.io or from Python, whichever is more.
 */
export function dayDifferences(day: VerificationDay): DayDifferences {
  const live = day.implementations.live?.totalTdh ?? null;
  const python = day.implementations.python?.totalTdh ?? null;
  const totalRustVsPython =
    python === null ? null : day.implementations.rust.totalTdh - python;
  const summary = day.differenceSummary;
  if (summary !== null) {
    return {
      identities: summary.identities,
      wallets: summary.wallets,
      byClass: { ...summary.byClass },
      byCause: Object.entries(summary.byCause)
        .filter(([, value]) => value > 0)
        .map(([cause, value]) => ({ cause, count: value }))
        .sort(
          (left, right) =>
            right.count - left.count || left.cause.localeCompare(right.cause)
        ),
      rustVsLive: summary.totalTdhDelta.rustVsLive,
      pythonVsLive: summary.totalTdhDelta.pythonVsLive,
      rustVsPython: totalRustVsPython,
    };
  }
  const { rustVsLive, rustVsPython } = day.agreement;
  return {
    identities: Math.max(
      differing(rustVsLive, "identities"),
      differing(rustVsPython, "identities")
    ),
    wallets: Math.max(
      differing(rustVsLive, "wallets"),
      differing(rustVsPython, "wallets")
    ),
    byClass: null,
    byCause: [],
    rustVsLive: totalDelta(day.implementations.rust.totalTdh, live),
    pythonVsLive: python === null || live === null ? null : python - live,
    rustVsPython: totalRustVsPython,
  };
}

/**
 * Whether any record differs on a day: from the summary's counts and from
 * the agreement counts, so a day with differences can never read as equal.
 */
export function dayHasDifferences(day: VerificationDay): boolean {
  const counts = dayDifferences(day);
  const { rustVsLive, rustVsPython } = day.agreement;
  return (
    counts.identities + counts.wallets > 0 ||
    differing(rustVsLive, "identities") + differing(rustVsLive, "wallets") >
      0 ||
    differing(rustVsPython, "identities") + differing(rustVsPython, "wallets") >
      0
  );
}

export function dayVerdict(day: VerificationDay): VerdictState {
  return verdictState(day.verdict, dayHasDifferences(day));
}

/**
 * The cutover as the pages show it. D132 plans it for about a date, never on
 * one, so the pages show the date with "about" and never count the days.
 */
type CutoverState =
  | {
      readonly kind: "countdown";
      readonly plannedDate: string;
    }
  | { readonly kind: "due"; readonly plannedDate: string }
  | {
      readonly kind: "done";
      readonly plannedDate: string;
      readonly cycleDay: number | null;
    };

/** Today's UTC cycle day: the number of whole days since 1970-01-01 UTC. */
export function utcCycleDay(now: Date): number {
  return Math.floor(now.getTime() / 86_400_000);
}

export function cutoverState(
  cutover: VerificationCutover | null | undefined,
  now: Date
): CutoverState {
  const value = cutover ?? DEFAULT_CUTOVER;
  if (value.status === "done") {
    return {
      kind: "done",
      plannedDate: value.plannedDate,
      cycleDay: value.cycleDay ?? null,
    };
  }
  const plannedDay = cycleDayOfDate(value.plannedDate);
  const today = utcCycleDay(now);
  if (plannedDay === null || today >= plannedDay) {
    return { kind: "due", plannedDate: value.plannedDate };
  }
  return { kind: "countdown", plannedDate: value.plannedDate };
}

/** Days of the index, newest first. */
function sortedIndexDays(index: VerificationIndex): VerificationIndexDay[] {
  return [...index.days].sort((left, right) => right.cycleDay - left.cycleDay);
}

export function latestIndexDay(
  index: VerificationIndex
): VerificationIndexDay | null {
  return sortedIndexDays(index)[0] ?? null;
}

interface DayNeighbours {
  readonly previous: number | null;
  readonly next: number | null;
  readonly latest: number | null;
}

export function dayNeighbours(
  index: VerificationIndex,
  cycleDay: number
): DayNeighbours {
  const days = sortedIndexDays(index).map((day) => day.cycleDay);
  const older = days.filter((day) => day < cycleDay);
  const newer = days.filter((day) => day > cycleDay);
  return {
    previous: older[0] ?? null,
    next: newer.at(-1) ?? null,
    latest: days[0] ?? null,
  };
}

/** Cycle days missing between the oldest and the newest report. */
export function missingCycleDays(
  index: VerificationIndex,
  limit = 60
): number[] {
  const present = new Set(index.days.map((day) => day.cycleDay));
  const days = [...present].sort((left, right) => left - right);
  const first = days[0];
  const last = days.at(-1);
  if (first === undefined || last === undefined) {
    return [];
  }
  const missing: number[] = [];
  for (let day = first + 1; day < last && missing.length < limit; day += 1) {
    if (!present.has(day)) {
      missing.push(day);
    }
  }
  return missing;
}

type Freshness =
  | { readonly kind: "current"; readonly latest: number }
  | {
      readonly kind: "late";
      readonly latest: number;
      readonly missing: number;
    };

/**
 * Whether the latest report is current. Cycle N closes at 00:00 UTC of its
 * date and its report normally follows within a few hours, so a report more
 * than 30 hours past its own boundary means at least one day is missing.
 */
export function reportFreshness(latestCycleDay: number, now: Date): Freshness {
  const boundaryMs = latestCycleDay * 86_400_000;
  const hoursSince = (now.getTime() - boundaryMs) / 3_600_000;
  if (hoursSince <= 30) {
    return { kind: "current", latest: latestCycleDay };
  }
  return {
    kind: "late",
    latest: latestCycleDay,
    missing: Math.max(utcCycleDay(now) - latestCycleDay, 1),
  };
}

/** The share of equal records, or null when there are no records. */
export function agreementShare(equal: number, total: number): number | null {
  return total > 0 ? equal / total : null;
}

/**
 * The "differenceSentence" key for the overview strip and cards: no
 * differences, all explained, or some under investigation.
 */
export function differenceSentenceKind(
  verdict: VerdictState,
  differenceCount: number
):
  | "none"
  | "explained"
  | "investigating"
  | "mismatch"
  | "liveUnavailable"
  | "pending"
  | "unknown" {
  if (verdict === "pending" || verdict === "liveUnavailable") {
    return verdict;
  }
  if (verdict === "mismatch") {
    return "mismatch";
  }
  if (verdict === "investigating") {
    return "investigating";
  }
  if (differenceCount === 0) {
    return verdict === "unknown" ? "unknown" : "none";
  }
  if (verdict === "explained") {
    return "explained";
  }
  return "unknown";
}

/** Rust minus 6529.io, or null when 6529.io has not published a value. */
export function totalDelta(
  rust: number,
  live: number | null | undefined
): number | null {
  return live === null || live === undefined ? null : rust - live;
}
