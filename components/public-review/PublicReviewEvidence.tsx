import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { PublicReviewEvidenceState } from "@/lib/public-review/publicReviewTypes";

const EVIDENCE_PRESENTATION: Record<
  PublicReviewEvidenceState,
  {
    readonly labelKey: MessageKey;
    readonly descriptionKey: MessageKey;
    readonly dotClassName: string;
    readonly textClassName: string;
  }
> = {
  IMPLEMENTED: {
    labelKey: "publicReview.evidence.labels.implemented",
    descriptionKey: "publicReview.evidence.implemented",
    dotClassName: "tw-bg-emerald-400",
    textClassName: "tw-text-emerald-300",
  },
  TESTED: {
    labelKey: "publicReview.evidence.labels.tested",
    descriptionKey: "publicReview.evidence.tested",
    dotClassName: "tw-bg-sky-400",
    textClassName: "tw-text-sky-300",
  },
  PROPOSED: {
    labelKey: "publicReview.evidence.labels.proposed",
    descriptionKey: "publicReview.evidence.proposed",
    dotClassName: "tw-bg-violet-400",
    textClassName: "tw-text-violet-300",
  },
  OPEN_FOR_FEEDBACK: {
    labelKey: "publicReview.evidence.labels.openForFeedback",
    descriptionKey: "publicReview.evidence.openForFeedback",
    dotClassName: "tw-bg-amber-400",
    textClassName: "tw-text-amber-300",
  },
  AUDIT_PENDING: {
    labelKey: "publicReview.evidence.labels.auditPending",
    descriptionKey: "publicReview.evidence.auditPending",
    dotClassName: "tw-bg-orange-400",
    textClassName: "tw-text-orange-300",
  },
  DEFERRED: {
    labelKey: "publicReview.evidence.labels.deferred",
    descriptionKey: "publicReview.evidence.deferred",
    dotClassName: "tw-bg-iron-500",
    textClassName: "tw-text-iron-400",
  },
  KNOWN_LIMITATION: {
    labelKey: "publicReview.evidence.labels.knownLimitation",
    descriptionKey: "publicReview.evidence.knownLimitation",
    dotClassName: "tw-bg-red-400",
    textClassName: "tw-text-red-300",
  },
};

function PublicReviewEvidenceBadge({
  state,
}: {
  readonly state: PublicReviewEvidenceState;
}) {
  const presentation = EVIDENCE_PRESENTATION[state];
  return (
    <span
      className={`tw-inline-flex tw-items-center tw-gap-2 tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-tracking-[0.1em] ${presentation.textClassName}`}
    >
      <span
        aria-hidden="true"
        className={`tw-size-1.5 tw-flex-none ${presentation.dotClassName}`}
      />
      {t(DEFAULT_LOCALE, presentation.labelKey)}
    </span>
  );
}

export function PublicReviewEvidenceLegend() {
  return (
    <details className="tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.09] tw-py-4">
      <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-200 marker:tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
        {t(DEFAULT_LOCALE, "publicReview.evidence.summary")}
      </summary>
      <h2 className="tw-mb-0 tw-mt-4 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
        {t(DEFAULT_LOCALE, "publicReview.evidence.heading")}
      </h2>
      <dl className="tw-mb-0 tw-mt-5 tw-grid tw-gap-x-8 tw-gap-y-5 sm:tw-grid-cols-2">
        {Object.entries(EVIDENCE_PRESENTATION).map(([state, presentation]) => (
          <div key={state}>
            <dt>
              <PublicReviewEvidenceBadge
                state={state as PublicReviewEvidenceState}
              />
            </dt>
            <dd className="tw-mb-0 tw-ml-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(DEFAULT_LOCALE, presentation.descriptionKey)}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
