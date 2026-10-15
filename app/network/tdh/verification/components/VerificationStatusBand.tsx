import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { formatInteger, selectPluralCategory } from "@/i18n/format";
import type { CutoverState, VerdictState } from "@/lib/tdh/verification/states";
import TdhSource from "../../shared/TdhSource";
import TdhStatusPill from "../../shared/TdhStatusPill";
import { TDH_CARD, TDH_FOCUS_RING } from "../../shared/tdhStyles";
import { formatCycleDate } from "./verificationFormat";

const SUMMARY = `tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-gap-2 tw-rounded-lg tw-text-sm tw-text-iron-300 hover:tw-text-iron-100 [&::-webkit-details-marker]:tw-hidden ${TDH_FOCUS_RING}`;

function Explainer({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <details className="tw-group">
      <summary className={SUMMARY}>
        <span className="tw-underline tw-decoration-iron-600 tw-underline-offset-4">
          {label}
        </span>
        <span
          aria-hidden="true"
          className="tw-text-iron-500 tw-transition-transform group-open:tw-rotate-90 motion-reduce:tw-transition-none"
        >
          ›
        </span>
      </summary>
      <div className="tw-pb-1 tw-pt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
        {children}
      </div>
    </details>
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
}: {
  readonly locale: SupportedLocale;
  readonly cycleDay: number;
  readonly date: string;
  readonly cutoffBlock: number | null;
  readonly verdict: VerdictState;
  readonly mode: "unchecked-history" | "checked" | null;
  readonly cutover: CutoverState;
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
            <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
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
              <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
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
                <Explainer
                  label={t(locale, "network.tdh.verify.status.explain")}
                >
                  <p className="tw-m-0">
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
                </Explainer>
              </dd>
            </div>
          )}
        </dl>
        <p className="tw-m-0 tw-mt-5 tw-flex tw-flex-col tw-gap-x-3 tw-gap-y-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4 tw-text-sm tw-tabular-nums tw-text-iron-400 sm:tw-flex-row sm:tw-flex-wrap">
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
      </div>
      <VerificationCutoverCard locale={locale} cutover={cutover} />
    </section>
  );
}

export function VerificationCutoverCard({
  locale,
  cutover,
}: {
  readonly locale: SupportedLocale;
  readonly cutover: CutoverState;
}) {
  let headline: string;
  let body: string;
  if (cutover.kind === "countdown") {
    const plural =
      selectPluralCategory(locale, cutover.days) === "one" ? "one" : "other";
    headline = t(
      locale,
      `network.tdh.verify.cutover.countdown.${plural}` as MessageKey,
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
      className={`${TDH_CARD} tw-flex tw-flex-col tw-justify-between tw-gap-3 tw-p-5 sm:tw-p-6`}
      data-cutover={cutover.kind}
    >
      <div>
        <h2
          id="tdh-verify-cutover-heading"
          className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500"
        >
          {t(locale, "network.tdh.verify.cutover.heading")}
        </h2>
        <p className="tw-m-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50">
          {headline}
        </p>
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {body}
          <TdhSource refs={["D132", "D121"]} locale={locale} />
        </p>
      </div>
      {cutover.kind === "countdown" && <CutoverTrack days={cutover.days} />}
    </aside>
  );
}

/** Seven short segments, one per day of D132's week, lit as days pass. */
function CutoverTrack({ days }: { readonly days: number }) {
  const total = 7;
  const remaining = Math.min(days, total);
  return (
    <div aria-hidden="true" className="tw-flex tw-gap-1">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`tw-h-1.5 tw-flex-1 tw-rounded-full ${
            index < total - remaining ? "tw-bg-primary-400" : "tw-bg-iron-700"
          }`}
        />
      ))}
    </div>
  );
}
