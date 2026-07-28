import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { PublicReviewLifecycleState } from "@/lib/public-review/publicReviewLifecycle";
import type {
  PublicReviewDefinition,
  PublicReviewSource,
} from "@/lib/public-review/publicReviewTypes";

const STATUS_ITEM =
  "tw-inline-flex tw-min-h-8 tw-items-center tw-whitespace-nowrap tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-tracking-[0.1em]";

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
      className="tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.1] tw-py-4 tw-@container"
    >
      <div className="tw-flex tw-w-full tw-flex-col tw-gap-3 @[720px]:tw-flex-row @[720px]:tw-items-start @[720px]:tw-justify-between @[720px]:tw-gap-8">
        <div className="tw-min-w-0 @[720px]:tw-max-w-2xl">
          <p className="tw-m-0 tw-text-[0.68rem] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-amber-300">
            {t(DEFAULT_LOCALE, lifecycleCopy.label)}
          </p>
          <p className="tw-mb-0 tw-mt-1.5 tw-text-[0.8125rem] tw-leading-5 tw-text-iron-400">
            {t(DEFAULT_LOCALE, lifecycleCopy.explanation)}
          </p>
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1 @[720px]:tw-flex-none @[720px]:tw-justify-end">
          <span className={`${STATUS_ITEM} tw-text-sky-300`}>
            {t(
              DEFAULT_LOCALE,
              DEPLOYMENT_LABELS[displayedReviewVersion.deploymentStatus]
            )}
          </span>
          <span className={`${STATUS_ITEM} tw-text-orange-300`}>
            {t(
              DEFAULT_LOCALE,
              AUDIT_LABELS[displayedReviewVersion.auditStatus]
            )}
          </span>
          <span className={`${STATUS_ITEM} tw-text-iron-400`}>
            {t(DEFAULT_LOCALE, "publicReview.status.version", {
              version: displayedVersion,
            })}
          </span>
          {isHistoricalVersion ? (
            <Link
              href={`/reviews/${review.slug}`}
              className={`${STATUS_ITEM} tw-text-violet-300 tw-no-underline hover:tw-text-violet-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white`}
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
            className={`${STATUS_ITEM} tw-group tw-gap-1.5 tw-text-iron-300 tw-no-underline hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white`}
          >
            {t(DEFAULT_LOCALE, "publicReview.status.source", {
              commit: shortCommit,
            })}
            <ArrowTopRightOnSquareIcon
              className="tw-size-3 tw-flex-none tw-text-iron-500 tw-transition-colors group-hover:tw-text-iron-300"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
