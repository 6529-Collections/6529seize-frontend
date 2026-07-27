import "next/dist/compiled/server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicReviewShell } from "@/components/public-review/PublicReviewShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  loadStreamEditorialContent,
  PublicReviewEditorialContentError,
} from "@/lib/public-review/editorialContent";
import { extractPublicReviewSections } from "@/lib/public-review/editorialSections";
import {
  resolveStreamReviewRoute,
  type StreamReviewRouteModel,
  type StreamReviewRouteParams,
} from "@/lib/public-review/streamReviewRoutes";
import { STREAM_REVIEW_DEFINITION } from "@/lib/public-review/streamReviewDefinition";

function getStreamReviewMetadata({
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
        page: t(DEFAULT_LOCALE, route.page.titleKey),
      }),
      description: t(DEFAULT_LOCALE, "publicReview.metadata.description"),
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

async function renderStreamReviewRoute(route: StreamReviewRouteModel) {
  const contentVersion =
    route.version ?? STREAM_REVIEW_DEFINITION.activeVersion;
  let editorialMarkdown: string | undefined;
  try {
    editorialMarkdown = await loadStreamEditorialContent(
      route.page,
      contentVersion
    );
  } catch (error) {
    if (!(error instanceof PublicReviewEditorialContentError)) {
      throw error;
    }
  }
  if (editorialMarkdown === undefined) {
    notFound();
  }
  const sections = extractPublicReviewSections(editorialMarkdown);

  return (
    <PublicReviewShell
      editorialMarkdown={editorialMarkdown}
      page={route.page}
      reviewVersion={route.reviewVersion}
      sections={sections}
      routeVersion={route.version}
      displayedVersion={contentVersion}
    />
  );
}

export async function generateStreamReviewRouteMetadata({
  params,
}: {
  readonly params: Promise<StreamReviewRouteParams>;
}): Promise<Metadata> {
  const metadata = getStreamReviewMetadata({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: await params,
  });
  if (!metadata) {
    notFound();
  }
  return metadata;
}

export async function renderStreamReviewRoutePage({
  params,
}: {
  readonly params: Promise<StreamReviewRouteParams>;
}) {
  const route = resolveStreamReviewRoute({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: await params,
  });
  if (!route) {
    notFound();
  }
  return renderStreamReviewRoute(route);
}
