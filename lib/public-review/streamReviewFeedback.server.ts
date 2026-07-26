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
import type { SolidityReferenceManifest } from "@/lib/public-review/solidityReferenceTypes";
import {
  getStreamReviewPageHref,
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_PAGES,
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
    value: "general",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.categories.general"),
  },
  {
    value: "artist-experience",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.categories.artistExperience"
    ),
  },
  {
    value: "protocol-design",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.categories.protocolDesign"
    ),
  },
  {
    value: "economics",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.categories.economics"),
  },
  {
    value: "governance",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.categories.governance"),
  },
  {
    value: "interoperability",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.categories.interoperability"
    ),
  },
  {
    value: "documentation",
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.categories.documentation"
    ),
  },
  {
    value: "testing",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.categories.testing"),
  },
  {
    value: PUBLIC_REVIEW_EXPLOITABLE_SECURITY_TYPE,
    label: t(
      DEFAULT_LOCALE,
      "publicReview.feedback.categories.exploitable"
    ),
  },
] as const;

const STREAM_REVIEW_FEEDBACK_SEVERITIES = [
  {
    value: "question",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.severities.question"),
  },
  {
    value: "suggestion",
    label: t(DEFAULT_LOCALE, "publicReview.feedback.severities.suggestion"),
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

  const pending = Promise.all(
    STREAM_REVIEW_PAGES.map(async (page) => {
      const markdown = await loadStreamEditorialContent(page, version);
      return {
        value: page.id,
        label: page.title,
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
    !STREAM_REVIEW_DEFINITION.availableVersions.includes(
      manifest.reviewVersion
    )
  ) {
    throw new Error("Feedback manifest does not belong to this review.");
  }

  const source = selectManifestFiles({ manifest, sourcePaths });
  return {
    reviewId: manifest.reviewId,
    reviewVersion: manifest.reviewVersion,
    reviewTitle: STREAM_REVIEW_DEFINITION.title,
    feedbackSchemaVersion: PUBLIC_REVIEW_FEEDBACK_SCHEMA_VERSION,
    submissionsOpen: true,
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
  return {
    pageId: page.id,
    pageTitle: page.title,
    canonicalPath: getStreamReviewPageHref({ page, version }),
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
