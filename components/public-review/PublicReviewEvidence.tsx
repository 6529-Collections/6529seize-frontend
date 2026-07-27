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
    className:
      "tw-border-emerald-400/15 tw-bg-emerald-400/[0.08] tw-text-emerald-400/90",
  },
  TESTED: {
    labelKey: "publicReview.evidence.labels.tested",
    descriptionKey: "publicReview.evidence.tested",
    className:
      "tw-border-blue-400/15 tw-bg-blue-400/[0.08] tw-text-blue-400/90",
  },
  PROPOSED: {
    labelKey: "publicReview.evidence.labels.proposed",
    descriptionKey: "publicReview.evidence.proposed",
    className:
      "tw-border-violet-400/15 tw-bg-violet-400/[0.08] tw-text-violet-400/90",
  },
  OPEN_FOR_FEEDBACK: {
    labelKey: "publicReview.evidence.labels.openForFeedback",
    descriptionKey: "publicReview.evidence.openForFeedback",
    className:
      "tw-border-amber-400/15 tw-bg-amber-400/[0.08] tw-text-amber-400/90",
  },
  AUDIT_PENDING: {
    labelKey: "publicReview.evidence.labels.auditPending",
    descriptionKey: "publicReview.evidence.auditPending",
    className:
      "tw-border-orange-400/15 tw-bg-orange-400/[0.08] tw-text-orange-400/90",
  },
  DEFERRED: {
    labelKey: "publicReview.evidence.labels.deferred",
    descriptionKey: "publicReview.evidence.deferred",
    className: "tw-border-white/[0.08] tw-bg-white/[0.03] tw-text-iron-400",
  },
  KNOWN_LIMITATION: {
    labelKey: "publicReview.evidence.labels.knownLimitation",
    descriptionKey: "publicReview.evidence.knownLimitation",
    className:
      "tw-border-pink-400/15 tw-bg-pink-400/[0.08] tw-text-pink-400/90",
  },
};

export function PublicReviewEvidenceBadge({
  state,
}: {
  readonly state: PublicReviewEvidenceState;
}) {
  const presentation = EVIDENCE_PRESENTATION[state];
  return (
    <span
      className={`tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-px-3.5 tw-py-1.5 tw-text-[0.65rem] tw-font-medium tw-uppercase tw-tracking-[0.08em] ${presentation.className}`}
    >
      {t(DEFAULT_LOCALE, presentation.labelKey)}
    </span>
  );
}

export function PublicReviewEvidenceLegend() {
  return (
    <details className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/55 tw-p-4">
      <summary className="tw-cursor-pointer tw-rounded tw-text-sm tw-font-semibold tw-text-iron-100 marker:tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
        {t(DEFAULT_LOCALE, "publicReview.evidence.summary")}
      </summary>
      <h2 className="tw-mb-0 tw-mt-4 tw-text-sm tw-font-semibold tw-text-white">
        {t(DEFAULT_LOCALE, "publicReview.evidence.heading")}
      </h2>
      <dl className="tw-mb-0 tw-mt-4 tw-space-y-4">
        {Object.entries(EVIDENCE_PRESENTATION).map(([state, presentation]) => (
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
        ))}
      </dl>
    </details>
  );
}
