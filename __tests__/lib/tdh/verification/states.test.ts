import {
  DEFAULT_CUTOVER,
  agreementShare,
  cutoverState,
  dayDifferences,
  dayHasDifferences,
  dayRunNote,
  dayNeighbours,
  dayVerdict,
  differenceSentenceKind,
  indexDayVerdict,
  latestIndexDay,
  missingCycleDays,
  reportFreshness,
  reportsAreLate,
  totalDelta,
  utcCycleDay,
  verdictState,
} from "@/lib/tdh/verification/states";
import { syntheticDay, syntheticEqualDay, syntheticIndex } from "./fixtures";

describe("verification states", () => {
  it("maps the daily job's verdicts and the plain names, and keeps unknown ones neutral", () => {
    expect(verdictState("OK", false)).toBe("equal");
    expect(verdictState("OK", true)).toBe("explained");
    expect(verdictState("RUST_PYTHON_MISMATCH", true)).toBe("mismatch");
    expect(verdictState("LIVE_UNAVAILABLE", false)).toBe("liveUnavailable");
    expect(verdictState("LIVE_UNEXPLAINED", true)).toBe("investigating");
    expect(
      ["equal", "explained", "investigating", "mismatch", "pending"].map(
        (verdict) => verdictState(verdict, true)
      )
    ).toEqual(["equal", "explained", "investigating", "mismatch", "pending"]);
    expect(verdictState("UNDER_REVIEW", false)).toBe("unknown");
    const [equalDay, differingDay] = syntheticIndex().days;
    expect(equalDay && indexDayVerdict(equalDay)).toBe("equal");
    expect(differingDay && indexDayVerdict(differingDay)).toBe("investigating");
  });

  it("plans the cutover for about a date and never counts the days (D132: about October 23)", () => {
    expect(
      cutoverState(DEFAULT_CUTOVER, new Date("2026-10-15T12:00:00Z"))
    ).toEqual({ kind: "countdown", plannedDate: "2026-10-23" });
    expect(cutoverState(null, new Date("2026-10-22T23:59:59Z"))).toEqual({
      kind: "countdown",
      plannedDate: "2026-10-23",
    });
  });

  it("says which run wrote a day's file, from the file itself", () => {
    // The first two days: first computed on October 15, and recomputed
    // when a later file says so.
    expect(dayRunNote("2026-10-14", null)).toEqual({ kind: "firstRun" });
    expect(dayRunNote("2026-10-15", "2026-10-15T14:59:00Z")).toEqual({
      kind: "firstRun",
    });
    expect(dayRunNote("2026-10-14", "2026-10-16T15:59:06Z")).toEqual({
      kind: "recomputed",
      generatedAt: "2026-10-16T15:59:06Z",
    });
    // A scheduled day: nothing near its 00:40 UTC run, a note well after.
    expect(dayRunNote("2026-10-17", "2026-10-17T00:55:00Z")).toBeNull();
    expect(dayRunNote("2026-10-17", null)).toBeNull();
    expect(dayRunNote("2026-10-16", "2026-10-16T15:59:14Z")).toEqual({
      kind: "later",
      generatedAt: "2026-10-16T15:59:14Z",
    });
  });

  it("marks the cutover due from 00:00 UTC on the planned day until the data says done", () => {
    expect(
      cutoverState(DEFAULT_CUTOVER, new Date("2026-10-23T00:00:00Z"))
    ).toEqual({
      kind: "due",
      plannedDate: "2026-10-23",
    });
    // 22 October 23:30 in New York is already 23 October in UTC.
    expect(
      cutoverState(DEFAULT_CUTOVER, new Date("2026-10-22T23:30:00-04:00")).kind
    ).toBe("due");
    expect(
      cutoverState(DEFAULT_CUTOVER, new Date("2026-11-01T00:00:00Z")).kind
    ).toBe("due");
  });

  it("reports a completed cutover with its cycle", () => {
    expect(
      cutoverState(
        { plannedDate: "2026-10-23", status: "done", cycleDay: 20_749 },
        new Date("2026-10-30T00:00:00Z")
      )
    ).toEqual({ kind: "done", plannedDate: "2026-10-23", cycleDay: 20_749 });
  });

  it("finds the latest day, a day's neighbours and the days with no report", () => {
    const index = syntheticIndex();
    expect(latestIndexDay(index)?.cycleDay).toBe(20_741);
    expect(dayNeighbours(index, 20_741)).toEqual({
      previous: 20_740,
      next: null,
      latest: 20_741,
    });
    expect(dayNeighbours(index, 20_740)).toEqual({
      previous: null,
      next: 20_741,
      latest: 20_741,
    });
    expect(
      latestIndexDay({ days: [], cutover: null, generatedAt: null })
    ).toBeNull();
    expect(missingCycleDays(index)).toEqual([]);
    const [first] = index.days;
    expect(
      missingCycleDays({
        ...index,
        days: [
          ...index.days,
          { ...first!, cycleDay: 20_744, date: "2026-10-18" },
        ],
      })
    ).toEqual([20_742, 20_743]);
  });

  it("says when the latest report is late, and when reports should have started", () => {
    expect(reportFreshness(20_741, new Date("2026-10-15T20:00:00Z"))).toEqual({
      kind: "current",
      latest: 20_741,
    });
    expect(reportFreshness(20_741, new Date("2026-10-17T12:00:00Z"))).toEqual({
      kind: "late",
      latest: 20_741,
      missing: 2,
    });
    expect(reportsAreLate(new Date("2026-10-16T12:00:00Z"))).toBe(false);
    expect(reportsAreLate(new Date("2026-10-17T00:00:00Z"))).toBe(true);
  });

  it("reads a day's differences from the job's counts, never from a list of records", () => {
    expect(dayDifferences(syntheticDay())).toEqual({
      identities: 1,
      wallets: 1,
      byClass: { A: 0, B: 0, C: 0, D: 2 },
      byCause: [{ cause: "unexplained", count: 2 }],
      rustVsLive: -120,
      pythonVsLive: -120,
      rustVsPython: 0,
    });
    expect(dayHasDifferences(syntheticDay())).toBe(true);
    expect(dayVerdict(syntheticDay())).toBe("investigating");
    expect(dayHasDifferences(syntheticEqualDay())).toBe(false);
    expect(dayVerdict(syntheticEqualDay())).toBe("equal");
  });

  it("never reads a day as equal while the counts say records differ", () => {
    const withoutSummary = syntheticDay({
      verdict: "OK",
      differenceSummary: null,
    });
    expect(dayHasDifferences(withoutSummary)).toBe(true);
    expect(dayVerdict(withoutSummary)).toBe("explained");
    expect(dayDifferences(withoutSummary)).toMatchObject({
      identities: 1,
      wallets: 1,
      byClass: null,
      rustVsLive: -120,
    });
    const zeroSummary = syntheticEqualDay({
      agreement: syntheticDay().agreement,
    });
    expect(dayHasDifferences(zeroSummary)).toBe(true);
  });

  it("chooses the overview's difference sentence", () => {
    expect(differenceSentenceKind("equal", 0)).toBe("none");
    expect(differenceSentenceKind("investigating", 0)).toBe("investigating");
    expect(differenceSentenceKind("explained", 2)).toBe("explained");
    expect(differenceSentenceKind("investigating", 3)).toBe("investigating");
    expect(differenceSentenceKind("mismatch", 0)).toBe("mismatch");
    expect(differenceSentenceKind("liveUnavailable", 0)).toBe(
      "liveUnavailable"
    );
    expect(differenceSentenceKind("pending", 0)).toBe("pending");
    expect(differenceSentenceKind("unknown", 4)).toBe("unknown");
  });

  it("computes shares, deltas and the UTC cycle day", () => {
    expect(agreementShare(10_280, 10_282)).toBeCloseTo(0.999805, 6);
    expect(agreementShare(0, 0)).toBeNull();
    expect(totalDelta(2_073_214_694, 2_073_214_934)).toBe(-240);
    expect(totalDelta(1, null)).toBeNull();
    expect(utcCycleDay(new Date("2026-10-15T00:00:00Z"))).toBe(20_741);
  });
});
