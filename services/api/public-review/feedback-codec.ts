import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDropMetadata } from "@/generated/models/ApiDropMetadata";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { getAddress, isAddress } from "viem";
import type {
  PublicReviewCodeReference,
  PublicReviewCodeSelection,
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackConfig,
  PublicReviewFeedbackContext,
  PublicReviewFeedbackDraft,
  PublicReviewFeedbackSigner,
  PublicReviewPageContext,
  PublicReviewReference,
  PublicReviewReferenceSelection,
  PublicReviewSourceConfig,
} from "./types";
import {
  isPublicReviewSha256Urn,
  PublicReviewFeedbackValidationError,
  validatePublicReviewFeedbackConfig,
} from "./feedback-validation";

export {
  PublicReviewFeedbackValidationError,
  validatePublicReviewFeedbackConfig,
} from "./feedback-validation";

export const PUBLIC_REVIEW_METADATA_KEYS = [
  "review_schema",
  "type",
  "severity",
  "context",
] as const;

export const PUBLIC_REVIEW_DROP_CONTENT_LIMIT = 25_000;
export const PUBLIC_REVIEW_METADATA_VALUE_LIMIT = 5_000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface FeedbackMetadataValues {
  readonly schema: string;
  readonly category: string;
  readonly severity: string;
  readonly context: PublicReviewFeedbackContext;
}

export type PublicReviewMetadataDecodeResult =
  | { readonly ok: true; readonly value: FeedbackMetadataValues }
  | { readonly ok: false; readonly reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[]
): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === expectedKeys.length &&
    keys.every((key, index) => key === expectedKeys[index])
  );
}

function getAllowedOption(
  options: PublicReviewFeedbackConfig["categories"],
  value: string
) {
  return options.find((option) => option.value === value);
}

function parsePositiveDecimalLine(
  value: string | number,
  label: string
): number {
  if (typeof value === "number") {
    if (Number.isSafeInteger(value) && value > 0) {
      return value;
    }
    throw new PublicReviewFeedbackValidationError([
      `${label} must be a positive integer.`,
    ]);
  }

  if (!/^[1-9]\d*$/.test(value)) {
    throw new PublicReviewFeedbackValidationError([
      `${label} must contain a positive decimal integer.`,
    ]);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new PublicReviewFeedbackValidationError([
      `${label} is outside the supported integer range.`,
    ]);
  }
  return parsed;
}

function normalizeCodeReference({
  selection,
  source,
}: {
  readonly selection: PublicReviewCodeSelection;
  readonly source: PublicReviewSourceConfig | undefined;
}): PublicReviewCodeReference {
  if (!source) {
    throw new PublicReviewFeedbackValidationError([
      "Code feedback requires a pinned source configuration.",
    ]);
  }

  const file = source.files.find(
    (candidate) => candidate.path === selection.path
  );
  if (!file) {
    throw new PublicReviewFeedbackValidationError([
      "The selected source file is not part of this review version.",
    ]);
  }
  if (selection.sourceSha256 !== file.sha256) {
    throw new PublicReviewFeedbackValidationError([
      "The selected source checksum does not match this review version.",
    ]);
  }

  const lineStart = parsePositiveDecimalLine(
    selection.lineStart,
    "The first source line"
  );
  const lineEnd = parsePositiveDecimalLine(
    selection.lineEnd,
    "The last source line"
  );
  if (lineStart > lineEnd) {
    throw new PublicReviewFeedbackValidationError([
      "The first source line must not be after the last source line.",
    ]);
  }
  if (lineEnd > file.lineCount) {
    throw new PublicReviewFeedbackValidationError([
      "The selected source lines are outside the pinned file.",
    ]);
  }
  if (
    selection.snippetSha256 !== undefined &&
    !isPublicReviewSha256Urn(selection.snippetSha256)
  ) {
    throw new PublicReviewFeedbackValidationError([
      "The selected source snippet checksum is invalid.",
    ]);
  }

  return {
    kind: "code",
    repository: source.repository,
    commit: source.commit,
    path: file.path,
    sourceSha256: file.sha256,
    lineStart,
    lineEnd,
    ...(selection.contract ? { contract: selection.contract } : {}),
    ...(selection.declaration ? { declaration: selection.declaration } : {}),
    ...(selection.snippetSha256
      ? { snippetSha256: selection.snippetSha256 }
      : {}),
  };
}

