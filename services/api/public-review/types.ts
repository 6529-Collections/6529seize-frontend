import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";

export const PUBLIC_REVIEW_FEEDBACK_SCHEMA_VERSION = "1" as const;
export const PUBLIC_REVIEW_INITIAL_VERSION = "2026-07-26.1" as const;
export const PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE =
  "possible-exploitable-security-vulnerability" as const;

export type PublicReviewEnvironment = "local" | "staging" | "production";

export interface PublicReviewDiscussionDestination {
  readonly logicalKey: string;
  readonly environment: PublicReviewEnvironment;
  readonly waveId: string;
}

export interface PublicReviewOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string | undefined;
}

export interface PublicReviewPageOption extends PublicReviewOption {
  readonly sectionValues?: readonly string[] | undefined;
}

export interface PublicReviewSourceFile {
  readonly path: string;
  readonly lineCount: number;
  readonly sha256: string;
}

export interface PublicReviewSourceConfig {
  readonly repository: string;
  readonly commit: string;
  readonly files: readonly PublicReviewSourceFile[];
}

export interface PublicReviewFeedbackConfig {
  readonly reviewId: string;
  readonly reviewVersion: string;
  readonly reviewTitle: string;
  readonly feedbackSchemaVersion: string;
  readonly submissionsOpen: boolean;
  readonly categories: readonly PublicReviewOption[];
  readonly severityOptions: readonly PublicReviewOption[];
  readonly pages: readonly PublicReviewPageOption[];
  readonly source?: PublicReviewSourceConfig | undefined;
}

export interface PublicReviewPageContext {
  readonly pageId: string;
  readonly pageTitle: string;
  readonly canonicalPath: string;
  readonly sectionId?: string | undefined;
  readonly sectionTitle?: string | undefined;
}

export interface PublicReviewDocumentationSelection {
  readonly kind: "documentation";
  readonly quote?: string | undefined;
}

export interface PublicReviewCodeSelection {
  readonly kind: "code";
  readonly path: string;
  readonly sourceSha256: string;
  readonly lineStart: string | number;
  readonly lineEnd: string | number;
  readonly contract?: string | undefined;
  readonly declaration?: string | undefined;
  readonly snippetSha256?: string | undefined;
}

export type PublicReviewReferenceSelection =
  | PublicReviewDocumentationSelection
  | PublicReviewCodeSelection;

export interface PublicReviewDocumentationReference {
  readonly kind: "documentation";
  readonly quote?: string | undefined;
}

export interface PublicReviewCodeReference {
  readonly kind: "code";
  readonly repository: string;
  readonly commit: string;
  readonly path: string;
  readonly sourceSha256: string;
  readonly lineStart: number;
  readonly lineEnd: number;
  readonly contract?: string | undefined;
  readonly declaration?: string | undefined;
  readonly snippetSha256?: string | undefined;
}

export type PublicReviewReference =
  | PublicReviewDocumentationReference
  | PublicReviewCodeReference;

export interface PublicReviewFeedbackDraft {
  readonly category: string;
  readonly severity: string;
  readonly comment: string;
  readonly whyItMatters: string;
  readonly suggestedChange: string;
  readonly preconditions: string;
  readonly expectedBehavior: string;
  readonly observedBehavior: string;
  readonly reproduction: string;
}

export interface PublicReviewFeedbackSigner {
  readonly address: string;
  readonly isSafeWallet: boolean;
}

export interface PublicReviewFeedbackContext {
  readonly submissionId: string;
  readonly reviewId: string;
  readonly reviewVersion: string;
  readonly pageId: string;
  readonly sectionId?: string | undefined;
  readonly reference?: PublicReviewReference | undefined;
}

export interface PublicReviewFeedbackRecord {
  readonly feedbackId: string;
  readonly dropId: string;
  readonly serialNo: number;
  readonly destination: PublicReviewDiscussionDestination;
  readonly reviewId: string;
  readonly reviewVersion: string;
  readonly category: string;
  readonly severity: string;
  readonly pageId: string;
  readonly sectionId?: string | undefined;
  readonly reference?: PublicReviewReference | undefined;
  readonly author: {
    readonly id: string;
    readonly handle: string | null;
    readonly pfp: string | null;
  };
  readonly createdAt: number;
  readonly body: string;
  readonly reactionsCount: number;
  readonly disposition: "NEW";
  readonly discussionPath: string;
}

export type PublicReviewLedgerWarningCode =
  | "INVALID_REVIEW_METADATA"
  | "METADATA_HYDRATION_FAILED";

export interface PublicReviewLedgerWarning {
  readonly code: PublicReviewLedgerWarningCode;
  readonly dropId: string;
}

export interface PublicReviewLedgerPage {
  readonly destination: PublicReviewDiscussionDestination;
  readonly records: readonly PublicReviewFeedbackRecord[];
  readonly warnings: readonly PublicReviewLedgerWarning[];
  readonly nextCursor: number | null;
  readonly rawDropCount: number;
}

export interface PublicReviewLedgerFilters {
  readonly category: string;
  readonly pageId: string;
  readonly contract: string;
  readonly severity: string;
  readonly disposition: string;
  readonly search: string;
}

export type PublicReviewFeedbackSubmitter = (input: {
  readonly destination: PublicReviewDiscussionDestination;
  readonly payload: ApiCreateDropRequest;
  readonly signal?: AbortSignal | undefined;
}) => Promise<ApiDrop>;
