import {
  LATEST_DAY_REVALIDATE_SECONDS,
  loadVerificationDay,
  loadVerificationIndex,
} from "./loadVerification.server";
import {
  cutoverState,
  differenceSentenceKind,
  latestIndexDay,
  verdictState,
  type VerdictState,
} from "./states";

/**
 * The latest day in a few plain numbers, for the overview's "Verified daily"
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
      readonly equal: number;
      readonly total: number;
      readonly differenceCount: number;
      readonly liveEqual: number;
      readonly liveTotal: number;
      readonly pythonEqual: number | null;
      readonly pythonTotal: number | null;
    };

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
    const python =
      dayLoad.status === "ok" ? dayLoad.day.agreement.rustVsPython : null;
    const pythonRan =
      dayLoad.status === "ok" && dayLoad.day.implementations.python !== null;
    const afterCutover =
      cutoverState(indexLoad.index.cutover, now).kind === "done";
    const verdict = verdictState(latest.verdict);
    const useRustPython = afterCutover && python !== null && pythonRan;
    const equal = useRustPython
      ? python.identitiesEqual
      : latest.identitiesEqual;
    const total = useRustPython
      ? python.identitiesTotal
      : latest.identitiesTotal;
    const differenceCount = total - equal;
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
      pythonEqual: pythonRan && python ? python.identitiesEqual : null,
      pythonTotal: pythonRan && python ? python.identitiesTotal : null,
    };
  } catch {
    return null;
  }
}
