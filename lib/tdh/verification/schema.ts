import { z } from "zod";
import { cycleDayOfDate } from "@/components/explained/engine/tdh";

/**
 * The public TDH verification files, published every day by 6529's daily
 * comparison job (`tools/tdh-daily/publish_feed.py` in the validator code):
 * `index.json` and `days/{cycleDay}.json`. Fields beyond the schema are
 * ignored.
 *
 * Holders are never named, and no record is ever published. The job gives a
 * day's differences only as aggregates (`differenceSummary`): counts by class
 * and by cause, and the totals' differences. Its `differences` list is always
 * empty, because one differing token can single its holder out; this schema
 * does not read it, so nothing per record can ever reach the page.
 */

const MAX_TDH = Number.MAX_SAFE_INTEGER;

const tdhValue = z.number().int().nonnegative().max(MAX_TDH);
const count = z.number().int().nonnegative().max(MAX_TDH);
const signedTdh = z.number().int().min(-MAX_TDH).max(MAX_TDH);
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => cycleDayOfDate(value) !== null, "invalid date");
const cycleDay = z.number().int().positive().max(1_000_000);
/**
 * When the feed wrote a file, and a file's SHA-256, as the publisher is
 * adding them (`generatedAt`, `sha256`): optional, shown in Provenance when
 * present, and never required.
 */
const timestamp = z
  .string()
  .max(40)
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.\dZ+:-]{1,16}$/)
  .refine((value) => !Number.isNaN(Date.parse(value)), "invalid time");
const fileSha256 = z.string().regex(/^[0-9a-f]{64}$/);
const nullish = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .nullish()
    .transform(
      (value): z.infer<T> | null => (value ?? null) as z.infer<T> | null
    );

/**
 * The verdict the daily job publishes: `OK` means every difference from
 * 6529.io, if any, is known and explained; `RUST_PYTHON_MISMATCH`,
 * `LIVE_UNAVAILABLE` and `LIVE_UNEXPLAINED` each raise an alarm. Unknown
 * strings are kept and shown as a neutral "See details" state.
 */
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
    /** When the day's file was written, and its SHA-256, if the index says. */
    generatedAt: nullish(timestamp),
    sha256: nullish(fileSha256),
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

/**
 * An optional statement that 6529.io has switched to the Rust result. The
 * daily job does not write it today; the page only shows "switched" when a
 * published file says so, and otherwise counts down to D132's planned date.
 */
const cutover = z.object({
  plannedDate: calendarDate,
  status: z.enum(["planned", "done"]),
  cycleDay: nullish(cycleDay),
});

export const verificationIndexSchema = z.object({
  days: z.array(indexDay).max(10_000),
  cutover: nullish(cutover),
  /** When the index was written, if it says. */
  generatedAt: nullish(timestamp),
});

/**
 * A code version as the job writes it (`publish_feed.py` COMMIT): a full
 * commit, a commit with `+wip` when the tree had local changes, or
 * `unknown`. Shorter plain commits are accepted too.
 */
const codeCommit = z.string().regex(/^(?:[0-9a-f]{7,40}(?:\+wip)?|unknown)$/);
const hash32 = z.string().regex(/^0x[0-9a-f]{64}$/);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/);
const arweaveSource = z.string().regex(/^arweave:[A-Za-z0-9_-]{43}$/);
const ruleVersion = z.string().regex(/^tdh-v\d{1,3}\.\d{1,3}$/);

