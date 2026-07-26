import "next/dist/compiled/server-only";

import { getPublicReviewEnvironment } from "@/config/publicReviews";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { loadStreamEditorialContent } from "@/lib/public-review/editorialContent";
import { extractPublicReviewSections } from "@/lib/public-review/editorialSections";
import type {
  PublicReviewPageDefinition,
  PublicReviewSectionDefinition,
} from "@/lib/public-review/publicReviewTypes";
import {
  acceptsPublicReviewExploitReports,
  getPublicReviewLifecycleCapabilities,
} from "@/lib/public-review/publicReviewLifecycle";
import type { SolidityReferenceManifest } from "@/lib/public-review/solidityReferenceTypes";
import {
  getStreamReviewVersion,
  getStreamReviewPageHref,
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";
import { resolvePublicReviewDiscussionDestination } from "@/services/api/public-review/destination.server";
import {
  PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
  PUBLIC_REVIEW_FEEDBACK_SCHEMA_VERSION,
  type PublicReviewDiscussionDestination,
  type PublicReviewFeedbackConfig,
  type PublicReviewPageContext,
  type PublicReviewPageOption,
} from "@/services/api/public-review/types";

export const STREAM_REVIEW_FEEDBACK_DESTINATION_KEY = "stream-review";

export const STREAM_REVIEW_TECHNICAL_FEEDBACK_PAGES = [
  {
    value: "reference-overview",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.pages.referenceOverview"
    ),
  },
  {
    value: "reference-definition",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.pages.referenceDefinition"
    ),
  },
  {
    value: "reference-interface",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.pages.referenceInterface"
    ),
  },
  {
    value: "reference-source",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.pages.referenceSource"
    ),
  },
  {
    value: "reference-function",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.pages.referenceFunction"
    ),
  },
  {
    value: "reference-event",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.pages.referenceEvent"),
  },
  {
    value: "reference-error",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.pages.referenceError"),
  },
  {
    value: "reference-declaration",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.pages.referenceDeclaration"
    ),
  },
] as const satisfies readonly PublicReviewPageOption[];

export type StreamReviewTechnicalFeedbackPageId =
  (typeof STREAM_REVIEW_TECHNICAL_FEEDBACK_PAGES)[number]["value"];

const STREAM_REVIEW_FEEDBACK_CATEGORIES = [
  {
    value: "question",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.categories.question"),
  },
  {
    value: "documentation",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.categories.documentation"),
  },
  {
    value: "artist-workflow",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.categories.artistWorkflow"
    ),
  },
  {
    value: "product-or-ux",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.categories.productOrUx"),
  },
  {
    value: "protocol-design",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.categories.protocolDesign"
    ),
  },
  {
    value: "implementation-bug",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.categories.implementationBug"
    ),
  },
  {
    value: PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.categories.exploitable"
    ),
  },
  {
    value: "testing-or-evidence-gap",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.categories.testingOrEvidenceGap"
    ),
  },
  {
    value: "accessibility-or-localization",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.categories.accessibilityOrLocalization"
    ),
  },
] as const;

const STREAM_REVIEW_FEEDBACK_SEVERITIES = [
  {
    value: "not-assessed",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.severities.notAssessed"),
  },
  {
    value: "informational",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.severities.informational"),
  },
  {
    value: "low",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.severities.low"),
  },
  {
    value: "medium",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.severities.medium"),
  },
  {
    value: "high",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.severities.high"),
  },
  {
    value: "critical",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.severities.critical"),
  },
] as const;

const editorialPageOptions = new Map<
  string,
  Promise<readonly PublicReviewPageOption[]>
>();

async function loadEditorialPageOptions(
  version: string
): Promise<readonly PublicReviewPageOption[]> {
  const cached = editorialPageOptions.get(version);
  if (cached) {
    return cached;
  }
  const reviewVersion = getStreamReviewVersion(version);
  if (!reviewVersion) {
    throw new Error(`Unknown Stream review version: ${version}`);
  }

  const pending = Promise.all(
    reviewVersion.pages.map(async (page) => {
      const markdown = await loadStreamEditorialContent(page, version);
      return {
        value: page.id,
        label: t(DEFAULT_LOCALE, page.titleKey),
        sectionValues: extractPublicReviewSections(markdown).map(
          (section) => section.id
        ),
      } satisfies PublicReviewPageOption;
    })
  );
  editorialPageOptions.set(version, pending);
  return pending;
}

