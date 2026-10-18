import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { LeanRound } from "../formal/leanRounds";
import TdhStatusPill from "../shared/TdhStatusPill";
import {
  formatCycleDate,
  shortCommit,
} from "../verification/components/verificationFormat";
import ProgramRow from "./ProgramRow";
import {
  knownBuild,
  P26,
  PROGRAM_CONFORMANCE,
  VALIDATOR_BUILD,
} from "../shared/tdhFacts";

/** The Lean model's vector run, from its proof manifest. */
interface LeanVectorRun {
  readonly passed: number;
  readonly total: number;
  readonly checks: number;
  /** The P26 commit the model's build follows, short. */
  readonly spec: string;
  /** The round of the model the published manifest records. */
  readonly round: LeanRound;
  /**
   * The newest round's own vector run, when the published manifest records
   * an earlier round: its passed and total, the P26 commit, its commit.
   */
  readonly newer: {
    readonly passed: number;
    readonly total: number;
    readonly spec: string;
    readonly commit: string;
  } | null;
}

type ProgramKey =
  | "rust"
  | "rustReference"
  | "programB"
  | "python"
  | "lean"
  | "backend";

/**
 * The builds the daily comparison ran on its latest published day, as that
 * day's file names them: the validator commit of the Rust core and the
 * 6529chain commit of the Python reference, and the day.
 */
export interface DailyBuilds {
  readonly rust: string | null;
  readonly python: string | null;
  /** The latest published day, "YYYY-MM-DD". */
  readonly date: string;
}

const PROGRAMS = [
  { key: "rust", pill: "inDailyRun" },
  { key: "rustReference", pill: "followsLatest" },
  { key: "programB", pill: "builtNotInValidator" },
  { key: "python", pill: "inDailyRun" },
  { key: "lean", pill: "proposal" },
  { key: "backend", pill: "underTest" },
] as const;

/** The Lean model's time for the whole day, by the round of its build. */
const LEAN_SPEED: Record<LeanRound, MessageKey> = {
  3: "network.tdh.impl.lean.speed",
  4: "network.tdh.impl.lean.speedRaw",
  5: "network.tdh.impl.lean.speedRound5",
  6: "network.tdh.impl.lean.speedRound6",
};
const LEAN_SPEED_SHORT: Record<LeanRound, MessageKey> = {
  3: "network.tdh.impl.speedShort.lean3",
  4: "network.tdh.impl.speedShort.lean4",
  5: "network.tdh.impl.speedShort.lean5",
  6: "network.tdh.impl.speedShort.lean6",
};

function longText(
  locale: SupportedLocale,
  program: ProgramKey,
  part: string,
  lean: LeanVectorRun
): string {
  if (program === "lean" && part === "conformance") {
    const published = t(locale, "network.tdh.impl.lean.conformance", {
      passed: formatInteger(locale, lean.passed),
      total: formatInteger(locale, lean.total),
      checks: formatInteger(locale, lean.checks),
      spec: lean.spec,
    });
    return lean.newer === null
      ? published
      : `${published}. ${t(locale, "network.tdh.impl.lean.conformanceNewer", {
          passed: formatInteger(locale, lean.newer.passed),
          total: formatInteger(locale, lean.newer.total),
          spec: lean.newer.spec,
          commit: lean.newer.commit,
        })}`;
  }
  if (program === "lean" && part === "speed") {
    return t(locale, LEAN_SPEED[lean.round]);
  }
  return t(locale, `network.tdh.impl.${program}.${part}` as MessageKey);
}

/**
 * Each program's one vectors figure: its latest build against P26's latest
 * vectors (the Lean model's from its proof manifest). The P26 commit is said
 * once, under the table.
 */
function vectorsFigure(
  program: ProgramKey,
  lean: LeanVectorRun
): { readonly passed: number; readonly total: number } | null {
  switch (program) {
    case "rust":
      return {
        passed: PROGRAM_CONFORMANCE.rustCoreCurrent.vectors,
        total: P26.vectorCount,
      };
    case "programB":
      return {
        passed: PROGRAM_CONFORMANCE.programBCurrent.vectors,
        total: P26.vectorCount,
      };
    case "python":
      return {
        passed: PROGRAM_CONFORMANCE.python.vectors,
        total: P26.vectorCount,
      };
    case "rustReference":
      return {
        passed: PROGRAM_CONFORMANCE.rustReference.vectors,
        total: P26.vectorCount,
      };
    case "lean":
      return { passed: lean.passed, total: lean.total };
    case "backend":
      return null;
  }
}

/**
 * The build that ran on the latest published day, from that day's file: its
 * commit, and whether this page knows what it computes ("a build not yet
 * described here" otherwise, so a redeployed job never looks unaccounted
 * for). Only the Rust core and the Python reference run daily.
 */
function dailyLine(
  locale: SupportedLocale,
  program: ProgramKey,
  daily: DailyBuilds | null
): string | null {
  if (daily === null) {
    return null;
  }
  let repository: "validator" | "6529chain" | null = null;
  let commit: string | null = null;
  if (program === "rust") {
    repository = "validator";
    commit = daily.rust;
  } else if (program === "python") {
    repository = "6529chain";
    commit = daily.python;
  }
  if (repository === null || commit === null) {
    return null;
  }
  const values = {
    date: formatCycleDate(locale, daily.date),
    build: `${repository}@${shortCommit(commit)}`,
  };
  return knownBuild(commit) === null
    ? t(locale, "network.tdh.impl.round.dailyUnknown", values)
    : t(locale, "network.tdh.impl.round.daily", values);
}

const COLUMNS =
  "lg:tw-grid lg:tw-grid-cols-[minmax(0,1.3fr)_minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,0.7fr)] lg:tw-gap-x-6";

