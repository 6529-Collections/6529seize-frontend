import "next/dist/compiled/server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicReviewEditorialFeedback } from "@/components/public-review/PublicReviewEditorialFeedback";
import { PublicReviewShell } from "@/components/public-review/PublicReviewShell";
import { StreamReviewBotAuthorshipNote } from "@/components/public-review/StreamReviewBotAuthorshipNote";
import {
  StreamReviewDevelopmentStatus,
  StreamReviewReviewerPrompts,
} from "@/components/public-review/StreamReviewDevelopmentStatus";
import { StreamReviewForArtistsDetails } from "@/components/public-review/StreamReviewForArtistsDetails";
import { StreamReviewForArtistsGuide } from "@/components/public-review/StreamReviewForArtistsGuide";
import { StreamReviewOverviewGuide } from "@/components/public-review/StreamReviewOverviewGuide";
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
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";
import { getStreamSolidityReferenceReader } from "@/lib/public-review/streamSolidityReference";

const DEVELOPMENT_UPDATE_OLD_LOCATION =
  /The separately dated development update on the current Overview records work\s+completed after this snapshot\./;
const DEVELOPMENT_UPDATE_CURRENT_LOCATION =
  "The separately dated development update above records work completed after this snapshot.";

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

async function loadAvailableStreamEditorialContent({
  contentVersion,
  route,
}: {
  readonly contentVersion: string;
  readonly route: StreamReviewRouteModel;
}): Promise<string | undefined> {
  try {
    return await loadStreamEditorialContent(route.page, contentVersion);
  } catch (error) {
    if (error instanceof PublicReviewEditorialContentError) {
      return undefined;
    }
    throw error;
  }
}

async function renderStreamReviewRoute(route: StreamReviewRouteModel) {
  const contentVersion =
    route.version ?? STREAM_REVIEW_DEFINITION.activeVersion;
  const reviewVersion = getStreamReviewVersion(contentVersion);
  if (!reviewVersion) {
    throw new Error("The resolved Stream review version is unavailable.");
  }
  const [editorialMarkdown, { manifest }, feedbackDestination] =
    await Promise.all([
      loadAvailableStreamEditorialContent({ contentVersion, route }),
      getStreamSolidityReferenceReader().loadManifest(contentVersion),
      resolveStreamReviewFeedbackDestination(route.baseEndpoint),
    ]);
  if (editorialMarkdown === undefined) {
    notFound();
  }
  const sections = extractPublicReviewSections(editorialMarkdown);
  const feedbackConfig = await createStreamReviewFeedbackConfig({ manifest });
  const isCurrentOverview =
    route.page.id === "overview" && route.version === undefined;
  const isCurrentForArtists =
    route.page.id === "for-artists" && route.version === undefined;
  const isCurrentDevelopmentStatus =
    route.page.id === "security-testing-and-known-limitations" &&
    route.version === undefined;
  const isCurrentCommunityReview =
    route.page.id === "community-review" && route.version === undefined;
  const displayedEditorialMarkdown = isCurrentDevelopmentStatus
    ? editorialMarkdown.replace(
        DEVELOPMENT_UPDATE_OLD_LOCATION,
        DEVELOPMENT_UPDATE_CURRENT_LOCATION
      )
    : editorialMarkdown;
  const displayedSections = isCurrentOverview ? [] : sections;

  return (
    <PublicReviewShell
      editorialMarkdown={displayedEditorialMarkdown}
      page={route.page}
      review={STREAM_REVIEW_DEFINITION}
      reviewVersion={reviewVersion}
      sections={displayedSections}
      routeVersion={route.version}
      displayedVersion={contentVersion}
      introNotice={
        <>
          {isCurrentOverview ? (
            <StreamReviewOverviewGuide pages={reviewVersion.pages} />
          ) : null}
          {isCurrentDevelopmentStatus ? (
            <StreamReviewDevelopmentStatus
              reviewSourceCommit={manifest.source.commit}
              reviewVersion={contentVersion}
            />
          ) : null}
          {isCurrentCommunityReview ? (
            <StreamReviewReviewerPrompts pages={reviewVersion.pages} />
          ) : null}
          {isCurrentForArtists ? (
            <>
              <StreamReviewForArtistsGuide pages={reviewVersion.pages} />
              <StreamReviewForArtistsDetails />
            </>
          ) : null}
          {route.version !== undefined || isCurrentCommunityReview ? (
            <StreamReviewBotAuthorshipNote />
          ) : null}
        </>
      }
      showAudiencePaths={!isCurrentOverview}
      showEditorialContent={!isCurrentOverview && !isCurrentForArtists}
      source={{
        repository: manifest.source.repository,
        commit: manifest.source.commit,
      }}
      feedbackSlot={
        <PublicReviewEditorialFeedback
          config={feedbackConfig}
          destination={feedbackDestination}
          page={createStreamEditorialFeedbackPageContext({
            page: route.page,
            version: contentVersion,
          })}
          sections={displayedSections}
        />
      }
    />
  );
}

type StreamReviewRoutePageProps = {
  readonly params: Promise<StreamReviewRouteParams>;
};

export async function generateStreamReviewRouteMetadata({
  params,
}: StreamReviewRoutePageProps): Promise<Metadata> {
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
}: StreamReviewRoutePageProps) {
  const route = resolveStreamReviewRoute({
    baseEndpoint: publicEnv.BASE_ENDPOINT,
    params: await params,
  });
  if (!route) {
    notFound();
  }
  return renderStreamReviewRoute(route);
}