function selectManifestFiles({
  manifest,
  sourcePaths,
}: {
  readonly manifest: SolidityReferenceManifest;
  readonly sourcePaths: "all" | readonly string[] | undefined;
}) {
  if (sourcePaths === undefined) {
    return undefined;
  }

  const selected =
    sourcePaths === "all"
      ? manifest.files
      : sourcePaths.map((sourcePath) => {
          const file = manifest.files.find(
            (candidate) => candidate.path === sourcePath
          );
          if (!file) {
            throw new Error(
              `Feedback source is absent from ${manifest.reviewVersion}: ${sourcePath}`
            );
          }
          return file;
        });

  return {
    repository: manifest.source.repository,
    commit: manifest.source.commit,
    files: selected.map((file) => ({
      path: file.path,
      lineCount: file.lineCount,
      sha256: file.sha256,
    })),
  };
}

export async function createStreamReviewFeedbackConfig({
  manifest,
  sourcePaths,
}: {
  readonly manifest: SolidityReferenceManifest;
  readonly sourcePaths?: "all" | readonly string[] | undefined;
}): Promise<PublicReviewFeedbackConfig> {
  if (
    manifest.reviewId !== STREAM_REVIEW_SLUG ||
    !STREAM_REVIEW_DEFINITION.versions.some(
      (candidate) => candidate.version === manifest.reviewVersion
    )
  ) {
    throw new Error("Feedback manifest does not belong to this review.");
  }

  const source = selectManifestFiles({ manifest, sourcePaths });
  const lifecycleCapabilities = getPublicReviewLifecycleCapabilities(
    STREAM_REVIEW_DEFINITION.status
  );
  return {
    reviewId: manifest.reviewId,
    reviewVersion: manifest.reviewVersion,
    reviewTitle: STREAM_REVIEW_DEFINITION.title,
    feedbackSchemaVersion: PUBLIC_REVIEW_FEEDBACK_SCHEMA_VERSION,
    submissionsOpen:
      STREAM_REVIEW_DEFINITION.feedbackAvailable &&
      lifecycleCapabilities.feedbackSubmissionsOpen,
    acceptsPublicExploitReports:
      STREAM_REVIEW_DEFINITION.feedbackAvailable &&
      acceptsPublicReviewExploitReports(STREAM_REVIEW_DEFINITION.status),
    categories: STREAM_REVIEW_FEEDBACK_CATEGORIES,
    severityOptions: STREAM_REVIEW_FEEDBACK_SEVERITIES,
    pages: [
      ...(await loadEditorialPageOptions(manifest.reviewVersion)),
      ...STREAM_REVIEW_TECHNICAL_FEEDBACK_PAGES,
    ],
    ...(source ? { source } : {}),
  };
}

export function resolveStreamReviewFeedbackDestination(
  baseEndpoint: string
): PublicReviewDiscussionDestination {
  const environment = getPublicReviewEnvironment(baseEndpoint);
  if (environment === "disabled") {
    throw new Error(
      "Public review feedback cannot resolve outside an enabled environment."
    );
  }
  return resolvePublicReviewDiscussionDestination({
    environment,
    logicalKey: STREAM_REVIEW_FEEDBACK_DESTINATION_KEY,
  });
}

export function createStreamEditorialFeedbackPageContext({
  page,
  section,
  version,
}: {
  readonly page: PublicReviewPageDefinition;
  readonly section?: PublicReviewSectionDefinition | undefined;
  readonly version: string;
}): PublicReviewPageContext {
  const reviewVersion = getStreamReviewVersion(version);
  const versionPage = reviewVersion?.pages.find(
    (candidate) => candidate.id === page.id && candidate.slug === page.slug
  );
  if (!versionPage) {
    throw new Error("Feedback page does not belong to this review version.");
  }
  return {
    pageId: versionPage.id,
    pageTitle: t(DEFAULT_LOCALE, versionPage.titleKey),
    canonicalPath: getStreamReviewPageHref({ page: versionPage, version }),
    ...(section
      ? { sectionId: section.id, sectionTitle: section.title }
      : {}),
  };
}

export function createStreamTechnicalFeedbackPageContext({
  canonicalPath,
  pageId,
  pageTitle,
}: {
  readonly canonicalPath: string;
  readonly pageId: StreamReviewTechnicalFeedbackPageId;
  readonly pageTitle: string;
}): PublicReviewPageContext {
  if (
    !canonicalPath.startsWith(
      `/reviews/${STREAM_REVIEW_SLUG}/versions/`
    )
  ) {
    throw new Error("Technical feedback paths must be immutable.");
  }
  return { pageId, pageTitle, canonicalPath };
}
