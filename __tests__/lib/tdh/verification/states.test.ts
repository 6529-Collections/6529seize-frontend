import {
  DEFAULT_CUTOVER,
  agreementShare,
  cutoverState,
  dayNeighbours,
  differenceCases,
  differenceClassCounts,
  differenceSentenceKind,
  holderOf,
  indexDayVerdict,
  latestIndexDay,
  missingCycleDays,
  reportFreshness,
  reportsAreLate,
  totalDelta,
  utcCycleDay,
  verdictState,
} from "@/lib/tdh/verification/states";
import { syntheticDay, syntheticIndex } from "./fixtures";

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
    const [day] = syntheticIndex().days;
    expect(day && indexDayVerdict(day)).toBe("explained");
  });

  it("counts down to the cutover in whole UTC days, across the week from D132", () => {
    expect(
      cutoverState(DEFAULT_CUTOVER, new Date("2026-10-15T12:00:00Z"))
    ).toEqual({
      kind: "countdown",
      days: 8,
      plannedDate: "2026-10-23",
      elapsed: 0,
    });
    expect(cutoverState(null, new Date("2026-10-22T23:59:59Z"))).toMatchObject({
      kind: "countdown",
      days: 1,
      elapsed: 7 / 8,
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
    expect(latestIndexDay({ days: [], cutover: null })).toBeNull();
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

  it("counts differences per class and groups a holder's identity with its wallets", () => {
    const differences = syntheticDay().differences;
    expect(differenceClassCounts(differences)).toEqual({
      A: 2,
      B: 0,
      C: 0,
      D: 1,
    });
    expect(holderOf("holder-3/w2")).toBe("holder-3");
    const cases = differenceCases(differences);
    expect(cases.map((item) => item.holder)).toEqual(["holder-1", "holder-2"]);
    expect(cases[0]?.identity?.label).toBe("holder-1");
    expect(cases[0]?.wallets.map((wallet) => wallet.label)).toEqual([
      "holder-1/w1",
    ]);
    expect(cases[0]?.causes).toEqual(["DEV-2"]);
    expect(cases[1]?.identity).toBeNull();
    expect(cases[1]?.classes).toEqual(["D"]);
  });

  it("chooses the overview's difference sentence", () => {
    expect(differenceSentenceKind("equal", 0)).toBe("none");
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
