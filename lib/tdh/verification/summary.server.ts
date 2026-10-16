import {
  LATEST_DAY_REVALIDATE_SECONDS,
  loadVerificationDay,
  loadVerificationIndex,
} from "./loadVerification.server";
import {
  cutoverState,
  dayDifferences,
  dayHasDifferences,
  differenceSentenceKind,
  indexDayHasDifferences,
  latestIndexDay,
  verdictState,
  type VerdictState,
} from "./states";
import type {
  VerificationDay,
  VerificationIndex,
  VerificationIndexDay,
} from "./schema";

/**
 * The latest day in a few plain numbers, for the overview's "Checked daily"
 * strip and the implementations page's agreement card. Errors return null so
 * those pages never fail on the dashboard's account.
 */
export type VerificationSummary =
  | { readonly kind: "awaiting" }
  | {
      readonly kind: "data";
      readonly cycleDay: number;
      readonly date: string;
      readonly verdict: VerdictState;
      readonly sentence: ReturnType<typeof differenceSentenceKind>;
      readonly afterCutover: boolean;
      /** Rust against 6529.io before the cutover, Rust against Python after. */
      readonly equal: number | null;
      readonly total: number | null;
      /** Identity records that differ anywhere, from the day's counts. */
      readonly differenceCount: number;
      readonly walletsEqual: number | null;
      readonly walletsTotal: number | null;
      readonly liveEqual: number | null;
      readonly liveTotal: number | null;
      readonly pythonEqual: number | null;
      readonly pythonTotal: number | null;
      /** Whether the Rust, Python and 6529.io totals were all equal. */
      readonly totalsEqual: boolean | null;
      /** The Rust core's total TDH, sinks included. */
      readonly rustTotal: number;
      /** Whether the day's history was checked; null without its file. */
      readonly historyChecked: boolean | null;
      /** The day's snapshot block; null without its file. */
      readonly cutoffBlock: number | null;
      /** The track record: every published day, and those equal everywhere. */
      readonly record: TrackRecord;
    };

/** How many published days there are, and on how many all three agreed. */
export interface TrackRecord {
  readonly days: number;
  /** Days whose verdict is OK with every identity and the totals equal. */
  readonly allEqual: number;
  /** The first published day's date (YYYY-MM-DD). */
  readonly firstDate: string;
}

/** The index's track record: days published, and days equal everywhere. */
function trackRecord(index: VerificationIndex): TrackRecord {
  const days = index.days;
  const allEqual = days.filter(
    (day) =>
      day.verdict === "OK" &&
      day.identitiesTotal !== null &&
      day.identitiesEqual === day.identitiesTotal &&
      day.totalTdh.python === day.totalTdh.rust &&
      day.totalTdh.live === day.totalTdh.rust
  ).length;
  const firstDate = days.reduce(
    (first, day) => (day.date < first ? day.date : first),
    days[0]?.date ?? ""
  );
  return { days: days.length, allEqual, firstDate };
}

type DataSummary = Extract<VerificationSummary, { kind: "data" }>;

/** The summary of the latest day, from its index entry and, when loaded, its file. */
function summarizeDay(
  latest: VerificationIndexDay,
  day: VerificationDay | null,
  afterCutoverDone: boolean,
  record: TrackRecord = { days: 1, allEqual: 0, firstDate: latest.date }
): DataSummary {
  const python =
    day !== null && day.implementations.python !== null
      ? day.agreement.rustVsPython
      : null;
  const live = day?.agreement.rustVsLive ?? null;
  const verdict = verdictState(
    latest.verdict,
    day ? dayHasDifferences(day) : indexDayHasDifferences(latest)
  );
  const useRustPython = afterCutoverDone && python !== null;
  const equal = useRustPython ? python.identitiesEqual : latest.identitiesEqual;
  const total = useRustPython ? python.identitiesTotal : latest.identitiesTotal;
  const differenceCount = day
    ? dayDifferences(day).identities
    : Math.max((total ?? 0) - (equal ?? 0), 0);
  const wallets = useRustPython ? python : live;
  const totals = latest.totalTdh;
  const totalsKnown = totals.python !== null && totals.live !== null;
  return {
    kind: "data",
    cycleDay: latest.cycleDay,
    date: latest.date,
    verdict,
    sentence: differenceSentenceKind(verdict, differenceCount),
    afterCutover: useRustPython,
    equal,
    total,
    differenceCount,
    walletsEqual: wallets?.walletsEqual ?? null,
    walletsTotal: wallets?.walletsTotal ?? null,
    liveEqual: latest.identitiesEqual,
    liveTotal: latest.identitiesTotal,
    pythonEqual: python?.identitiesEqual ?? null,
    pythonTotal: python?.identitiesTotal ?? null,
    totalsEqual: totalsKnown
      ? totals.rust === totals.python && totals.rust === totals.live
      : null,
    rustTotal: totals.rust,
    historyChecked: day === null ? null : day.mode === "checked",
    cutoffBlock: day?.cutoffBlock ?? null,
    record,
  };
}

export async function loadVerificationSummary(
  now: Date = new Date()
): Promise<VerificationSummary | null> {
  try {
    const indexLoad = await loadVerificationIndex();
    if (indexLoad.status === "awaiting") {
      return { kind: "awaiting" };
    }
    if (indexLoad.status !== "ok") {
      return null;
    }
    const latest = latestIndexDay(indexLoad.index);
    if (latest === null) {
      return { kind: "awaiting" };
    }
    const dayLoad = await loadVerificationDay(
      latest.cycleDay,
      LATEST_DAY_REVALIDATE_SECONDS
    );
    return summarizeDay(
      latest,
      dayLoad.status === "ok" ? dayLoad.day : null,
      cutoverState(indexLoad.index.cutover, now).kind === "done",
      trackRecord(indexLoad.index)
    );
  } catch {
    return null;
  }
}
