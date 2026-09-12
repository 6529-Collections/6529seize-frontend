"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ApiModerationCheckDetail,
  ApiModerationCheckDetailActionEffectEnum,
} from "@/generated/models/ApiModerationCheckDetail";
import {
  fetchModerationCheck,
  fetchModerationReportCheck,
  fetchModerationProfileCheck,
} from "@/services/api/moderation-checks-api";
import { MODERATION_CHECKS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import {
  checkButtonClass,
  checkControlClass,
  checkValueLabel,
} from "./checks.helpers";
import CheckEvidence, { InertEvidence } from "./CheckEvidence";
import CheckActions from "./CheckActions";
import CheckHistory from "./CheckHistory";

const SECTIONS = [
  "savedEvidence",
  "context",
  "evaluations",
  "audit",
  "actions",
] as const;
type Section = (typeof SECTIONS)[number];

function CheckContext({
  detail,
}: {
  readonly detail: ApiModerationCheckDetail;
}) {
  const locale = useBrowserLocale();
  const item = detail.check;
  const date = (value: number | null) =>
    formatDate(locale, value, { dateStyle: "medium", timeStyle: "short" });
  const rows: Array<[MessageKey, string | null]> = [
    ["checks.subject", item.subject_id],
    ["checks.author", item.author_profile_id],
    ["checks.operation", item.operation],
    ["checks.version", formatInteger(locale, item.version)],
    ["checks.created", date(item.created_at)],
    ["checks.updated", date(item.updated_at)],
    ["checks.override", item.override],
    [
      "checks.suppressed",
      t(locale, item.suppressed ? "checks.yes" : "checks.no"),
    ],
    ["checks.permitExpires", date(item.permit_expires_at)],
    ["checks.permitConsumed", date(item.permit_consumed_at)],
  ];
  return (
    <div className="tw-space-y-4">
      <InertEvidence value={detail.current_state} />
      <p className="tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(
          locale,
          detail.current_revision_matches
            ? "checks.currentMatch"
            : "checks.currentMismatch"
        )}
      </p>
      <dl className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="tw-text-xs tw-text-iron-400">{t(locale, label)}</dt>
            <dd className="tw-m-0 tw-mt-1 tw-break-all tw-text-sm tw-text-iron-200">
              {value ?? t(locale, "checks.none")}
            </dd>
          </div>
        ))}
      </dl>
      <InertEvidence value={item.scope} />
    </div>
  );
}

export default function CheckDetail({
  id,
  source,
  profileId,
  onClose,
}: {
  readonly id: string;
  readonly source: "check" | "report" | "profile";
  readonly profileId: string;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const client = useQueryClient();
  const title = useRef<HTMLHeadingElement>(null);
  const [section, setSection] = useState<Section>("savedEvidence");
  const [reviewGeneration, setReviewGeneration] = useState(0);
  const [decisionSaved, setDecisionSaved] = useState(false);
  const queryKey = [
    ...MODERATION_CHECKS_QUERY_KEY,
    profileId,
    "detail",
    source,
    id,
  ];
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      if (source === "report") return fetchModerationReportCheck(id, signal);
      if (source === "profile") return fetchModerationProfileCheck(id, signal);
      return fetchModerationCheck(id, signal);
    },
    retry: false,
    gcTime: 0,
  });
  useEffect(() => {
    title.current?.focus();
  }, []);
  const detail = query.data;
  let detailTitle = t(locale, "checks.loadingDetail");
  if (detail) {
    detailTitle =
      detail.action_effect ===
      ApiModerationCheckDetailActionEffectEnum.ProfileStatus
        ? t(locale, "checks.profileStatus")
        : checkValueLabel(locale, detail.check.subject_type);
  }
  function reload() {
    void query.refetch().then((result) => {
      if (result.isSuccess) setReviewGeneration((value) => value + 1);
    });
  }
  return (
    <aside
      className="tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-4 sm:tw-p-6"
      aria-labelledby="moderation-check-title"
    >
      <button type="button" className={checkButtonClass} onClick={onClose}>
        {t(locale, "checks.back")}
      </button>
      <h2
        ref={title}
        tabIndex={-1}
        id="moderation-check-title"
        className="tw-mb-0 tw-mt-5 tw-text-lg tw-font-semibold tw-text-iron-50 focus:tw-outline-none"
      >
        {detailTitle}
      </h2>
      {query.isLoading && (
        <p role="status" className="tw-text-sm tw-text-iron-400">
          {t(locale, "checks.loadingDetail")}
        </p>
      )}
      {decisionSaved && (
        <p role="status" className="tw-mt-4 tw-text-sm tw-text-iron-200">
          {t(locale, "checks.success")}
        </p>
      )}
      {query.isError && (
        <div
          role="alert"
          className="tw-mt-4 tw-space-y-3 tw-text-sm tw-text-iron-300"
        >
          <p>
            {t(
              locale,
              getStructuredApiErrorStatus(query.error) === 404
                ? "checks.notFound"
                : "checks.error"
            )}
          </p>
          <button type="button" className={checkButtonClass} onClick={reload}>
            {t(locale, "checks.retry")}
          </button>
        </div>
      )}
      {detail && !query.isError && (
        <>
          <p className="tw-mt-2 tw-text-sm tw-text-iron-300">
            {checkValueLabel(locale, detail.check.outcome)} ·{" "}
            {checkValueLabel(locale, detail.check.policy_family)} ·{" "}
            {checkValueLabel(locale, detail.check.review_status)}
          </p>
          {detail.evidence_expired && (
            <p
              role="status"
              className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-p-3 tw-text-sm tw-leading-6 tw-text-iron-200"
            >
              {t(locale, "checks.evidenceExpired")}
            </p>
          )}
          <label className="tw-mt-5 tw-block tw-space-y-2 tw-text-sm tw-text-iron-300 lg:tw-hidden">
            <span>{t(locale, "checks.sections")}</span>
            <select
              className={checkControlClass}
              value={section}
              onChange={(event) => setSection(event.target.value as Section)}
              aria-controls={`check-section-${section}`}
            >
              {SECTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(locale, `checks.${value}`)}
                </option>
              ))}
            </select>
          </label>
          {SECTIONS.map((value) => (
            <section
              key={value}
              id={`check-section-${value}`}
              className={`tw-mt-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5 ${section === value ? "tw-block" : "tw-hidden lg:tw-block"}`}
              aria-labelledby={`check-heading-${value}`}
            >
              <h3
                id={`check-heading-${value}`}
                className="tw-mb-4 tw-mt-0 tw-text-base tw-font-semibold tw-text-iron-100"
              >
                {t(locale, `checks.${value}`)}
              </h3>
              {value === "savedEvidence" && (
                <CheckEvidence
                  evidence={detail.evidence_expired ? null : detail.evidence}
                />
              )}
              {value === "context" && <CheckContext detail={detail} />}
              {(value === "evaluations" || value === "audit") && (
                <CheckHistory detail={detail} kind={value} />
              )}
              {value === "actions" && (
                <CheckActions
                  key={`${detail.check.id}:${detail.check.version}:${reviewGeneration}`}
                  detail={detail}
                  onReload={reload}
                  onSaved={(updated) => {
                    client.setQueryData(queryKey, updated);
                    setDecisionSaved(true);
                  }}
                />
              )}
            </section>
          ))}
        </>
      )}
    </aside>
  );
}