export function normalizePublicReviewReference({
  config,
  selection,
}: {
  readonly config: PublicReviewFeedbackConfig;
  readonly selection: PublicReviewReferenceSelection | undefined;
}): PublicReviewReference | undefined {
  if (selection === undefined) {
    return undefined;
  }
  if (selection.kind === "documentation") {
    const quote = selection.quote?.trim();
    return {
      kind: "documentation",
      ...(quote ? { quote } : {}),
    };
  }
  return normalizeCodeReference({ selection, source: config.source });
}

function buildFeedbackContext({
  config,
  page,
  reference,
  submissionId,
}: {
  readonly config: PublicReviewFeedbackConfig;
  readonly page: PublicReviewPageContext;
  readonly reference: PublicReviewReference | undefined;
  readonly submissionId: string;
}): PublicReviewFeedbackContext {
  if (!UUID_PATTERN.test(submissionId)) {
    throw new PublicReviewFeedbackValidationError([
      "The client submission id must be a UUID.",
    ]);
  }

  const configuredPage = config.pages.find(
    (candidate) => candidate.value === page.pageId
  );
  if (!configuredPage) {
    throw new PublicReviewFeedbackValidationError([
      "The selected page is not part of this review.",
    ]);
  }
  if (
    page.sectionId !== undefined &&
    configuredPage.sectionValues !== undefined &&
    !configuredPage.sectionValues.includes(page.sectionId)
  ) {
    throw new PublicReviewFeedbackValidationError([
      "The selected section is not part of this review page.",
    ]);
  }

  return {
    submissionId: submissionId.toLowerCase(),
    reviewId: config.reviewId,
    reviewVersion: config.reviewVersion,
    pageId: page.pageId,
    ...(page.sectionId ? { sectionId: page.sectionId } : {}),
    ...(reference ? { reference } : {}),
  };
}

function canonicalContextJson(context: PublicReviewFeedbackContext): string {
  return JSON.stringify(context);
}

function encodeGitHubPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function getPublicReviewSourceLink(
  reference: PublicReviewCodeReference
): string {
  const lineFragment =
    reference.lineStart === reference.lineEnd
      ? `#L${reference.lineStart}`
      : `#L${reference.lineStart}-L${reference.lineEnd}`;
  return `https://github.com/${reference.repository}/blob/${reference.commit}/${encodeGitHubPath(reference.path)}${lineFragment}`;
}

function appendOptionalSection(
  sections: string[],
  heading: string,
  value: string
): void {
  const normalized = value.trim();
  if (normalized) {
    sections.push(`### ${heading}\n\n${normalized}`);
  }
}

function buildFeedbackBody({
  categoryLabel,
  draft,
  page,
  reference,
  reviewTitle,
  reviewVersion,
  severityLabel,
}: {
  readonly categoryLabel: string;
  readonly draft: PublicReviewFeedbackDraft;
  readonly page: PublicReviewPageContext;
  readonly reference: PublicReviewReference | undefined;
  readonly reviewTitle: string;
  readonly reviewVersion: string;
  readonly severityLabel: string;
}): string {
  const sections = [
    `## ${categoryLabel}`,
    draft.comment.trim(),
    `**Review:** ${reviewTitle} (${reviewVersion})`,
    `**Page:** [${page.pageTitle}](${page.canonicalPath})`,
    `**Suspected severity:** ${severityLabel}`,
  ];

  if (page.sectionTitle) {
    sections.push(`**Section:** ${page.sectionTitle}`);
  }
  if (reference?.kind === "documentation" && reference.quote) {
    sections.push(`> ${reference.quote.replaceAll("\n", "\n> ")}`);
  }
  if (reference?.kind === "code") {
    const lineLabel =
      reference.lineStart === reference.lineEnd
        ? `line ${reference.lineStart}`
        : `lines ${reference.lineStart}-${reference.lineEnd}`;
    sections.push(
      `**Source:** [\`${reference.path}\` ${lineLabel}](${getPublicReviewSourceLink(reference)})`
    );
    if (reference.contract) {
      sections.push(`**Contract:** \`${reference.contract}\``);
    }
    if (reference.declaration) {
      sections.push(`**Declaration:** \`${reference.declaration}\``);
    }
  }

  appendOptionalSection(sections, "Why this matters", draft.whyItMatters);
  appendOptionalSection(sections, "Suggested change", draft.suggestedChange);
  appendOptionalSection(sections, "Preconditions", draft.preconditions);
  appendOptionalSection(sections, "Expected behavior", draft.expectedBehavior);
  appendOptionalSection(sections, "Observed behavior", draft.observedBehavior);
  appendOptionalSection(
    sections,
    "Reproduction or proof of concept",
    draft.reproduction
  );

  return sections.join("\n\n");
}

