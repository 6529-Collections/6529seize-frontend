import Link from "next/link";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { PublicReviewLifecycleState } from "@/lib/public-review/publicReviewLifecycle";
import type {
  PublicReviewDefinition,
  PublicReviewSource,
} from "@/lib/public-review/publicReviewTypes";

const STATUS_CHIP =
  "tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-px-2.5 tw-py-1 tw-font-mono tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-tracking-[0.08em]";

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
      className="tw-border-x-0 tw-border-y tw-border-solid tw-border-white/10 tw-bg-[#070708]/95 tw-px-4 tw-py-3 tw-backdrop-blur-xl lg:tw-sticky lg:tw-top-0 lg:tw-z-30"
    >
      <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-[88rem] tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
        <div>
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            {t(DEFAULT_LOCALE, "publicReview.status.heading")}
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-max-w-3xl tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(DEFAULT_LOCALE, lifecycleCopy.explanation)}
          </p>
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <span
            className={`${STATUS_CHIP} tw-border-amber-400/30 tw-bg-amber-400/[0.07] tw-text-amber-100`}
          >
            {t(DEFAULT_LOCALE, lifecycleCopy.label)}
          </span>
          <span
            className={`${STATUS_CHIP} tw-border-sky-400/30 tw-bg-sky-400/[0.07] tw-text-sky-100`}
          >
            {t(
              DEFAULT_LOCALE,
              DEPLOYMENT_LABELS[displayedReviewVersion.deploymentStatus]
            )}
          </span>
          <span
            className={`${STATUS_CHIP} tw-border-orange-400/30 tw-bg-orange-400/[0.07] tw-text-orange-100`}
          >
            {t(
              DEFAULT_LOCALE,
              AUDIT_LABELS[displayedReviewVersion.auditStatus]
            )}
          </span>
          <span
            className={`${STATUS_CHIP} tw-border-white/10 tw-text-iron-300`}
          >
            {t(DEFAULT_LOCALE, "publicReview.status.version", {
              version: displayedVersion,
            })}
          </span>
          {isHistoricalVersion ? (
            <Link
              href={`/reviews/${review.slug}`}
              className={`${STATUS_CHIP} tw-border-violet-400/30 tw-bg-violet-400/[0.07] tw-text-violet-100 tw-no-underline hover:tw-border-violet-300 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white`}
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
            className={`${STATUS_CHIP} tw-border-white/10 tw-text-iron-300 tw-no-underline hover:tw-border-white/25 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white`}
          >
            {t(DEFAULT_LOCALE, "publicReview.status.source", {
              commit: shortCommit,
            })}
          </a>
        </div>
      </div>
    </section>
  );
}
