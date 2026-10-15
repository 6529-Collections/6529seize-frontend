import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  formatInteger,
  formatPercent,
  selectPluralCategory,
} from "@/i18n/format";
import {
  CUTOVER_DECIDED_DATE,
  type CutoverState,
  type Freshness,
  type VerdictState,
} from "@/lib/tdh/verification/states";
import TdhDisclosure from "../../shared/TdhDisclosure";
import TdhSource from "../../shared/TdhSource";
import TdhStatusPill from "../../shared/TdhStatusPill";
import { TDH_CARD } from "../../shared/tdhStyles";
import { formatCycleDate, formatShortCycleDate } from "./verificationFormat";

const LABEL =
  "tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400";

function plural(locale: SupportedLocale, count: number): "one" | "other" {
  return selectPluralCategory(locale, count) === "one" ? "one" : "other";
}

/** The latest report, and a warning when reports are late or missing. */
function FreshnessLine({
  locale,
  freshness,
  latestDate,
  missingDays,
}: {
  readonly locale: SupportedLocale;
  readonly freshness: Freshness;
  readonly latestDate: string;
  readonly missingDays: number;
}) {
  const latest = {
    cycle: formatInteger(locale, freshness.latest),
    date: formatCycleDate(locale, latestDate),
  };
  const late = freshness.kind === "late";
  return (
    <div className="tw-mt-4 tw-space-y-1 tw-text-sm tw-leading-6">
      <p
        className={`tw-m-0 tw-flex tw-items-start tw-gap-2 ${late ? "tw-text-amber-100" : "tw-text-iron-400"}`}
        role={late ? "status" : undefined}
      >
        {late && (
          <ExclamationTriangleIcon
            aria-hidden="true"
            className="tw-mt-1 tw-size-4 tw-shrink-0 tw-text-amber-300"
          />
        )}
        <span>
          {late
            ? t(
                locale,
                `network.tdh.verify.status.late.${plural(locale, freshness.missing)}` as MessageKey,
                { ...latest, days: formatInteger(locale, freshness.missing) }
              )
            : t(locale, "network.tdh.verify.status.latest", latest)}
        </span>
      </p>
      {missingDays > 0 && (
        <p className="tw-m-0 tw-text-amber-100">
          {t(
            locale,
            `network.tdh.verify.status.missing.${plural(locale, missingDays)}` as MessageKey,
            { count: formatInteger(locale, missingDays) }
          )}
        </p>
      )}
    </div>
  );
}

export function VerificationStatusBand({
  locale,
  cycleDay,
  date,
  cutoffBlock,
  verdict,
  mode,
  cutover,
  isLatest,
  freshness,
  latestDate,
  missingDays,
}: {
  readonly locale: SupportedLocale;
  readonly cycleDay: number;
  readonly date: string;
  readonly cutoffBlock: number | null;
  readonly verdict: VerdictState;
  readonly mode: "unchecked-history" | "checked" | null;
  readonly cutover: CutoverState;
  readonly isLatest: boolean;
  readonly freshness: Freshness | null;
  readonly latestDate: string | null;
  readonly missingDays: number;
}) {
  const cycle = formatInteger(locale, cycleDay);
  return (
    <section
      aria-labelledby="tdh-verify-status-heading"
      className="tw-grid tw-gap-4 lg:tw-grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]"
    >
      <div className={`${TDH_CARD} tw-p-5 sm:tw-p-6`}>
        <h2 id="tdh-verify-status-heading" className="tw-sr-only">
          {t(locale, "network.tdh.verify.status.heading", { cycle })}
        </h2>
        <dl className="tw-m-0 tw-grid tw-gap-5 sm:tw-grid-cols-2">
          <div>
            <dt className={LABEL}>
              {t(locale, "network.tdh.verify.status.verdictLabel")}
            </dt>
            <dd className="tw-m-0 tw-mt-2">
              <TdhStatusPill pill={verdict} locale={locale} />
              <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-200">
                {t(
                  locale,
                  `network.tdh.verify.verdict.${verdict}` as MessageKey
                )}
              </p>
            </dd>
          </div>
          {mode && (
            <div>
              <dt className={LABEL}>
                {t(locale, "network.tdh.verify.status.historyLabel")}
              </dt>
              <dd className="tw-m-0 tw-mt-2">
                <TdhStatusPill
                  pill={mode === "checked" ? "checked" : "unchecked"}
                  locale={locale}
                />
                <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-200">
                  {t(
                    locale,
                    mode === "checked"
                      ? "network.tdh.verify.mode.checkedShort"
                      : "network.tdh.verify.mode.uncheckedShort"
                  )}
                </p>
                <TdhDisclosure
                  summary={t(locale, "network.tdh.verify.status.explain")}
                >
                  <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
                    {t(
                      locale,
                      mode === "checked"
                        ? "network.tdh.verify.mode.checked"
                        : "network.tdh.verify.mode.unchecked"
                    )}
                    <TdhSource
                      refs={["D118", "D122", "P53 §11"]}
                      locale={locale}
                    />
                  </p>
                </TdhDisclosure>
              </dd>
            </div>
          )}
        </dl>
        <p className="tw-m-0 tw-mt-5 tw-flex tw-flex-col tw-gap-x-3 tw-gap-y-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4 tw-text-sm tw-tabular-nums tw-text-iron-300 sm:tw-flex-row sm:tw-flex-wrap">
          <span>{t(locale, "network.tdh.verify.status.cycle", { cycle })}</span>
          <span aria-hidden="true" className="tw-hidden sm:tw-inline">
            ·
          </span>
          <span>
            {t(locale, "network.tdh.verify.status.snapshot", {
              date: formatCycleDate(locale, date),
            })}
          </span>
          {cutoffBlock !== null && (
            <>
              <span aria-hidden="true" className="tw-hidden sm:tw-inline">
                ·
              </span>
              <span>
                {t(locale, "network.tdh.verify.status.block", {
                  block: formatInteger(locale, cutoffBlock),
                })}
              </span>
            </>
          )}
        </p>
        {freshness && latestDate && (
          <FreshnessLine
            locale={locale}
            freshness={freshness}
            latestDate={latestDate}
            missingDays={missingDays}
          />
        )}
      </div>
      <VerificationCutoverCard
        locale={locale}
        cutover={cutover}
        asOfToday={!isLatest}
      />
    </section>
  );
}