function validateMetadata(metadata: readonly ApiDropMetadata[]): void {
  const issues: string[] = [];
  const keys = metadata.map((item) => item.data_key);

  if (
    keys.length !== PUBLIC_REVIEW_METADATA_KEYS.length ||
    !keys.every((key, index) => key === PUBLIC_REVIEW_METADATA_KEYS[index])
  ) {
    issues.push("Feedback metadata must use the canonical four-field order.");
  }
  if (new Set(keys).size !== keys.length) {
    issues.push("Feedback metadata keys must be unique.");
  }
  for (const item of metadata) {
    if (item.data_value.length > PUBLIC_REVIEW_METADATA_VALUE_LIMIT) {
      issues.push(`${item.data_key} exceeds the metadata value limit.`);
    }
  }

  if (issues.length > 0) {
    throw new PublicReviewFeedbackValidationError(issues);
  }
}

export function encodePublicReviewFeedback({
  config,
  destination,
  draft,
  page,
  referenceSelection,
  signer,
  submissionId,
}: {
  readonly config: PublicReviewFeedbackConfig;
  readonly destination: PublicReviewDiscussionDestination;
  readonly draft: PublicReviewFeedbackDraft;
  readonly page: PublicReviewPageContext;
  readonly referenceSelection?: PublicReviewReferenceSelection | undefined;
  readonly signer: PublicReviewFeedbackSigner;
  readonly submissionId: string;
}): ApiCreateDropRequest {
  validatePublicReviewFeedbackConfig(config);

  const issues: string[] = [];
  const category = getAllowedOption(config.categories, draft.category);
  const severity = getAllowedOption(config.severityOptions, draft.severity);
  if (!category) {
    issues.push("Select a feedback category from this review.");
  }
  if (!severity) {
    issues.push("Select a severity from this review.");
  }
  if (!draft.comment.trim()) {
    issues.push("Enter a comment before previewing or submitting feedback.");
  }
  if (!page.canonicalPath.startsWith("/")) {
    issues.push("The review page must provide an app-relative canonical path.");
  }
  if (issues.length > 0 || !category || !severity) {
    throw new PublicReviewFeedbackValidationError(issues);
  }
  if (!signer.address || !isAddress(signer.address)) {
    throw new PublicReviewFeedbackValidationError([
      "An active authenticated signer address is required.",
    ]);
  }
  const signerAddress = getAddress(signer.address);

  const reference = normalizePublicReviewReference({
    config,
    selection: referenceSelection,
  });
  const context = buildFeedbackContext({
    config,
    page,
    reference,
    submissionId,
  });
  const body = buildFeedbackBody({
    categoryLabel: category.label,
    draft,
    page,
    reference,
    reviewTitle: config.reviewTitle,
    reviewVersion: config.reviewVersion,
    severityLabel: severity.label,
  });
  if (body.length > PUBLIC_REVIEW_DROP_CONTENT_LIMIT) {
    throw new PublicReviewFeedbackValidationError([
      "The rendered feedback exceeds the drop content limit.",
    ]);
  }

  const metadata: ApiDropMetadata[] = [
    {
      data_key: "review_schema",
      data_value: config.feedbackSchemaVersion,
    },
    { data_key: "type", data_value: category.value },
    { data_key: "severity", data_value: severity.value },
    {
      data_key: "context",
      data_value: canonicalContextJson(context),
    },
  ];
  validateMetadata(metadata);

  return {
    wave_id: destination.waveId,
    drop_type: ApiDropType.Chat,
    title: null,
    parts: [{ content: body, quoted_drop: null, media: [] }],
    referenced_nfts: [],
    mentioned_users: [],
    mentioned_waves: [],
    mentioned_groups: [],
    metadata,
    signature: null,
    is_safe_signature: signer.isSafeWallet,
    signer_address: signerAddress,
    hide_link_preview: false,
  };
}

