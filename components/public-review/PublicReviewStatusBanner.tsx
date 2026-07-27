import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { PublicReviewLifecycleState } from "@/lib/public-review/publicReviewLifecycle";
import type {
  PublicReviewDefinition,
  PublicReviewSource,
} from "@/lib/public-review/publicReviewTypes";

const STATUS_CHIP =
  "tw-inline-flex tw-items-center tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-px-3.5 tw-py-1.5 tw-text-[0.65rem] tw-font-medium tw-uppercase tw-tracking-[0.08em] tw-transition-colors tw-duration-200 tw-ease-out";

const LIFECYCLE_COPY: Record<
  PublicReviewLifecycleState,
  {
    readonly explanation: MessageKey;
    readonly label: MessageKey;
  }
> = {
  DRAFT: {
    explanation: "publicReview.status.explanations.draft",
    label: "publicReview.status.lifecycle.draft",
  },
  SCHEDULED: {
    explanation: "publicReview.status.explanations.scheduled",
    label: "publicReview.status.lifecycle.scheduled",
  },
  PUBLIC_REVIEW: {
    explanation: "publicReview.status.explanations.publicReview",
    label: "publicReview.status.lifecycle.publicReview",
  },
  REVIEW_CLOSED: {
    explanation: "publicReview.status.explanations.reviewClosed",
    label: "publicReview.status.lifecycle.reviewClosed",
  },
  REMEDIATION: {
    explanation: "publicReview.status.explanations.remediation",
    label: "publicReview.status.lifecycle.remediation",
  },
  AUDIT: {
    explanation: "publicReview.status.explanations.audit",
    label: "publicReview.status.lifecycle.audit",
  },
  FINAL_CANDIDATE: {
    explanation: "publicReview.status.explanations.finalCandidate",
    label: "publicReview.status.lifecycle.finalCandidate",
  },
  DEPLOYED: {
    explanation: "publicReview.status.explanations.deployed",
    label: "publicReview.status.lifecycle.deployed",
  },
  ARCHIVED: {
    explanation: "publicReview.status.explanations.archived",
    label: "publicReview.status.lifecycle.archived",
  },
};

const DEPLOYMENT_LABELS = {
  NOT_DEPLOYED: "publicReview.status.deployment.notDeployed",
  DEPLOYED: "publicReview.status.deployment.deployed",
} as const satisfies Record<
  PublicReviewDefinition["deploymentStatus"],
  MessageKey
>;

const AUDIT_LABELS = {
  PRE_AUDIT: "publicReview.status.audit.preAudit",
  AUDIT_IN_PROGRESS: "publicReview.status.audit.inProgress",
  AUDIT_COMPLETE: "publicReview.status.audit.complete",
} as const satisfies Record<PublicReviewDefinition["auditStatus"], MessageKey>;

export function PublicReviewStatusBanner({
  review,
  displayedVersion,
  source,
}: {
  readonly review: PublicReviewDefinition;
  readonly displayedVersion: string;
  readonly source?: PublicReviewSource | undefined;
}) {
  const displayedReviewVersion = review.versions.find(
    (candidate) => candidate.version === displayedVersion
  );
  if (!displayedReviewVersion) {
    throw new Error("The displayed public-review version is not configured.");
  }
  const resolvedSource = source ?? displayedReviewVersion.source;
  const shortCommit = resolvedSource.commit.slice(0, 10);
  const sourceUrl = `https://github.com/${resolvedSource.repository}/tree/${resolvedSource.commit}`;
  const lifecycleCopy = LIFECYCLE_COPY[displayedReviewVersion.status];
  const isHistoricalVersion = displayedVersion !== review.activeVersion;

  return (
    <section
      aria-label={t(DEFAULT_LOCALE, "publicReview.status.heading")}
      className="tw-@container tw-rounded-xl tw-border tw-border-solid tw-border-amber-400/15 tw-bg-amber-400/[0.025] tw-px-4 tw-py-3.5 sm:tw-px-5 sm:tw-py-4"
    >
      <div className="tw-flex tw-w-full tw-flex-col tw-gap-4 @[720px]:tw-flex-row @[720px]:tw-items-center @[720px]:tw-justify-between">
        <div className="tw-min-w-0 @[720px]:tw-max-w-xl">
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
            {t(DEFAULT_LOCALE, "publicReview.status.heading")}
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-[0.8125rem] tw-leading-5 tw-text-iron-400">
            {t(DEFAULT_LOCALE, lifecycleCopy.explanation)}
          </p>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2 @[720px]:tw-flex-none @[720px]:tw-items-end">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 @[720px]:tw-justify-end">
            <span
              className={`${STATUS_CHIP} tw-border-amber-400/15 tw-bg-amber-400/[0.08] tw-text-amber-400/90`}
            >
              {t(DEFAULT_LOCALE, lifecycleCopy.label)}
            </span>
            <span
              className={`${STATUS_CHIP} tw-border-blue-400/15 tw-bg-blue-400/[0.08] tw-text-blue-400/90`}
            >
              {t(
                DEFAULT_LOCALE,
                DEPLOYMENT_LABELS[displayedReviewVersion.deploymentStatus]
              )}
            </span>
            <span
              className={`${STATUS_CHIP} tw-border-orange-400/15 tw-bg-orange-400/[0.08] tw-text-orange-400/90`}
            >
              {t(
                DEFAULT_LOCALE,
                AUDIT_LABELS[displayedReviewVersion.auditStatus]
              )}
            </span>
          </div>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 @[720px]:tw-justify-end">
            <span
              className={`${STATUS_CHIP} tw-border-white/[0.08] tw-bg-white/[0.05] tw-text-iron-400`}
            >
              {t(DEFAULT_LOCALE, "publicReview.status.version", {
                version: displayedVersion,
              })}
            </span>
            {isHistoricalVersion ? (
              <Link
                href={`/reviews/${review.slug}`}
                className={`${STATUS_CHIP} tw-border-violet-400/15 tw-bg-violet-400/[0.08] tw-text-violet-400/90 tw-no-underline hover:tw-border-violet-300/30 hover:tw-bg-violet-400/[0.12] hover:tw-text-violet-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white`}
              >
                {t(DEFAULT_LOCALE, "publicReview.status.viewCurrentVersion")}
              </Link>
            ) : null}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={t(
                DEFAULT_LOCALE,
                "publicReview.status.sourceAriaLabel",
                {
                  commit: resolvedSource.commit,
                  contract: review.contractName,
                }
              )}
              className={`${STATUS_CHIP} tw-group tw-gap-2 tw-border-white/[0.08] tw-bg-white/[0.05] tw-text-iron-400 tw-no-underline hover:tw-border-white/15 hover:tw-bg-white/[0.08] hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white`}
            >
              {t(DEFAULT_LOCALE, "publicReview.status.source", {
                commit: shortCommit,
              })}
              <ArrowTopRightOnSquareIcon
                className="tw-size-3 tw-flex-none tw-text-iron-500 tw-transition-colors tw-duration-200 tw-ease-out group-hover:tw-text-iron-300"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
