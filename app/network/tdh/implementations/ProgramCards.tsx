import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { LeanRound } from "../formal/leanResults";
import TdhDisclosure from "../shared/TdhDisclosure";
import TdhStatusPill from "../shared/TdhStatusPill";
import { P26, PROGRAM_CONFORMANCE } from "../shared/tdhFacts";
import { TDH_SERIES } from "../shared/tdhStyles";

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

/** Vectors a program passes, of the round it follows; null where none apply. */
interface VectorRun {
  readonly passed: number;
  readonly label: string;
}

const PROGRAMS = [
  { key: "rust", series: "rust", pill: "inDailyRun" },
  { key: "rustReference", series: "rust", pill: "followsLatest" },
  { key: "programB", series: "programB", pill: "builtNotInValidator" },
  { key: "python", series: "python", pill: "inDailyRun" },
  { key: "lean", series: "lean", pill: "proposal" },
  { key: "backend", series: "live", pill: "underTest" },
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

/** Each program's vectors as a bar: what it passes, of P26's latest count. */
function vectorRun(
  locale: SupportedLocale,
  program: ProgramKey,
  lean: LeanVectorRun
): VectorRun | null {
  const n = (value: number) => formatInteger(locale, value);
  switch (program) {
    case "rust":
      return {
        passed: PROGRAM_CONFORMANCE.rustCoreCurrent.vectors,
        label: t(locale, "network.tdh.impl.bar.rust", {
          passed: n(PROGRAM_CONFORMANCE.rustCoreCurrent.vectors),
          daily: n(PROGRAM_CONFORMANCE.rustCoreDaily.vectors),
          dailySpec: PROGRAM_CONFORMANCE.rustCoreDaily.specCommit,
        }),
      };
    case "programB":
      return {
        passed: PROGRAM_CONFORMANCE.programBCurrent.vectors,
        label: t(locale, "network.tdh.impl.bar.programB", {
          passed: n(PROGRAM_CONFORMANCE.programBCurrent.vectors),
          pending: n(
            P26.vectorCount - PROGRAM_CONFORMANCE.programBCurrent.vectors
          ),
        }),
      };
    case "rustReference":
    case "python":
      return {
        passed: PROGRAM_CONFORMANCE[program].vectors,
        label: t(locale, "network.tdh.impl.bar.latest", {
          passed: n(PROGRAM_CONFORMANCE[program].vectors),
          spec: P26.commit,
        }),
      };
    case "lean":
      return {
        passed: lean.passed,
        label:
          lean.newer === null
            ? t(locale, "network.tdh.impl.bar.lean", {
                passed: n(lean.passed),
                spec: lean.spec,
              })
            : t(locale, "network.tdh.impl.bar.leanNewer", {
                passed: n(lean.passed),
                spec: lean.spec,
                newerPassed: n(lean.newer.passed),
                newerTotal: n(lean.newer.total),
              }),
      };
    case "backend":
      return null;
  }
}

/** A bar of P26's latest vectors: the share a program passes, then the rest. */
function VectorBar({
  locale,
  run,
  series,
}: {
  readonly locale: SupportedLocale;
  readonly run: VectorRun | null;
  readonly series: keyof typeof TDH_SERIES;
}) {
  if (run === null) {
    return (
      <span className="tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "network.tdh.impl.bar.none")}
      </span>
    );
  }
  const share = Math.min(run.passed / P26.vectorCount, 1) * 100;
  return (
    <span className="tw-block">
      <span className="tw-flex tw-items-baseline tw-gap-1.5 tw-text-sm tw-tabular-nums">
        <span className="tw-font-semibold tw-text-iron-50">
          {formatInteger(locale, run.passed)}
        </span>
        <span className="tw-text-iron-400">
          {t(locale, "network.tdh.impl.bar.of", {
            total: formatInteger(locale, P26.vectorCount),
          })}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="tw-mt-1 tw-flex tw-h-2 tw-overflow-hidden tw-rounded-full tw-bg-iron-800"
      >
        <span
          className={`tw-block tw-h-full ${TDH_SERIES[series].bg}`}
          style={{ width: `${share}%` }}
        />
      </span>
      <span className="tw-mt-1 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
        {run.label}
      </span>
    </span>
  );
}

const COLUMNS =
  "md:tw-grid md:tw-grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_minmax(0,1.25fr)_minmax(0,0.7fr)] md:tw-gap-x-6";

/**
 * The programs as one comparison: a row each, in the series colours the
 * diagrams use, with its status, the vectors it passes as a bar out of P26's
 * latest count, and its compute time. Commits and the longer story open
 * below each row, so the matrix stays readable.
 */
export default function ProgramCards({
  locale,
  lean,
}: {
  readonly locale: SupportedLocale;
  readonly lean: LeanVectorRun;
}) {
  const head = (key: string) =>
    t(locale, `network.tdh.impl.matrixHead.${key}` as MessageKey);
  return (
    <div>
      <div
        aria-hidden="true"
        className={`tw-hidden tw-px-4 tw-pb-2 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 ${COLUMNS}`}
      >
        <span>{head("program")}</span>
        <span>{head("status")}</span>
        <span>{head("vectors")}</span>
        <span>{head("speed")}</span>
      </div>
      <ul className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-0">
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
              <div className={`tw-space-y-3 md:tw-space-y-0 ${COLUMNS}`}>
                <div className="tw-min-w-0">
                  <h3 className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-base tw-font-semibold tw-text-iron-50">
                    <span
                      aria-hidden="true"
                      className={`tw-size-2.5 tw-shrink-0 tw-rounded-full ${TDH_SERIES[program.series].bg}`}
                    />
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
                  <div className="tw-min-w-0">
                    <dt className="tw-mb-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 md:tw-sr-only">
                      {head("status")}
                    </dt>
                    <dd className="tw-m-0">
                      <TdhStatusPill
                        pill={program.pill}
                        locale={locale}
                        size="sm"
                      />
                    </dd>
                  </div>
                  <div className="tw-min-w-0">
                    <dt className="tw-mb-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 md:tw-sr-only">
                      {head("vectors")}
                    </dt>
                    <dd className="tw-m-0">
                      <VectorBar
                        locale={locale}
                        run={vectorRun(locale, program.key, lean)}
                        series={program.series}
                      />
                    </dd>
                  </div>
                  <div className="tw-min-w-0">
                    <dt className="tw-mb-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 md:tw-sr-only">
                      {head("speed")}
                    </dt>
                    <dd className="tw-m-0 tw-text-sm tw-tabular-nums tw-leading-6 tw-text-iron-100">
                      {speed}
                    </dd>
                  </div>
                </dl>
              </div>
              <TdhDisclosure
                className="tw-mt-2"
                summary={t(locale, "network.tdh.impl.programs.more")}
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