function decodeDocumentationReference(
  value: Record<string, unknown>
): PublicReviewReference {
  const keys = value["quote"] === undefined ? ["kind"] : ["kind", "quote"];
  if (
    !hasExactKeys(value, keys) ||
    (value["quote"] !== undefined && typeof value["quote"] !== "string")
  ) {
    throw new Error("Invalid documentation reference.");
  }
  return {
    kind: "documentation",
    ...(typeof value["quote"] === "string" ? { quote: value["quote"] } : {}),
  };
}

function validateOptionalCodeReferenceStrings(
  value: Record<string, unknown>
): void {
  const optionalStrings = [
    ["contract", "Invalid code contract reference."],
    ["declaration", "Invalid code declaration reference."],
    ["snippetSha256", "Invalid code snippet checksum."],
  ] as const;
  for (const [key, errorMessage] of optionalStrings) {
    if (value[key] !== undefined && typeof value[key] !== "string") {
      throw new Error(errorMessage);
    }
  }
}

function decodeCodeReference({
  config,
  value,
}: {
  readonly config: PublicReviewFeedbackConfig;
  readonly value: Record<string, unknown>;
}): PublicReviewReference {
  const optionalKeys = ["contract", "declaration", "snippetSha256"].filter(
    (key) => value[key] !== undefined
  );
  const expectedKeys = [
    "kind",
    "repository",
    "commit",
    "path",
    "sourceSha256",
    "lineStart",
    "lineEnd",
    ...optionalKeys,
  ];
  if (!hasExactKeys(value, expectedKeys)) {
    throw new Error("The code reference is not canonical.");
  }
  if (
    typeof value["path"] !== "string" ||
    typeof value["sourceSha256"] !== "string" ||
    typeof value["lineStart"] !== "number" ||
    typeof value["lineEnd"] !== "number"
  ) {
    throw new TypeError("Invalid code reference.");
  }
  validateOptionalCodeReferenceStrings(value);

  const normalized = normalizeCodeReference({
    source: config.source,
    selection: {
      kind: "code",
      path: value["path"],
      sourceSha256: value["sourceSha256"],
      lineStart: value["lineStart"],
      lineEnd: value["lineEnd"],
      ...(typeof value["contract"] === "string"
        ? { contract: value["contract"] }
        : {}),
      ...(typeof value["declaration"] === "string"
        ? { declaration: value["declaration"] }
        : {}),
      ...(typeof value["snippetSha256"] === "string"
        ? { snippetSha256: value["snippetSha256"] }
        : {}),
    },
  });
  if (
    value["repository"] !== normalized.repository ||
    value["commit"] !== normalized.commit
  ) {
    throw new Error("The code reference source does not match this review.");
  }
  return normalized;
}

function decodeReference({
  config,
  value,
}: {
  readonly config: PublicReviewFeedbackConfig;
  readonly value: unknown;
}): PublicReviewReference | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value) || typeof value["kind"] !== "string") {
    throw new Error("Invalid feedback reference.");
  }
  if (value["kind"] === "documentation") {
    return decodeDocumentationReference(value);
  }
  if (value["kind"] === "code") {
    return decodeCodeReference({ config, value });
  }
  throw new Error("Unknown feedback reference kind.");
}

