import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { LeanRound } from "../formal/leanResults";
import TdhDisclosure from "../shared/TdhDisclosure";
import TdhStatusPill from "../shared/TdhStatusPill";
import { shortCommit } from "../verification/components/verificationFormat";
import {
  knownBuild,
  P26,
  PROGRAM_CONFORMANCE,
  VALIDATOR_DEVELOPMENT,
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
 * One build of a program: how many of its P26 round's vectors it passes
 * (null where the build's round is not known) and which build it is.
 */
interface RoundRun {
  readonly passed: number | null;
  readonly total: number | null;
  readonly label: string;
}

/**
 * The builds the daily comparison ran on its latest published day, as that
 * day's file names them: the validator commit of the Rust core and the
 * 6529chain commit of the Python reference.
 */
export interface DailyBuilds {
  readonly rust: string | null;
  readonly python: string | null;
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
};
const LEAN_SPEED_SHORT: Record<LeanRound, MessageKey> = {
  3: "network.tdh.impl.speedShort.lean3",
  4: "network.tdh.impl.speedShort.lean4",
  5: "network.tdh.impl.speedShort.lean5",
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
 * The daily comparison's build of a program, from the latest day's file:
 * its vectors when the build is a known one, else the build alone.
 */
function dailyRun(
  locale: SupportedLocale,
  repository: "validator" | "6529chain",
  commit: string | null
): RoundRun[] {
  if (commit === null) {
    return [];
  }
  const build = `${repository}@${shortCommit(commit)}`;
  const known = knownBuild(commit);
  return [
    known === null
      ? {
          passed: null,
          total: null,
          label: t(locale, "network.tdh.impl.round.dailyUnknown", { build }),
        }
      : {
          passed: known.vectors,
          total: known.vectors,
          label: t(locale, "network.tdh.impl.round.daily", {
            spec: known.spec,
            build,
          }),
        },
  ];
}

/**
 * Each program's vectors, build by build: the newest first, then the build
 * the daily comparison ran on its latest day, read from the feed. Every
 * count is out of its own round's vectors, so a build that passes all of an
 * older round never reads as failing vectors.
 */
function roundRuns(
  locale: SupportedLocale,
  program: ProgramKey,
  lean: LeanVectorRun,
  daily: DailyBuilds | null
): RoundRun[] | null {
  const round = (key: string, values: Record<string, string>) =>
    t(locale, `network.tdh.impl.round.${key}` as MessageKey, values);
  switch (program) {
    case "rust":
      return [
        {
          passed: PROGRAM_CONFORMANCE.rustCoreCurrent.vectors,
          total: P26.vectorCount,
          label: round("development", {
            spec: PROGRAM_CONFORMANCE.rustCoreCurrent.specCommit,
            commit: VALIDATOR_DEVELOPMENT.commit,
          }),
        },
        ...dailyRun(locale, "validator", daily?.rust ?? null),
      ];
    case "programB":
      return [
        {
          passed: PROGRAM_CONFORMANCE.programBCurrent.vectors,
          total: P26.vectorCount,
          label: round("development", {
            spec: PROGRAM_CONFORMANCE.programBCurrent.specCommit,
            commit: VALIDATOR_DEVELOPMENT.commit,
          }),
        },
      ];
    case "python":
      return [
        {
          passed: PROGRAM_CONFORMANCE.python.vectors,
          total: P26.vectorCount,
          label: round("latest", { spec: P26.commit }),
        },
        ...dailyRun(locale, "6529chain", daily?.python ?? null),
      ];
    case "rustReference":
      return [
        {
          passed: PROGRAM_CONFORMANCE.rustReference.vectors,
          total: P26.vectorCount,
          label: round("latest", { spec: P26.commit }),
        },
      ];
    case "lean":
      return [
        {
          passed: lean.passed,
          total: lean.total,
          label: round("published", { spec: lean.spec }),
        },
        ...(lean.newer === null
          ? []
          : [
              {
                passed: lean.newer.passed,
                total: lean.newer.total,
                label: round("committed", {
                  spec: lean.newer.spec,
                  commit: lean.newer.commit,
                }),
              },
            ]),
      ];
    case "backend":
      return null;
  }
}

/** A program's rounds as short lines: "51 of 51 · P26 0621ed4, daily job". */
function RoundRuns({
  locale,
  runs,
}: {
  readonly locale: SupportedLocale;
  readonly runs: readonly RoundRun[] | null;
}) {
  if (runs === null) {
    return (
      <span className="tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.impl.bar.none")}
      </span>
    );
  }
  return (
    <ul className="tw-m-0 tw-list-none tw-space-y-1 tw-p-0">
      {runs.map((run, index) => (
        <li
          key={run.label}
          className={`tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-tabular-nums ${index === 0 ? "tw-text-sm tw-leading-6" : "tw-text-sm tw-leading-5 tw-text-iron-400"}`}
        >
          {run.passed !== null && run.total !== null && (
            <span
              className={`tw-whitespace-nowrap ${index === 0 ? "tw-font-semibold tw-text-iron-50" : "tw-text-iron-300"}`}
            >
              {t(locale, "network.tdh.impl.round.count", {
                passed: formatInteger(locale, run.passed),
                total: formatInteger(locale, run.total),
              })}
            </span>
          )}
          <span className={index === 0 ? "tw-text-iron-300" : ""}>
            {run.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

const COLUMNS =
  "lg:tw-grid lg:tw-grid-cols-[minmax(0,1.3fr)_minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,0.7fr)] lg:tw-gap-x-6";

/**
 * The programs as one comparison: a row each, with its status, the vectors
 * it passes round by round, and its compute time, under one header row
 * inside the card. Names carry no colour, so the status pills' colours are
 * the only ones in the table. Commits and the longer story open below each
 * row, so the matrix stays readable.
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
  return (
    <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900">
      <div
        aria-hidden="true"
        className={`tw-hidden tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60 tw-px-4 tw-py-2.5 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 ${COLUMNS}`}
      >
        <span>{head("program")}</span>
        <span>{head("status")}</span>
        <span>{head("vectors")}</span>
        <span>{head("speed")}</span>
      </div>
      <ul className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] tw-p-0">
        {PROGRAMS.map((program) => {
          const speed =
            program.key === "lean"
              ? t(locale, LEAN_SPEED_SHORT[lean.round])
              : t(
                  locale,
                  `network.tdh.impl.speedShort.${program.key}` as MessageKey
                );
          return (
            <li key={program.key} className="tw-px-4 tw-py-4">
              <div className={`tw-space-y-4 lg:tw-space-y-0 ${COLUMNS}`}>
                <div className="tw-min-w-0">
                  <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
                    {t(
                      locale,
                      `network.tdh.impl.name.${program.key}` as MessageKey
                    )}
                  </h3>
                  <p className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
                    {longText(locale, program.key, "role", lean)}
                  </p>
                </div>
                <dl className="tw-m-0 tw-contents">
                  <div className="tw-min-w-0 max-lg:tw-mt-4">
                    <dt className="tw-mb-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 lg:tw-sr-only">
                      {head("status")}
                    </dt>
                    <dd className="tw-m-0 tw-flex tw-flex-wrap tw-gap-1.5">
                      <TdhStatusPill
                        pill={program.pill}
                        locale={locale}
                        size="sm"
                      />
                    </dd>
                  </div>
                  <div className="tw-min-w-0 max-lg:tw-mt-4">
                    <dt className="tw-mb-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 lg:tw-sr-only">
                      {head("vectors")}
                    </dt>
                    <dd className="tw-m-0">
                      <RoundRuns
                        locale={locale}
                        runs={roundRuns(locale, program.key, lean, daily)}
                      />
                    </dd>
                  </div>
                  <div className="tw-min-w-0 max-lg:tw-mt-4">
                    <dt className="tw-mb-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 lg:tw-sr-only">
                      {head("speed")}
                    </dt>
                    <dd className="tw-m-0 tw-text-sm tw-tabular-nums tw-leading-6 tw-text-iron-100">
                      {speed}
                    </dd>
                  </div>
                </dl>
              </div>
              <TdhDisclosure
                className="tw-mt-1"
                summaryClassName="tw-w-fit"
                summary={
                  <>
                    {t(locale, "network.tdh.impl.programs.details")}
                    <span className="tw-sr-only">
                      {" "}
                      {t(
                        locale,
                        `network.tdh.impl.name.${program.key}` as MessageKey
                      )}
                    </span>
                  </>
                }
              >
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
              </TdhDisclosure>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
