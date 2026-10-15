import {
  DEFAULT_CUTOVER,
  agreementShare,
  cutoverState,
  dayNeighbours,
  differenceClassCounts,
  differenceSentenceKind,
  latestIndexDay,
  totalDelta,
  utcCycleDay,
  verdictState,
} from "@/lib/tdh/verification/states";
import { syntheticDay, syntheticIndex } from "./fixtures";

describe("verification states", () => {
  it("maps known verdicts and keeps unknown ones neutral", () => {
    expect(
      ["equal", "explained", "investigating", "mismatch", "pending"].map(
        verdictState
      )
    ).toEqual(["equal", "explained", "investigating", "mismatch", "pending"]);
    expect(verdictState("under-review")).toBe("unknown");
  });

  it("counts down to the cutover in whole UTC days", () => {
    expect(
      cutoverState(DEFAULT_CUTOVER, new Date("2026-10-15T12:00:00Z"))
    ).toEqual({
      kind: "countdown",
      days: 8,
      plannedDate: "2026-10-23",
    });
    expect(cutoverState(null, new Date("2026-10-22T23:59:59Z"))).toMatchObject({
      kind: "countdown",
      days: 1,
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

  it("finds the latest day and a day's neighbours", () => {
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
  });

  it("counts differences per class", () => {
    expect(differenceClassCounts(syntheticDay().differences)).toEqual({
      A: 1,
      B: 0,
      C: 0,
      D: 1,
    });
  });

  it("chooses the overview's difference sentence", () => {
    expect(differenceSentenceKind("equal", 0)).toBe("none");
    expect(differenceSentenceKind("explained", 2)).toBe("explained");
    expect(differenceSentenceKind("investigating", 3)).toBe("investigating");
    expect(differenceSentenceKind("mismatch", 0)).toBe("mismatch");
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