function decodeContext({
  config,
  rawContext,
}: {
  readonly config: PublicReviewFeedbackConfig;
  readonly rawContext: string;
}): PublicReviewFeedbackContext {
  let value: unknown;
  try {
    value = JSON.parse(rawContext);
  } catch {
    throw new Error("Feedback context is not valid JSON.");
  }
  if (!isRecord(value) || JSON.stringify(value) !== rawContext) {
    throw new Error("Feedback context is not canonical JSON.");
  }

  const optionalKeys = ["sectionId", "reference"].filter(
    (key) => value[key] !== undefined
  );
  if (
    !hasExactKeys(value, [
      "submissionId",
      "reviewId",
      "reviewVersion",
      "pageId",
      ...optionalKeys,
    ])
  ) {
    throw new Error("Feedback context has an invalid shape.");
  }
  if (
    typeof value["submissionId"] !== "string" ||
    !UUID_PATTERN.test(value["submissionId"]) ||
    value["reviewId"] !== config.reviewId ||
    value["reviewVersion"] !== config.reviewVersion ||
    typeof value["pageId"] !== "string" ||
    (value["sectionId"] !== undefined && typeof value["sectionId"] !== "string")
  ) {
    throw new Error("Feedback context does not match this review.");
  }

  const configuredPage = config.pages.find(
    (page) => page.value === value["pageId"]
  );
  if (!configuredPage) {
    throw new Error("Feedback references an unknown review page.");
  }
  if (
    typeof value["sectionId"] === "string" &&
    configuredPage.sectionValues !== undefined &&
    !configuredPage.sectionValues.includes(value["sectionId"])
  ) {
    throw new Error("Feedback references an unknown review section.");
  }

  const reference = decodeReference({
    config,
    value: value["reference"],
  });
  return {
    submissionId: value["submissionId"].toLowerCase(),
    reviewId: config.reviewId,
    reviewVersion: config.reviewVersion,
    pageId: value["pageId"],
    ...(typeof value["sectionId"] === "string"
      ? { sectionId: value["sectionId"] }
      : {}),
    ...(reference ? { reference } : {}),
  };
}

export function decodePublicReviewFeedbackMetadata({
  config,
  metadata,
}: {
  readonly config: PublicReviewFeedbackConfig;
  readonly metadata: readonly {
    readonly data_key: string;
    readonly data_value: string;
  }[];
}): PublicReviewMetadataDecodeResult {
  try {
    validatePublicReviewFeedbackConfig(config);
    if (metadata.length !== PUBLIC_REVIEW_METADATA_KEYS.length) {
      throw new Error("Feedback metadata must contain exactly four fields.");
    }
    const keys = metadata.map((item) => item.data_key);
    if (
      new Set(keys).size !== keys.length ||
      !keys.every((key, index) => key === PUBLIC_REVIEW_METADATA_KEYS[index])
    ) {
      throw new Error("Feedback metadata is not canonical.");
    }
    if (
      metadata.some(
        (item) => item.data_value.length > PUBLIC_REVIEW_METADATA_VALUE_LIMIT
      )
    ) {
      throw new Error("Feedback metadata exceeds the API value limit.");
    }

    const schema = metadata[0]!.data_value;
    const category = metadata[1]!.data_value;
    const severity = metadata[2]!.data_value;
    if (schema !== config.feedbackSchemaVersion) {
      throw new Error("Feedback uses a different schema version.");
    }
    if (!getAllowedOption(config.categories, category)) {
      throw new Error("Feedback uses an unknown category.");
    }
    if (!getAllowedOption(config.severityOptions, severity)) {
      throw new Error("Feedback uses an unknown severity.");
    }

    return {
      ok: true,
      value: {
        schema,
        category,
        severity,
        context: decodeContext({
          config,
          rawContext: metadata[3]!.data_value,
        }),
      },
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Invalid feedback.",
    };
  }
}

export function hasPublicReviewMetadata(
  metadata: readonly { readonly data_key: string }[]
): boolean {
  return metadata.some((item) =>
    PUBLIC_REVIEW_METADATA_KEYS.some((key) => key === item.data_key)
  );
}