export function VerificationCutoverCard({
  locale,
  cutover,
  asOfToday = false,
}: {
  readonly locale: SupportedLocale;
  readonly cutover: CutoverState;
  readonly asOfToday?: boolean;
}) {
  let headline: string;
  let body: string;
  if (cutover.kind === "countdown") {
    headline = t(
      locale,
      `network.tdh.verify.cutover.countdown.${plural(locale, cutover.days)}` as MessageKey,
      { days: formatInteger(locale, cutover.days) }
    );
    body = t(locale, "network.tdh.verify.cutover.countdownBody", {
      date: formatCycleDate(locale, cutover.plannedDate),
    });
  } else if (cutover.kind === "due") {
    headline = t(locale, "network.tdh.verify.cutover.due");
    body = t(locale, "network.tdh.verify.cutover.dueBody", {
      date: formatCycleDate(locale, cutover.plannedDate),
    });
  } else {
    headline = t(locale, "network.tdh.verify.cutover.done", {
      date: formatCycleDate(locale, cutover.plannedDate),
    });
    body =
      cutover.cycleDay === null
        ? t(locale, "network.tdh.verify.cutover.doneBodyNoCycle")
        : t(locale, "network.tdh.verify.cutover.doneBody", {
            cycle: formatInteger(locale, cutover.cycleDay),
          });
  }
  return (
    <aside
      aria-labelledby="tdh-verify-cutover-heading"
      className={`${TDH_CARD} tw-flex tw-flex-col tw-justify-between tw-gap-4 tw-p-5 sm:tw-p-6`}
      data-cutover={cutover.kind}
    >
      <div>
        <h2
          id="tdh-verify-cutover-heading"
          className={`tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-2 ${LABEL}`}
        >
          {t(locale, "network.tdh.verify.cutover.heading")}
          {asOfToday && (
            <span className="tw-rounded-full tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[11px] tw-normal-case tw-tracking-normal tw-text-iron-300">
              {t(locale, "network.tdh.verify.cutover.asOfToday")}
            </span>
          )}
        </h2>
        <p className="tw-m-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50">
          {headline}
        </p>
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {body}
          <TdhSource refs={["D132", "D121"]} locale={locale} />
        </p>
      </div>
      {cutover.kind === "countdown" && (
        <CutoverProgress
          locale={locale}
          elapsed={cutover.elapsed}
          plannedDate={cutover.plannedDate}
        />
      )}
    </aside>
  );
}

/** The week from D132's decision to the planned cutover, and how much has passed. */
function CutoverProgress({
  locale,
  elapsed,
  plannedDate,
}: {
  readonly locale: SupportedLocale;
  readonly elapsed: number;
  readonly plannedDate: string;
}) {
  const label = t(locale, "network.tdh.verify.cutover.progress", {
    elapsed: formatPercent(locale, elapsed, 0),
  });
  return (
    <div>
      <div
        role="img"
        aria-label={label}
        className="tw-relative tw-h-1.5 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-iron-800"
      >
        <span
          className="tw-absolute tw-inset-y-0 tw-left-0 tw-rounded-full tw-bg-primary-400"
          style={{ width: `${Math.max(elapsed * 100, 2)}%` }}
        />
      </div>
      <p className="tw-m-0 tw-mt-2 tw-flex tw-justify-between tw-gap-3 tw-text-xs tw-tabular-nums tw-text-iron-400">
        <span>
          {t(locale, "network.tdh.verify.cutover.decided", {
            date: formatShortCycleDate(locale, CUTOVER_DECIDED_DATE),
          })}
        </span>
        <span>
          {t(locale, "network.tdh.verify.cutover.planned", {
            date: formatShortCycleDate(locale, plannedDate),
          })}
        </span>
      </p>
    </div>
  );
}
