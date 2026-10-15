import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhDisclosure from "../shared/TdhDisclosure";
import { TDH_SERIES } from "../shared/tdhStyles";

export const PROGRAMS = [
  { key: "rust", series: "rust", tone: "now" },
  { key: "programB", series: "programB", tone: "later" },
  { key: "python", series: "python", tone: "now" },
  { key: "lean", series: "lean", tone: "later" },
  { key: "backend", series: "live", tone: "test" },
] as const;

type ProgramKey = (typeof PROGRAMS)[number]["key"];

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

const STATUS_TONE = {
  now: "tw-border-success/40 tw-text-success",
  later: "tw-border-primary-400/40 tw-text-primary-300",
  test: "tw-border-amber-400/40 tw-text-amber-200",
} as const;

const FACTS = ["language", "conformance", "speed"] as const;

function text(locale: SupportedLocale, program: ProgramKey, part: string) {
  return t(locale, `network.tdh.impl.${program}.${part}` as MessageKey);
}

/**
 * The programs as cards, one per implementation, in the series colours the
 * diagrams use: what each is, its status, and three facts; how it was written
 * and where it runs open below.
 */
export default function ProgramCards({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-6">
      {PROGRAMS.map((program, index) => (
        <li
          key={program.key}
          className={`tw-flex tw-min-w-0 tw-flex-col tw-rounded-xl tw-border tw-border-t-2 tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-4 sm:tw-p-5 ${ACCENT[program.series]} ${
            index < 3 ? "lg:tw-col-span-2" : "lg:tw-col-span-3"
          } ${index === PROGRAMS.length - 1 ? "sm:tw-col-span-2" : ""}`}
        >
          <h3 className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-lg tw-font-semibold tw-text-iron-50">
            <span
              aria-hidden="true"
              className={`tw-size-2.5 tw-shrink-0 tw-rounded-full ${TDH_SERIES[program.series].bg}`}
            />
            {t(locale, `network.tdh.impl.name.${program.key}` as MessageKey)}
          </h3>
          <p className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
            {text(locale, program.key, "role")}
          </p>
          <p
            className={`tw-m-0 tw-mt-3 tw-inline-flex tw-w-fit tw-items-center tw-rounded-full tw-border tw-border-solid tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-medium ${STATUS_TONE[program.tone]}`}
          >
            {text(locale, program.key, "status")}
          </p>
          <dl className="tw-m-0 tw-mt-4 tw-space-y-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4">
            {FACTS.map((fact) => (
              <div key={fact}>
                <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
                  {t(locale, `network.tdh.impl.row.${fact}` as MessageKey)}
                </dt>
                <dd className="tw-m-0 tw-mt-0.5 tw-text-sm tw-leading-6 tw-text-iron-100">
                  {text(locale, program.key, fact)}
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
                    <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
                      {t(locale, `network.tdh.impl.row.${row}` as MessageKey)}
                    </dt>
                    <dd className="tw-m-0 tw-mt-0.5 tw-text-sm tw-leading-6 tw-text-iron-300">
                      {text(locale, program.key, row)}
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
