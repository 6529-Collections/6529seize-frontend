import {
  LATEST_DAY_REVALIDATE_SECONDS,
  loadVerificationDay,
  loadVerificationIndex,
} from "./loadVerification.server";
import {
  cutoverState,
  differenceCases,
  differenceSentenceKind,
  indexDayHasDifferences,
  latestIndexDay,
  verdictState,
  type VerdictState,
} from "./states";

/**
 * The latest day in a few plain numbers, for the overview's "Checked daily"
 * strip and the implementations page's agreement card. Errors return null so
 * those pages never fail on the dashboard's account.
 */
export type VerificationSummary =
  | { readonly kind: "awaiting" }
  | {
      readonly kind: "data" | "sample";
      readonly cycleDay: number;
      readonly date: string;
      readonly verdict: VerdictState;
      readonly sentence: ReturnType<typeof differenceSentenceKind>;
      readonly afterCutover: boolean;
      /** Rust against 6529.io before the cutover, Rust against Python after. */
      readonly equal: number | null;
      readonly total: number | null;
      /** Holders that differ: an identity and its wallets count once. */
      readonly differenceCount: number;
      readonly liveEqual: number | null;
      readonly liveTotal: number | null;
      readonly pythonEqual: number | null;
      readonly pythonTotal: number | null;
      /** False when the day's runs did not net within a transaction (D131). */
      readonly netting: boolean | null;
    };

type DaySummaryInput = NonNullable<
  Awaited<ReturnType<typeof loadVerificationDay>>
>;

/** Rust against Python, when the Python reference ran that day. */
function pythonAgreement(dayLoad: DaySummaryInput) {
  if (dayLoad.status !== "ok" || dayLoad.day.implementations.python === null) {
    return null;
  }
  return dayLoad.day.agreement.rustVsPython;
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
    const day = dayLoad.status === "ok" ? dayLoad.day : null;
    const python = pythonAgreement(dayLoad);
    const afterCutover =
      cutoverState(indexLoad.index.cutover, now).kind === "done";
    const verdict = verdictState(
      latest.verdict,
      day ? day.differences.length > 0 : indexDayHasDifferences(latest)
    );
    const useRustPython = afterCutover && python !== null;
    const equal = useRustPython
      ? python.identitiesEqual
      : latest.identitiesEqual;
    const total = useRustPython
      ? python.identitiesTotal
      : latest.identitiesTotal;
    const differenceCount = day
      ? differenceCases(day.differences).length
      : Math.max((total ?? 0) - (equal ?? 0), 0);
    return {
      kind: indexLoad.source === "sample" ? "sample" : "data",
      cycleDay: latest.cycleDay,
      date: latest.date,
      verdict,
      sentence: differenceSentenceKind(verdict, differenceCount),
      afterCutover: useRustPython,
      equal,
      total,
      differenceCount,
      liveEqual: latest.identitiesEqual,
      liveTotal: latest.identitiesTotal,
      pythonEqual: python?.identitiesEqual ?? null,
      pythonTotal: python?.identitiesTotal ?? null,
      netting: day?.implementations.rust.transactionNetting ?? null,
    };
  } catch {
    return null;
  }
}
