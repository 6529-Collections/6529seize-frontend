import { z } from "zod";
import { cycleDayOfDate } from "@/lib/tdh/tdhV1Arithmetic";

/**
 * The public TDH verification files, published every day by 6529's daily
 * comparison job (`tools/tdh-daily/publish_feed.py` in the validator code):
 * `index.json` and `days/{cycleDay}.json`. Fields beyond the schema are
 * ignored, and the optional additions (nullable values, the `cutover` block,
 * the provenance fields) let the page render every state of the job's feed.
 *
 * Holders are never named. A label is `holder-<n>` for an identity or
 * `holder-<n>/w<m>` for one of its wallets, and a file whose label, cause or
 * field name could carry anything else is rejected whole.
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

/**
 * The verdicts the daily job publishes. `OK` means every difference from
 * 6529.io is explained; the other three each raise an alarm.
 */
export const FEED_VERDICTS = [
  "OK",
  "RUST_PYTHON_MISMATCH",
  "LIVE_UNAVAILABLE",
  "LIVE_UNEXPLAINED",
] as const;

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
    /** Rust against 6529.io; null when 6529.io's files were not compared. */
    identitiesEqual: nullish(count),
    identitiesTotal: nullish(count),
    totalTdh,
  })
  .refine((day) => cycleDayOfDate(day.date) === day.cycleDay, {
    message: "cycleDay and date disagree",
  })
  .refine(
    (day) =>
      day.identitiesEqual === null ||
      day.identitiesTotal === null ||
      day.identitiesEqual <= day.identitiesTotal,
    { message: "more equal identities than identities" }
  );

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
const hash32 = z.string().regex(/^0x[0-9a-f]{64}$/);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/);
const arweaveSource = z.string().regex(/^arweave:[A-Za-z0-9_-]{43}$/);
const ruleVersion = z.string().regex(/^tdh-v\d{1,3}\.\d{1,3}$/);

const implementation = z.object({
  commit: nullish(hexCommit),
  totalTdh: tdhValue,
  identities: count,
  wallets: count,
  cycleRoot: nullish(hash32),
  walletRoot: nullish(hash32),
  historyRoot: nullish(hash32),
  runtimeMs: nullish(count),
  /** Whether this run netted each transaction's movements (P26 §7.1, D131). */
  transactionNetting: nullish(z.boolean()),
});

const live = z.object({
  source: nullish(arweaveSource),
  sources: nullish(
    z.object({
      identity: nullish(arweaveSource),
      wallet: nullish(arweaveSource),
    })
  ),
  totalTdh: nullish(tdhValue),
  identities: nullish(count),
  wallets: nullish(count),
  /** SHA-256 of 6529.io's identity upload, as the comparison read it. */
  sha256: nullish(sha256),
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

const RECORD_FIELD = /^[a-z][a-z0-9_]{0,40}$/;
const TOKEN_FIELD = /^[a-z][a-z0-9_]{0,40}#\d{1,24}\.[a-z][a-z0-9_]{0,31}$/;

/**
 * A compared field, under the name 6529.io's upload uses: `boosted_tdh`,
 * `tdh__raw`, a collection's `memes_tdh`, or a token's `memes#208.tdh`.
 */
export function isDifferenceField(name: string): boolean {
  return RECORD_FIELD.test(name) || TOKEN_FIELD.test(name);
}

const differenceField = z.object({
  name: z.string().max(80).refine(isDifferenceField, "invalid field name"),
  rust: nullish(tdhValue),
  python: nullish(tdhValue),
  live: nullish(tdhValue),
});

export const DIFFERENCE_CLASSES = ["A", "B", "C", "D"] as const;
export type DifferenceClass = (typeof DIFFERENCE_CLASSES)[number];

const HOLDER_IDENTITY = /^holder-\d{1,6}$/;
const HOLDER_WALLET = /^holder-\d{1,6}\/w\d{1,3}$/;

/** `holder-N` for an identity, `holder-N/wM` for one of its wallets. */
export function isHolderLabel(label: string): boolean {
  return HOLDER_IDENTITY.test(label) || HOLDER_WALLET.test(label);
}

const difference = z.object({
  label: z.string().max(20).refine(isHolderLabel, "invalid holder label"),
  kind: z.enum(["identity", "wallet"]),
  fields: z.array(differenceField).max(256),
  class: z.enum(DIFFERENCE_CLASSES),
  cause: nullish(z.string().regex(/^[A-Z]{2,8}-\d{1,4}$/)),
});

export const verificationDaySchema = z
  .object({
    cycleDay,
    date: calendarDate,
    cutoffBlock: z.number().int().positive().max(MAX_TDH),
    /** Optional provenance (P26 §4.2, §9): what the result binds. */
    cutoffBlockHash: nullish(hash32),
    cutoffTimestamp: nullish(z.number().int().positive().max(MAX_TDH)),
    ruleVersion: nullish(ruleVersion),
    registryHash: nullish(hash32),
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

export type VerificationIndexInput = z.input<typeof verificationIndexSchema>;
export type VerificationDayInput = z.input<typeof verificationDaySchema>;
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
export type VerificationDifferenceField =
  VerificationDifference["fields"][number];

export function parseVerificationIndex(value: unknown) {
  return verificationIndexSchema.safeParse(value);
}

export function parseVerificationDay(value: unknown) {
  return verificationDaySchema.safeParse(value);
}