/**
 * The programs as one comparison: a row each, with its name (the button that
 * opens its details), its role, its status, one vectors figure with the
 * build that ran on the latest published day, and its compute time, under
 * one header row inside the card.
 */
export default function ProgramCards({
  locale,
  lean,
  daily,
}: {
  readonly locale: SupportedLocale;
  readonly lean: LeanVectorRun;
  /** The daily comparison's builds on its latest day; null without it. */
  readonly daily: DailyBuilds | null;
}) {
  const head = (key: string) =>
    t(locale, `network.tdh.impl.matrixHead.${key}` as MessageKey);
  // Below lg each value sits beside its label, two columns a line, so a
  // program is a few short lines on a phone; from lg the header row names
  // the columns.
  const label = "tw-text-sm tw-leading-6 tw-text-iron-400 lg:tw-sr-only";
  // By the card's own width (a container below lg): in a narrow card the
  // label stays above its value.
  const cell =
    "tw-min-w-0 @[19rem]:tw-grid @[19rem]:tw-grid-cols-[4.5rem_minmax(0,1fr)] @[19rem]:tw-gap-x-3";
  // The short labels of those lines; the full ones stay for screen readers.
  const short = (key: string) =>
    t(locale, `network.tdh.impl.matrixHead.${key}Short` as MessageKey);
  return (
    <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900">
      <div
        aria-hidden="true"
        className={`tw-hidden tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60 tw-px-4 tw-py-2.5 tw-text-sm tw-font-medium tw-text-iron-300 ${COLUMNS}`}
      >
        <span>{head("program")}</span>
        <span>{head("status")}</span>
        <span>{head("vectors")}</span>
        <span>{head("speed")}</span>
      </div>
      <ul className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] tw-p-0">
        {PROGRAMS.map((program) => {
          const name = t(
            locale,
            `network.tdh.impl.name.${program.key}` as MessageKey
          );
          const speed =
            program.key === "lean"
              ? t(locale, LEAN_SPEED_SHORT[lean.round])
              : t(
                  locale,
                  `network.tdh.impl.speedShort.${program.key}` as MessageKey
                );
          const figure = vectorsFigure(program.key, lean);
          const ranOn = dailyLine(locale, program.key, daily);
          return (
            <ProgramRow
              key={program.key}
              name={name}
              role={longText(locale, program.key, "role", lean)}
              columns={COLUMNS}
              showLabel={t(locale, "network.tdh.impl.programs.showDetails", {
                name,
              })}
              cells={
                <dl className="tw-m-0 tw-space-y-1.5 max-lg:tw-@container lg:tw-contents">
                  <div className={cell}>
                    <dt className={label}>
                      <span aria-hidden="true" className="lg:tw-hidden">
                        {short("status")}
                      </span>
                      <span className="tw-sr-only">{head("status")}</span>
                    </dt>
                    <dd className="tw-m-0 tw-flex tw-flex-wrap tw-gap-1.5 lg:tw-pt-2.5">
                      <TdhStatusPill
                        pill={program.pill}
                        locale={locale}
                        size="sm"
                        wrap
                      />
                    </dd>
                  </div>
                  <div className={cell}>
                    <dt className={label}>
                      <span aria-hidden="true" className="lg:tw-hidden">
                        {short("vectors")}
                      </span>
                      <span className="tw-sr-only">{head("vectors")}</span>
                    </dt>
                    <dd className="tw-m-0 tw-text-sm tw-tabular-nums tw-leading-6 lg:tw-pt-2.5">
                      {figure === null ? (
                        <span className="tw-text-iron-300">
                          {t(locale, "network.tdh.impl.bar.none")}
                        </span>
                      ) : (
                        <span className="tw-font-semibold tw-text-iron-50">
                          {t(locale, "network.tdh.impl.round.count", {
                            passed: formatInteger(locale, figure.passed),
                            total: formatInteger(locale, figure.total),
                          })}
                        </span>
                      )}
                      {ranOn !== null && (
                        <span className="tw-block tw-text-sm tw-leading-5 tw-text-iron-400">
                          {ranOn}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className={cell}>
                    <dt className={label}>
                      <span aria-hidden="true" className="lg:tw-hidden">
                        {short("speed")}
                      </span>
                      <span className="tw-sr-only">{head("speed")}</span>
                    </dt>
                    <dd className="tw-m-0 tw-text-sm tw-tabular-nums tw-leading-6 tw-text-iron-100 lg:tw-pt-2.5">
                      {speed}
                    </dd>
                  </div>
                </dl>
              }
              details={
                <dl className="tw-m-0 tw-grid tw-gap-x-6 tw-gap-y-3 tw-pb-2 tw-pl-6 md:tw-grid-cols-2">
                  {(
                    [
                      "language",
                      "writtenFrom",
                      "runsIn",
                      "conformance",
                      "speed",
                    ] as const
                  ).map((row) => (
                    <div key={row}>
                      <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
                        {t(locale, `network.tdh.impl.row.${row}` as MessageKey)}
                      </dt>
                      <dd className="tw-m-0 tw-mt-0.5 tw-text-sm tw-leading-6 tw-text-iron-300">
                        {longText(locale, program.key, row, lean)}
                      </dd>
                    </div>
                  ))}
                </dl>
              }
            />
          );
        })}
      </ul>
      <p className="tw-m-0 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-px-4 tw-py-2.5 tw-text-sm tw-leading-6 tw-text-iron-400">
        <span className="tw-block tw-max-w-[38em]">
          {t(locale, "network.tdh.impl.programs.vectorsNote", {
            count: formatInteger(locale, P26.vectorCount),
            spec: P26.commit,
            commit: VALIDATOR_BUILD.commit,
          })}
        </span>
      </p>
    </div>
  );
}
