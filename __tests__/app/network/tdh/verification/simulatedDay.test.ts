import { simulateFailingDay } from "@/app/network/tdh/verification/components/simulatedDay";
import spec from "@/app/network/tdh/verification/components/simulatedDay.json";
import {
  checkStateOf,
  type CheckState,
} from "@/app/network/tdh/verification/components/dayModel";
import { parseVerificationDay } from "@/lib/tdh/verification/schema";
import { dayVerdict } from "@/lib/tdh/verification/states";
import { fixtureDay } from "./fixtureFeed";

function realDay(cycle: number) {
  const parsed = parseVerificationDay(fixtureDay(cycle));
  if (!parsed.success) {
    throw new Error(`fixture day ${cycle} does not parse`);
  }
  return parsed.data;
}

describe("the constructed failing day (TDH-DESIGN.md §5.10)", () => {
  it("is the latest real day with 6529.io short on two identities, every sum valid", () => {
    const real = realDay(20744);
    const sim = simulateFailingDay(real);
    expect(sim).not.toBeNull();
    if (sim === null) return;
    // It parses as a published day would, with the job's own invariants.
    expect(parseVerificationDay(sim.day).success).toBe(true);
    const { day } = sim;
    const rust = day.implementations.rust.totalTdh;
    const live = day.implementations.live?.totalTdh;
    expect(rust).toBe(real.implementations.rust.totalTdh);
    expect(live).toBe(rust - spec.liveLowerBy);
    expect(day.differenceSummary?.totalTdhDelta.rustVsLive).toBe(
      spec.liveLowerBy
    );
    const summary = day.differenceSummary;
    const records = (summary?.identities ?? 0) + (summary?.wallets ?? 0);
    expect(summary?.byClass.D).toBe(records);
    expect(summary?.byCause).toEqual({ unexplained: records });
    expect(day.agreement.rustVsLive).toEqual({
      identitiesEqual: 10_271,
      identitiesTotal: 10_273,
      walletsEqual: 11_124,
      walletsTotal: 11_126,
    });
    // The two programs still agree: only 6529.io differs.
    expect(day.agreement.rustVsPython).toEqual(real.agreement.rustVsPython);
    expect(dayVerdict(day)).toBe("investigating");
    expect(sim.detectedAt).toBe("2026-10-18T00:52:00Z");
    expect(sim.stepsReached).toBe(3);
  });

  it("has nothing to simulate on a day 6529.io's upload was not compared", () => {
    const real = realDay(20744);
    expect(
      simulateFailingDay({
        ...real,
        implementations: { ...real.implementations, live: null },
      })
    ).toBeNull();
  });
});

describe("a day's state, from its verdict and its counts", () => {
  const cases: [string, Parameters<typeof checkStateOf>[1], CheckState][] = [
    ["OK", { identitiesEqual: 10, identitiesTotal: 10 }, "equal"],
    ["OK", { identitiesEqual: 9, identitiesTotal: 10 }, "knownCause"],
    [
      "OK",
      {
        identitiesEqual: 10,
        identitiesTotal: 10,
        walletsEqual: 4,
        walletsTotal: 5,
      },
      "knownCause",
    ],
    [
      "OK",
      { identitiesEqual: 10, identitiesTotal: 10, differingRecords: 1 },
      "knownCause",
    ],
    [
      "LIVE_UNEXPLAINED",
      { identitiesEqual: 8, identitiesTotal: 10 },
      "liveDiffers",
    ],
    [
      "RUST_PYTHON_MISMATCH",
      { identitiesEqual: 10, identitiesTotal: 10 },
      "programsDiffer",
    ],
    [
      "LIVE_UNAVAILABLE",
      { identitiesEqual: null, identitiesTotal: null },
      "notCompared",
    ],
    [
      "OK_NO_LIVE",
      { identitiesEqual: null, identitiesTotal: null },
      "notCompared",
    ],
    ["SOMETHING_NEW", { identitiesEqual: 10, identitiesTotal: 10 }, "unknown"],
  ];
  it.each(cases)("%s with %j is %s", (verdict, counts, state) => {
    expect(checkStateOf(verdict, counts)).toBe(state);
  });
});
