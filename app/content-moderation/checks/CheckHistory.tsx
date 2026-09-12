"use client";

import type { ApiModerationCheckDetail } from "@/generated/models/ApiModerationCheckDetail";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { checkValueLabel } from "./checks.helpers";
import { InertEvidence } from "./CheckEvidence";

export default function CheckHistory({
  detail,
  kind,
}: {
  readonly detail: ApiModerationCheckDetail;
  readonly kind: "evaluations" | "audit";
}) {
  const locale = useBrowserLocale();
  const date = (value: number) =>
    formatDate(locale, value, { dateStyle: "medium", timeStyle: "short" });
  if (detail[kind].length === 0)
    return (
      <p className="tw-text-sm tw-text-iron-400">
        {t(locale, "checks.noHistory")}
      </p>
    );
  return (
    <ol className="tw-m-0 tw-list-none tw-space-y-4 tw-p-0">
      {kind === "evaluations"
        ? detail.evaluations.map((entry) => (
            <li
              key={entry.id}
              className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-4"
            >
              <h4 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                {checkValueLabel(locale, entry.outcome)} ·{" "}
                {date(entry.started_at)}
              </h4>
              <dl className="tw-my-3 tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-4 tw-gap-y-2 tw-text-sm">
                <dt className="tw-text-iron-400">
                  {t(locale, "checks.model")}
                </dt>
                <dd className="tw-m-0 tw-break-words tw-text-iron-200">
                  {[entry.provider, entry.model].filter(Boolean).join(" / ") ||
                    t(locale, "checks.none")}
                </dd>
                <dt className="tw-text-iron-400">
                  {t(locale, "checks.policyVersion")}
                </dt>
                <dd className="tw-m-0 tw-break-words tw-text-iron-200">
                  {entry.policy_version}
                </dd>
                <dt className="tw-text-iron-400">
                  {t(locale, "checks.trigger")}
                </dt>
                <dd className="tw-m-0 tw-break-words tw-text-iron-200">
                  {checkValueLabel(locale, entry.trigger)}
                </dd>
                <dt className="tw-text-iron-400">
                  {t(locale, "checks.cacheHit")}
                </dt>
                <dd className="tw-m-0 tw-text-iron-200">
                  {t(locale, entry.cache_hit ? "checks.yes" : "checks.no")}
                </dd>
                {entry.fallback && (
                  <>
                    <dt className="tw-text-iron-400">
                      {t(locale, "checks.fallback")}
                    </dt>
                    <dd className="tw-m-0 tw-break-words tw-text-iron-200">
                      {entry.fallback}
                    </dd>
                  </>
                )}
              </dl>
              {entry.result && (
                <details>
                  <summary className="tw-min-h-11 tw-cursor-pointer tw-content-center tw-text-sm tw-text-iron-200 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
                    {t(locale, "checks.result")}
                  </summary>
                  <InertEvidence value={entry.result} />
                </details>
              )}
            </li>
          ))
        : detail.audit.map((entry) => (
            <li
              key={entry.id}
              className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-4"
            >
              <h4 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                {entry.action} · {date(entry.created_at)}
              </h4>
              <p className="tw-my-2 tw-break-words tw-text-sm tw-text-iron-400">
                {t(locale, "checks.actor", {
                  profile: entry.actor_profile_id ?? t(locale, "checks.system"),
                })}
              </p>
              {entry.reason && (
                <p className="tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-6 tw-text-iron-200">
                  {entry.reason}
                </p>
              )}
              <InertEvidence
                value={{
                  previous_state: entry.previous_state,
                  new_state: entry.new_state,
                  metadata: entry.metadata,
                }}
              />
            </li>
          ))}
    </ol>
  );
}
