import { z } from "zod";
import { cycleDayOfDate } from "@/lib/tdh/tdhV1Arithmetic";

/**
 * The public TDH verification files, published every day by 6529's daily
 * comparison job: `index.json` and `days/{cycleDay}.json`. Fields beyond the
 * schema are ignored. Optional additions (nullable values, the `cutover`
 * block, the verdict values) let the job ship with the schema as first given
 * while the page still renders every state.
 *
 * Holders are never named. A label must be `holder-<n>`, and a file whose
 * label, cause or field name could carry anything else is rejected whole.
 */

const MAX_TDH = Number.MAX_SAFE_INTEGER;

const tdhValue = z.number().int().nonnegative().max(MAX_TDH);
const count = z.number().int().nonnegative().max(MAX_TDH);
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => cycleDayOfDate(value) !== null, "invalid date");
const cycleDay = z.number().int().positive().max(1_000_000);
const nullish = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .nullish()
    .transform(
      (value): z.infer<T> | null => (value ?? null) as z.infer<T> | null
    );

export const VERIFICATION_VERDICTS = [
  "equal",
  "explained",
  "investigating",
  "mismatch",
  "pending",
] as const;

export type KnownVerdict = (typeof VERIFICATION_VERDICTS)[number];

/** Unknown strings are kept and shown as a neutral "See details" state. */
const verdict = z.string().min(1).max(32);

const totalTdh = z.object({
  rust: tdhValue,
  python: nullish(tdhValue),
  live: nullish(tdhValue),
});

const indexDay = z
  .object({
    cycleDay,
    date: calendarDate,
    verdict,
    identitiesEqual: count,
    identitiesTotal: count,
    totalTdh,
  })
  .refine((day) => cycleDayOfDate(day.date) === day.cycleDay, {
    message: "cycleDay and date disagree",
  })
  .refine((day) => day.identitiesEqual <= day.identitiesTotal, {
    message: "more equal identities than identities",
  });

const cutover = z.object({
  plannedDate: calendarDate,
  status: z.enum(["planned", "done"]),
  cycleDay: nullish(cycleDay),
});

export const verificationIndexSchema = z.object({
  days: z.array(indexDay).max(10_000),
  cutover: nullish(cutover),
});

const hexCommit = z.string().regex(/^[0-9a-f]{7,40}$/);
const root = z.string().regex(/^0x[0-9a-f]{64}$/);
const liveSource = z.string().regex(/^arweave:[A-Za-z0-9_-]{43}$/);

const implementation = z.object({
  commit: nullish(hexCommit),
  totalTdh: tdhValue,
  identities: count,
  wallets: count,
  cycleRoot: nullish(root),
  walletRoot: nullish(root),
  historyRoot: nullish(root),
  runtimeMs: nullish(count),
});

const live = z.object({
  source: nullish(liveSource),
  totalTdh: nullish(tdhValue),
  identities: nullish(count),
  wallets: nullish(count),
});

const agreement = z
  .object({
    identitiesEqual: count,
    identitiesTotal: count,
    walletsEqual: count,
    walletsTotal: count,
  })
  .refine(
    (value) =>
      value.identitiesEqual <= value.identitiesTotal &&
      value.walletsEqual <= value.walletsTotal,
    { message: "more equal records than records" }
  );

const differenceField = z.object({
  name: z.string().regex(/^[a-z][A-Za-z0-9_]{0,31}$/),
  rust: nullish(tdhValue),
  python: nullish(tdhValue),
  live: nullish(tdhValue),
});

export const DIFFERENCE_CLASSES = ["A", "B", "C", "D"] as const;
export type DifferenceClass = (typeof DIFFERENCE_CLASSES)[number];

const difference = z.object({
  label: z.string().regex(/^holder-\d{1,6}$/),
  kind: z.enum(["identity", "wallet"]),
  fields: z.array(differenceField).max(64),
  class: z.enum(DIFFERENCE_CLASSES),
  cause: nullish(z.string().regex(/^[A-Z]{2,8}-\d{1,4}$/)),
});

export const verificationDaySchema = z
  .object({
    cycleDay,
    date: calendarDate,
    cutoffBlock: z.number().int().positive().max(MAX_TDH),
    mode: z.enum(["unchecked-history", "checked"]),
    implementations: z.object({
      rust: implementation,
      python: nullish(implementation),
      live: nullish(live),
    }),
    agreement: z.object({
      rustVsPython: nullish(agreement),
      rustVsLive: nullish(agreement),
    }),
    differences: z.array(difference).max(100_000),
    verdict,
  })
  .refine((day) => cycleDayOfDate(day.date) === day.cycleDay, {
    message: "cycleDay and date disagree",
  });

export type VerificationIndex = z.infer<typeof verificationIndexSchema>;
export type VerificationIndexDay = VerificationIndex["days"][number];
export type VerificationCutover = NonNullable<VerificationIndex["cutover"]>;
export type VerificationDay = z.infer<typeof verificationDaySchema>;
export type VerificationImplementation =
  VerificationDay["implementations"]["rust"];
export type VerificationLive = NonNullable<
  VerificationDay["implementations"]["live"]
>;
export type VerificationAgreement = NonNullable<
  VerificationDay["agreement"]["rustVsLive"]
>;
export type VerificationDifference = VerificationDay["differences"][number];

export function parseVerificationIndex(value: unknown) {
  return verificationIndexSchema.safeParse(value);
}

export function parseVerificationDay(value: unknown) {
  return verificationDaySchema.safeParse(value);
}
