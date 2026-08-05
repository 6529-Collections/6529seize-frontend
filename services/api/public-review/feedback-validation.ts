import type {
  PublicReviewFeedbackConfig,
  PublicReviewSourceConfig,
} from "./types";
import { PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE } from "./types";

const COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const SHA256_URN_PATTERN = /^sha256:[0-9a-f]{64}$/;
const OPTION_SEGMENT_PATTERN = /^[a-z0-9]+$/;

export class PublicReviewFeedbackValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(issues[0] ?? "Public review feedback is invalid.");
    this.name = "PublicReviewFeedbackValidationError";
    this.issues = issues;
  }
}

export function isPublicReviewSha256Urn(value: string): boolean {
  return SHA256_URN_PATTERN.test(value);
}

function isValidOptionValue(value: string): boolean {
  if (!value || value.length > 120) {
    return false;
  }
  return value
    .split(/[._-]/)
    .every((segment) => OPTION_SEGMENT_PATTERN.test(segment));
}

function validateOptionList(
  label: string,
  options: PublicReviewFeedbackConfig["categories"]
): string[] {
  const issues: string[] = [];
  const values = new Set<string>();

  for (const option of options) {
    if (!isValidOptionValue(option.value)) {
      issues.push(`${label} contains an invalid value.`);
    }
    if (values.has(option.value)) {
      issues.push(`${label} contains a duplicate value.`);
    }
    values.add(option.value);
  }

  if (options.length === 0) {
    issues.push(`${label} must contain at least one option.`);
  }
  return issues;
}

function validateSourceConfig(source: PublicReviewSourceConfig): string[] {
  const issues: string[] = [];
  if (!/^[^/\s]+\/[^/\s]+$/.test(source.repository)) {
    issues.push("The source repository must use the owner/repository format.");
  }
  if (!COMMIT_PATTERN.test(source.commit)) {
    issues.push("The source commit must be a lowercase 40-character hash.");
  }

  const paths = new Set<string>();
  for (const file of source.files) {
    if (
      !file.path ||
      file.path.startsWith("/") ||
      file.path.includes("\\") ||
      file.path.split("/").includes("..")
    ) {
      issues.push("A source file has an invalid repository-relative path.");
    }
    if (paths.has(file.path)) {
      issues.push("The source configuration contains a duplicate file path.");
    }
    paths.add(file.path);
    if (!Number.isInteger(file.lineCount) || file.lineCount < 1) {
      issues.push("A source file has an invalid line count.");
    }
    if (!isPublicReviewSha256Urn(file.sha256)) {
      issues.push("A source file has an invalid SHA-256 checksum URN.");
    }
  }
  return issues;
}

export function validatePublicReviewFeedbackConfig(
  config: PublicReviewFeedbackConfig
): void {
  const issues = [
    ...validateOptionList("Feedback categories", config.categories),
    ...validateOptionList("Severity options", config.severityOptions),
  ];
  const hasExploitCategory = config.categories.some(
    (option) => option.value === PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE
  );
  if (config.acceptsPublicExploitReports && !hasExploitCategory) {
    issues.push(
      `Feedback categories must include ${PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE} while public exploit reports are accepted.`
    );
  }
  if (config.acceptsPublicExploitReports && !config.submissionsOpen) {
    issues.push(
      "Public exploit reports cannot be accepted while feedback submissions are closed."
    );
  }
  if (!config.reviewId.trim()) {
    issues.push("The review id is required.");
  }
  if (!config.reviewVersion.trim()) {
    issues.push("The review version is required.");
  }
  if (!config.feedbackSchemaVersion.trim()) {
    issues.push("The feedback schema version is required.");
  }

  const pageIds = new Set<string>();
  for (const page of config.pages) {
    if (!isValidOptionValue(page.value)) {
      issues.push("A review page has an invalid id.");
    }
    if (pageIds.has(page.value)) {
      issues.push("The review configuration contains a duplicate page id.");
    }
    pageIds.add(page.value);
  }
  if (config.pages.length === 0) {
    issues.push("The review configuration must contain at least one page.");
  }
  if (config.source) {
    issues.push(...validateSourceConfig(config.source));
  }
  if (issues.length > 0) {
    throw new PublicReviewFeedbackValidationError(issues);
  }
}
