import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { LeanRound } from "../formal/leanResults";
import TdhDisclosure from "../shared/TdhDisclosure";
import TdhStatusPill from "../shared/TdhStatusPill";
import { TDH_SERIES } from "../shared/tdhStyles";

const PROGRAMS = [
  { key: "rust", series: "rust", pill: "inDailyRun" },
  { key: "rustReference", series: "rust", pill: "followsLatest" },
  { key: "programB", series: "programB", pill: "builtNotInValidator" },
  { key: "python", series: "python", pill: "inDailyRun" },
  { key: "lean", series: "lean", pill: "proposal" },
  { key: "backend", series: "live", pill: "underTest" },
] as const;

type ProgramKey = (typeof PROGRAMS)[number]["key"];

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

const ACCENT: Record<keyof typeof TDH_SERIES, string> = {
  rust: "tw-border-t-primary-400",
  programB: "tw-border-t-violet-400",
  lean: "tw-border-t-emerald-400",
  python: "tw-border-t-amber-300",
  live: "tw-border-t-iron-400",
  memes: "tw-border-t-sky-400",
  gradients: "tw-border-t-fuchsia-400",
  nextgen: "tw-border-t-teal-400",
};

const FACTS = ["language", "conformance", "speed"] as const;

/** The Lean model's time for the whole day, by the round of its build. */
const LEAN_SPEED: Record<LeanRound, MessageKey> = {
  3: "network.tdh.impl.lean.speed",
  4: "network.tdh.impl.lean.speedRaw",
  5: "network.tdh.impl.lean.speedRound5",
};

function text(
  locale: SupportedLocale,
  program: ProgramKey,
  part: string,
  lean: LeanVectorRun
) {
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
 * The programs as six equal cards, in the series colours the diagrams use:
 * what each is, its status, and three facts; how it was written and where it
 * runs open below. The status is the shared TDH status pill, in the one
 * palette every TDH page uses, so colour is never the only signal.
 */
export default function ProgramCards({
  locale,
  lean,
}: {
  readonly locale: SupportedLocale;
  readonly lean: LeanVectorRun;
}) {
  return (
    <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
      {PROGRAMS.map((program) => (
        <li
          key={program.key}
          className={`tw-flex tw-min-w-0 tw-flex-col tw-rounded-xl tw-border tw-border-t-2 tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-4 sm:tw-p-5 ${ACCENT[program.series]}`}
        >
          <h3 className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-lg tw-font-semibold tw-text-iron-50">
            <span
              aria-hidden="true"
              className={`tw-size-2.5 tw-shrink-0 tw-rounded-full ${TDH_SERIES[program.series].bg}`}
            />
            {t(locale, `network.tdh.impl.name.${program.key}` as MessageKey)}
          </h3>
          <p className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
            {text(locale, program.key, "role", lean)}
          </p>
          <p className="tw-m-0 tw-mt-3">
            <TdhStatusPill pill={program.pill} locale={locale} size="sm" />
          </p>
          <dl className="tw-m-0 tw-mt-4 tw-space-y-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4">
            {FACTS.map((fact) => (
              <div key={fact}>
                <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
                  {t(locale, `network.tdh.impl.row.${fact}` as MessageKey)}
                </dt>
                <dd className="tw-m-0 tw-mt-0.5 tw-text-sm tw-leading-6 tw-text-iron-100">
                  {text(locale, program.key, fact, lean)}
                </dd>
              </div>
            ))}
          </dl>
          <div className="tw-mt-auto tw-pt-3">
            <TdhDisclosure
              summary={t(locale, "network.tdh.impl.programs.more")}
            >
              <dl className="tw-m-0 tw-space-y-3 tw-pb-2 tw-pl-6">
                {(["writtenFrom", "runsIn"] as const).map((row) => (
                  <div key={row}>
                    <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
                      {t(locale, `network.tdh.impl.row.${row}` as MessageKey)}
                    </dt>
                    <dd className="tw-m-0 tw-mt-0.5 tw-text-sm tw-leading-6 tw-text-iron-300">
                      {text(locale, program.key, row, lean)}
                    </dd>
                  </div>
                ))}
              </dl>
            </TdhDisclosure>
          </div>
        </li>
      ))}
    </ul>
  );
}
