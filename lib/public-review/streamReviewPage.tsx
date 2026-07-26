import "next/dist/compiled/server-only";

import type { Metadata } from "next";

import { PublicReviewEditorialFeedback } from "@/components/public-review/PublicReviewEditorialFeedback";
import { PublicReviewShell } from "@/components/public-review/PublicReviewShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { loadStreamEditorialContent } from "@/lib/public-review/editorialContent";
import { extractPublicReviewSections } from "@/lib/public-review/editorialSections";
import {
  createStreamEditorialFeedbackPageContext,
  createStreamReviewFeedbackConfig,
  resolveStreamReviewFeedbackDestination,
} from "@/lib/public-review/streamReviewFeedback.server";
import {
  resolveStreamReviewRoute,
  type StreamReviewRouteModel,
  type StreamReviewRouteParams,
} from "@/lib/public-review/streamReviewRoutes";
import {
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";
import { getStreamSolidityReferenceReader } from "@/lib/public-review/streamSolidityReference";

export { resolveStreamReviewRoute };

export function getStreamReviewMetadata({
  baseEndpoint,
  params,
}: {
  readonly baseEndpoint: string;
  readonly params: StreamReviewRouteParams;
}): Metadata | undefined {
  const route = resolveStreamReviewRoute({ baseEndpoint, params });
  if (!route) {
    return undefined;
  }

  return {
    ...getAppMetadata({
      title: t(DEFAULT_LOCALE, "publicReview.metadata.title", {
        page: route.page.title,
      }),
      description: t(
        DEFAULT_LOCALE,
        "publicReview.metadata.description"
      ),
    }),
    alternates: {
      canonical: new URL(route.canonicalPath, baseEndpoint).toString(),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export async function renderStreamReviewRoute(
  route: StreamReviewRouteModel
) {
  const contentVersion =
    route.version ?? STREAM_REVIEW_DEFINITION.activeVersion;
  const editorialMarkdown = await loadStreamEditorialContent(
    route.page,
    contentVersion
  );
  const sections = extractPublicReviewSections(editorialMarkdown);
  const { manifest } =
    await getStreamSolidityReferenceReader().loadManifest(contentVersion);
  const feedbackConfig = await createStreamReviewFeedbackConfig({ manifest });
  const feedbackDestination = resolveStreamReviewFeedbackDestination(
    route.baseEndpoint
  );

  return (
    <PublicReviewShell
      editorialMarkdown={editorialMarkdown}
      page={route.page}
      review={STREAM_REVIEW_DEFINITION}
      sections={sections}
      routeVersion={route.version}
      displayedVersion={contentVersion}
      feedbackSlot={
        <PublicReviewEditorialFeedback
          config={feedbackConfig}
          destination={feedbackDestination}
          page={createStreamEditorialFeedbackPageContext({
            page: route.page,
            version: contentVersion,
          })}
          sections={sections}
        />
      }
    />
  );
}
