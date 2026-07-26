export const PUBLIC_REVIEW_LIFECYCLE_STATES = [
  "DRAFT",
  "SCHEDULED",
  "PUBLIC_REVIEW",
  "REVIEW_CLOSED",
  "REMEDIATION",
  "AUDIT",
  "FINAL_CANDIDATE",
  "DEPLOYED",
  "ARCHIVED",
] as const;

export type PublicReviewLifecycleState =
  (typeof PUBLIC_REVIEW_LIFECYCLE_STATES)[number];

type PublicReviewSecurityFindingPolicy =
  | "CLOSED"
  | "PUBLIC_REVIEW_WAVE"
  | "POST_DEPLOYMENT_POLICY";

interface PublicReviewLifecycleCapabilities {
  readonly publicRoutesAvailable: boolean;
  readonly feedbackSubmissionsOpen: boolean;
  readonly securityFindingPolicy: PublicReviewSecurityFindingPolicy;
}

const PUBLIC_REVIEW_LIFECYCLE_CAPABILITIES = {
  DRAFT: {
    publicRoutesAvailable: false,
    feedbackSubmissionsOpen: false,
    securityFindingPolicy: "CLOSED",
  },
  SCHEDULED: {
    publicRoutesAvailable: true,
    feedbackSubmissionsOpen: false,
    securityFindingPolicy: "CLOSED",
  },
  PUBLIC_REVIEW: {
    publicRoutesAvailable: true,
    feedbackSubmissionsOpen: true,
    securityFindingPolicy: "PUBLIC_REVIEW_WAVE",
  },
  REVIEW_CLOSED: {
    publicRoutesAvailable: true,
    feedbackSubmissionsOpen: false,
    securityFindingPolicy: "CLOSED",
  },
  REMEDIATION: {
    publicRoutesAvailable: true,
    feedbackSubmissionsOpen: false,
    securityFindingPolicy: "CLOSED",
  },
  AUDIT: {
    publicRoutesAvailable: true,
    feedbackSubmissionsOpen: false,
    securityFindingPolicy: "CLOSED",
  },
  FINAL_CANDIDATE: {
    publicRoutesAvailable: true,
    feedbackSubmissionsOpen: false,
    securityFindingPolicy: "CLOSED",
  },
  DEPLOYED: {
    publicRoutesAvailable: true,
    feedbackSubmissionsOpen: false,
    securityFindingPolicy: "POST_DEPLOYMENT_POLICY",
  },
  ARCHIVED: {
    publicRoutesAvailable: true,
    feedbackSubmissionsOpen: false,
    securityFindingPolicy: "CLOSED",
  },
} as const satisfies Record<
  PublicReviewLifecycleState,
  PublicReviewLifecycleCapabilities
>;

export function getPublicReviewLifecycleCapabilities(
  state: PublicReviewLifecycleState
): PublicReviewLifecycleCapabilities {
  return PUBLIC_REVIEW_LIFECYCLE_CAPABILITIES[state];
}

export function acceptsPublicReviewExploitReports(
  state: PublicReviewLifecycleState
): boolean {
  return (
    getPublicReviewLifecycleCapabilities(state).securityFindingPolicy ===
    "PUBLIC_REVIEW_WAVE"
  );
}