const implementation = z.object({
  commit: nullish(codeCommit),
  /** What the run states it computed by, when it states it. */
  ruleVersion: nullish(ruleVersion),
  ruleId: nullish(hash32),
  registryHash: nullish(hash32),
  /** SHA-256 of the program the run executed (the Rust core's binary). */
  binarySha256: nullish(sha256),
  totalTdh: tdhValue,
  identities: count,
  wallets: count,
  cycleRoot: nullish(hash32),
  walletRoot: nullish(hash32),
  historyRoot: nullish(hash32),
  /** Why an implementation has no roots (the Python reference). */
  rootsNote: nullish(z.string().min(1).max(400)),
  runtimeMs: nullish(count),
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

/**
 * The files a run read and wrote, by SHA-256: the canonical input both new
 * programs computed from, and the identity and wallet record files each
 * wrote. Equal hashes mean byte-identical files.
 */
const runFiles = z.object({
  canonicalInputSha256: nullish(sha256),
  identitiesSha256: nullish(sha256),
  walletsSha256: nullish(sha256),
});

/** One of 6529.io's uploads, with the SHA-256 of the file as read. */
const liveFile = z.object({
  source: nullish(arweaveSource),
  sha256: nullish(sha256),
});

const daySources = z.object({
  rust: nullish(runFiles),
  python: nullish(runFiles),
  live: nullish(
    z.object({
      identity: nullish(liveFile),
      wallet: nullish(liveFile),
    })
  ),
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

export const DIFFERENCE_CLASSES = ["A", "B", "C", "D"] as const;
export type DifferenceClass = (typeof DIFFERENCE_CLASSES)[number];

/**
 * A known entry's cause: an item of P26's deviation list (`DEV-n`), a legacy
 * defect (`BUG-n`) or another P26 item kind, exactly as the job's
 * `publish_feed.py` CAUSE pattern allows.
 */
const CAUSE_ITEM = /^(?:DEV|BUG|SD|MS|CN|RP)-\d+$/;
const CAUSE_KEY_MAX = 64;

/**
 * A cause as the job writes it: a known entry's cause (`DEV-2`), several
 * joined by commas (`BUG-15,DEV-2`), `rust-python` or `unexplained`.
 */
export function isDifferenceCause(value: string): boolean {
  return (
    value === "rust-python" ||
    value === "unexplained" ||
    (value.length <= CAUSE_KEY_MAX &&
      value.split(",").every((part) => CAUSE_ITEM.test(part)))
  );
}

const differenceSummary = z.object({
  /** Identity and wallet records that differ anywhere. */
  identities: count,
  wallets: count,
  /** Every differing record counted once by its class (P38 §3.3.1). */
  byClass: z.object({ A: count, B: count, C: count, D: count }),
  /** The same records counted by cause; only the causes seen that day. */
  byCause: z
    .record(
      z.string().max(CAUSE_KEY_MAX).refine(isDifferenceCause, "invalid cause"),
      count
    )
    .refine((value) => Object.keys(value).length <= 32, "too many causes"),
  totalTdhDelta: z.object({
    rustVsLive: nullish(signedTdh),
    pythonVsLive: nullish(signedTdh),
  }),
});

const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0);

/**
 * The job's own invariant: the class counts, and the cause counts, each add
 * up to the differing identity and wallet records.
 */
const consistentDifferenceSummary = differenceSummary.refine(
  (value) => {
    const records = value.identities + value.wallets;
    return (
      sum(Object.values(value.byClass)) === records &&
      sum(Object.values(value.byCause)) === records
    );
  },
  { message: "class or cause counts do not add up to the differing records" }
);

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
    differenceSummary: nullish(consistentDifferenceSummary),
    /** The files each run read and wrote, by SHA-256, when stated. */
    sources: nullish(daySources),
    verdict,
    /** When the job wrote this file, and a SHA-256 it states, if present. */
    generatedAt: nullish(timestamp),
    sha256: nullish(fileSha256),
  })
  .refine((day) => cycleDayOfDate(day.date) === day.cycleDay, {
    message: "cycleDay and date disagree",
  });

export type VerificationIndexInput = z.input<typeof verificationIndexSchema>;
/** A day file as published; `differences` is the job's always-empty list. */
export type VerificationDayInput = z.input<typeof verificationDaySchema> & {
  readonly differences?: readonly unknown[];
};
export type VerificationIndex = z.infer<typeof verificationIndexSchema>;
export type VerificationIndexDay = VerificationIndex["days"][number];
export type VerificationCutover = NonNullable<VerificationIndex["cutover"]>;
export type VerificationDay = z.infer<typeof verificationDaySchema>;

export function parseVerificationIndex(value: unknown) {
  return verificationIndexSchema.safeParse(value);
}

export function parseVerificationDay(value: unknown) {
  return verificationDaySchema.safeParse(value);
}
