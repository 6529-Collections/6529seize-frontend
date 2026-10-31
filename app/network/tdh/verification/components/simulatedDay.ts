import {
  DIFFERENCE_CLASSES,
  parseVerificationDay,
  type DifferenceClass,
  type VerificationDay,
} from "@/lib/tdh/verification/schema";
import spec from "./simulatedDay.json";

/**
 * Show a day that fails (TDH-DESIGN.md §5.10): the latest real day's file
 * with a constructed disagreement written in. 6529.io is short on two
 * identities and their wallets by 118 TDH, a difference of class D with no
 * known cause, so the day's verdict is LIVE_UNEXPLAINED and an alarm is
 * raised. Every sum stays valid against the feed's schema: the result is
 * parsed by the same schema as a published day, or there is no simulation.
 */
export interface SimulatedDay {
  /** The constructed day file, parsed by the feed's schema. */
  readonly day: VerificationDay;
  /** Identities on which 6529.io differs. */
  readonly differ: number;
  /** Identities compared. */
  readonly identities: number;
  /** 6529.io's total, short by `lowerBy`. */
  readonly liveTotal: number;
  readonly lowerBy: number;
  readonly differenceClass: DifferenceClass;
  /** When the alarm was raised: the snapshot plus the fixture's minutes. */
  readonly detectedAt: string;
  /** Incident steps reached: detected, classed, investigating. */
  readonly stepsReached: number;
}

function isDifferenceClass(value: string): value is DifferenceClass {
  return (DIFFERENCE_CLASSES as readonly string[]).includes(value);
}

/** The constructed failing day, or null when the real day has no 6529.io upload to differ from. */
export function simulateFailingDay(real: VerificationDay): SimulatedDay | null {
  const live = real.implementations.live;
  const agreement = real.agreement.rustVsLive;
  if (
    live?.totalTdh === null ||
    live?.totalTdh === undefined ||
    !agreement ||
    !isDifferenceClass(spec.class)
  ) {
    return null;
  }
  const rust = real.implementations.rust.totalTdh;
  const python = real.implementations.python?.totalTdh ?? null;
  const liveTotal = rust - spec.liveLowerBy;
  const records = spec.identities + spec.wallets;
  const byClass: Record<DifferenceClass, number> = { A: 0, B: 0, C: 0, D: 0 };
  byClass[spec.class] = records;
  const parsed = parseVerificationDay({
    ...real,
    verdict: spec.verdict,
    implementations: {
      ...real.implementations,
      live: { ...live, totalTdh: liveTotal },
    },
    agreement: {
      ...real.agreement,
      rustVsLive: {
        identitiesEqual: agreement.identitiesTotal - spec.identities,
        identitiesTotal: agreement.identitiesTotal,
        walletsEqual: agreement.walletsTotal - spec.wallets,
        walletsTotal: agreement.walletsTotal,
      },
    },
    differenceSummary: {
      identities: spec.identities,
      wallets: spec.wallets,
      byClass,
      byCause: { [spec.cause]: records },
      totalTdhDelta: {
        rustVsLive: rust - liveTotal,
        pythonVsLive: python === null ? null : python - liveTotal,
      },
    },
  });
  if (!parsed.success) {
    return null;
  }
  const detected = new Date(
    Date.parse(`${real.date}T00:00:00Z`) + spec.detectedAfterMinutes * 60_000
  );
  return {
    day: parsed.data,
    differ: spec.identities,
    identities: agreement.identitiesTotal,
    liveTotal,
    lowerBy: spec.liveLowerBy,
    differenceClass: spec.class,
    detectedAt: detected.toISOString().replace(".000Z", "Z"),
    stepsReached: spec.incidentStepsReached,
  };
}
