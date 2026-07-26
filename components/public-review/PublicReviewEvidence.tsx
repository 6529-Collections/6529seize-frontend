import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { PublicReviewEvidenceState } from "@/lib/public-review/publicReviewTypes";

const EVIDENCE_PRESENTATION: Record<
  PublicReviewEvidenceState,
  {
    readonly labelKey: MessageKey;
    readonly descriptionKey: MessageKey;
    readonly className: string;
  }
> = {
  IMPLEMENTED: {
    labelKey: "publicReview.evidence.labels.implemented",
    descriptionKey: "publicReview.evidence.implemented",
    className: "tw-border-emerald-400/40 tw-bg-emerald-400/10 tw-text-emerald-200",
  },
  TESTED: {
    labelKey: "publicReview.evidence.labels.tested",
    descriptionKey: "publicReview.evidence.tested",
    className: "tw-border-sky-400/40 tw-bg-sky-400/10 tw-text-sky-200",
  },
  PROPOSED: {
    labelKey: "publicReview.evidence.labels.proposed",
    descriptionKey: "publicReview.evidence.proposed",
    className: "tw-border-violet-400/40 tw-bg-violet-400/10 tw-text-violet-200",
  },
  OPEN_FOR_FEEDBACK: {
    labelKey: "publicReview.evidence.labels.openForFeedback",
    descriptionKey: "publicReview.evidence.openForFeedback",
    className: "tw-border-amber-400/40 tw-bg-amber-400/10 tw-text-amber-100",
  },
  AUDIT_PENDING: {
    labelKey: "publicReview.evidence.labels.auditPending",
    descriptionKey: "publicReview.evidence.auditPending",
    className: "tw-border-orange-400/40 tw-bg-orange-400/10 tw-text-orange-100",
  },
  DEFERRED: {
    labelKey: "publicReview.evidence.labels.deferred",
    descriptionKey: "publicReview.evidence.deferred",
    className: "tw-border-iron-500 tw-bg-iron-800 tw-text-iron-200",
  },
  KNOWN_LIMITATION: {
    labelKey: "publicReview.evidence.labels.knownLimitation",
    descriptionKey: "publicReview.evidence.knownLimitation",
    className: "tw-border-red-400/40 tw-bg-red-400/10 tw-text-red-100",
  },
};

export function PublicReviewEvidenceBadge({
  state,
}: {
  readonly state: PublicReviewEvidenceState;
}) {
  const presentation = EVIDENCE_PRESENTATION[state];
  const description = t(DEFAULT_LOCALE, presentation.descriptionKey);

  return (
    <span
      aria-label={description}
      title={description}
      className={`tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-px-2.5 tw-py-1 tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-[0.08em] ${presentation.className}`}>
      {t(DEFAULT_LOCALE, presentation.labelKey)}
    </span>
  );
}

export function PublicReviewEvidenceLegend() {
  return (
    <details className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/80 tw-p-4">
      <summary className="tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-100 marker:tw-text-iron-400">
        {t(DEFAULT_LOCALE, "publicReview.evidence.summary")}
      </summary>
      <h2 className="tw-mb-0 tw-mt-4 tw-text-sm tw-font-semibold tw-text-white">
        {t(DEFAULT_LOCALE, "publicReview.evidence.heading")}
      </h2>
      <dl className="tw-mb-0 tw-mt-4 tw-space-y-4">
        {Object.entries(EVIDENCE_PRESENTATION).map(
          ([state, presentation]) => (
            <div key={state}>
              <dt>
                <PublicReviewEvidenceBadge
                  state={state as PublicReviewEvidenceState}
                />
              </dt>
              <dd className="tw-mb-0 tw-ml-0 tw-mt-1.5 tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(DEFAULT_LOCALE, presentation.descriptionKey)}
              </dd>
            </div>
          )
        )}
      </dl>
    </details>
  );
}
