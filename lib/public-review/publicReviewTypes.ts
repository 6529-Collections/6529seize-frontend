import type { MessageKey } from "@/i18n/messages";
import type { PublicReviewLifecycleState } from "./publicReviewLifecycle";

export const PUBLIC_REVIEW_EVIDENCE_STATES = [
  "IMPLEMENTED",
  "TESTED",
  "PROPOSED",
  "OPEN_FOR_FEEDBACK",
  "AUDIT_PENDING",
  "DEFERRED",
  "KNOWN_LIMITATION",
] as const;

export type PublicReviewEvidenceState =
  (typeof PUBLIC_REVIEW_EVIDENCE_STATES)[number];

export const PUBLIC_REVIEW_AUDIENCES = [
  "community",
  "artists",
  "technical",
  "auditors",
] as const;

export type PublicReviewAudience = (typeof PUBLIC_REVIEW_AUDIENCES)[number];

export interface PublicReviewPageDefinition {
  readonly id: string;
  readonly slug: string;
  readonly titleKey: MessageKey;
  readonly summaryKey: MessageKey;
  readonly editorialFile: string;
  readonly audiences: readonly PublicReviewAudience[];
  readonly evidenceStates: readonly PublicReviewEvidenceState[];
}

export interface PublicReviewSectionDefinition {
  readonly id: string;
  readonly title: string;
}

export interface PublicReviewSource {
  readonly repository: string;
  readonly commit: string;
}

export interface PublicReviewVersionDefinition {
  readonly version: string;
  readonly source: PublicReviewSource;
  readonly pages: readonly PublicReviewPageDefinition[];
  readonly audienceEntryPageIds: Readonly<Record<PublicReviewAudience, string>>;
  readonly status: PublicReviewLifecycleState;
  readonly deploymentStatus: "NOT_DEPLOYED" | "DEPLOYED";
  readonly auditStatus: "PRE_AUDIT" | "AUDIT_IN_PROGRESS" | "AUDIT_COMPLETE";
}

export interface PublicReviewDefinition {
  readonly id: string;
  readonly slug: string;
  readonly contractName: string;
  readonly title: string;
  readonly description: string;
  readonly activeVersion: string;
  readonly versions: readonly PublicReviewVersionDefinition[];
  readonly status: PublicReviewLifecycleState;
  readonly deploymentStatus: "NOT_DEPLOYED" | "DEPLOYED";
  readonly auditStatus: "PRE_AUDIT" | "AUDIT_IN_PROGRESS" | "AUDIT_COMPLETE";
  readonly feedbackAvailable: boolean;
}
