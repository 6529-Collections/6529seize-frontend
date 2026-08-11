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
import {
  STREAM_REVIEW_FOR_ARTISTS_DETAIL_SECTIONS,
  StreamReviewForArtistsDetails,
} from "@/components/public-review/StreamReviewForArtistsDetails";
import {
  STREAM_REVIEW_FOR_ARTISTS_GUIDE_SECTIONS,
  StreamReviewForArtistsGuide,
} from "@/components/public-review/StreamReviewForArtistsGuide";
import { StreamReviewOverviewGuide } from "@/components/public-review/StreamReviewOverviewGuide";
import {
  STREAM_REVIEW_ROLES_GUIDE_SECTIONS,
  StreamReviewRolesGuide,
} from "@/components/public-review/StreamReviewRolesGuide";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  loadStreamEditorialContent,
  PublicReviewEditorialContentError,
} from "@/lib/public-review/editorialContent";
import { extractPublicReviewSections } from "@/lib/public-review/editorialSections";
import { getCurrentArtworkLifecycleEditorialMarkdown } from "@/lib/public-review/streamReviewArtworkLifecyclePage";
import { getCurrentCommunityReviewEditorialMarkdown } from "@/lib/public-review/streamReviewCommunityPage";
import { getCurrentDevelopmentEditorialMarkdown } from "@/lib/public-review/streamReviewDevelopmentPage";
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
  const feedbackConfig = await createStreamReviewFeedbackConfig({ manifest });
  const isCurrentOverview =
    route.page.id === "overview" && route.version === undefined;
  const isCurrentArtworkLifecycle =
    route.page.id === "artwork-lifecycle" && route.version === undefined;
  const isCurrentForArtists =
    route.page.id === "for-artists" && route.version === undefined;
  const isCurrentRoles =
    route.page.id === "roles-and-trust" && route.version === undefined;
  const isCurrentDevelopmentStatus =
    route.page.id === "security-testing-and-known-limitations" &&
    route.version === undefined;
  const isCurrentCommunityReview =
    route.page.id === "community-review" && route.version === undefined;
  let displayedEditorialMarkdown = editorialMarkdown;
  if (isCurrentArtworkLifecycle) {
    displayedEditorialMarkdown =
      getCurrentArtworkLifecycleEditorialMarkdown({
        editorialMarkdown: displayedEditorialMarkdown,
      });
  }
  if (isCurrentDevelopmentStatus) {
    displayedEditorialMarkdown = getCurrentDevelopmentEditorialMarkdown({
      editorialMarkdown: displayedEditorialMarkdown,
      source: manifest.source,
    });
  } else if (isCurrentCommunityReview) {
    displayedEditorialMarkdown = getCurrentCommunityReviewEditorialMarkdown({
      reviewVersion: contentVersion,
      source: manifest.source,
    });
  }
  const displayedPage: typeof route.page = isCurrentArtworkLifecycle
    ? {
        ...route.page,
        summaryKey: "publicReview.pages.artworkLifecycle.currentSummary",
      }
    : route.page;
  const sections = extractPublicReviewSections(displayedEditorialMarkdown);
  let displayedSections: readonly (typeof sections)[number][] = sections;
  if (isCurrentOverview) {
    displayedSections = [];
  } else if (isCurrentForArtists) {
    displayedSections = [
      ...STREAM_REVIEW_FOR_ARTISTS_GUIDE_SECTIONS,
      ...STREAM_REVIEW_FOR_ARTISTS_DETAIL_SECTIONS,
    ];
  } else if (isCurrentRoles) {
    displayedSections = STREAM_REVIEW_ROLES_GUIDE_SECTIONS;
  }
  const displayedFeedbackConfig = {
    ...feedbackConfig,
    pages: feedbackConfig.pages.map((configuredPage) =>
      configuredPage.value === route.page.id
        ? {
            ...configuredPage,
            sectionValues: displayedSections.map((section) => section.id),
          }
        : configuredPage
    ),
  };

  return (
    <PublicReviewShell
      editorialMarkdown={displayedEditorialMarkdown}
      page={displayedPage}
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
            <StreamReviewDevelopmentStatus />
          ) : null}
          {isCurrentForArtists ? (
            <>
              <StreamReviewForArtistsGuide pages={reviewVersion.pages} />
              <StreamReviewForArtistsDetails />
            </>
          ) : null}
          {isCurrentRoles ? (
            <StreamReviewRolesGuide pages={reviewVersion.pages} />
          ) : null}
          {route.version !== undefined || isCurrentCommunityReview ? (
            <StreamReviewBotAuthorshipNote />
          ) : null}
        </>
      }
      outroNotice={
        isCurrentCommunityReview ? (
          <StreamReviewReviewerPrompts pages={reviewVersion.pages} />
        ) : null
      }
      showAudiencePaths={!isCurrentOverview}
      showEditorialContent={
        !isCurrentOverview && !isCurrentForArtists && !isCurrentRoles
      }
      source={{
        repository: manifest.source.repository,
        commit: manifest.source.commit,
      }}
      feedbackSlot={
        <PublicReviewEditorialFeedback
          config={displayedFeedbackConfig}
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
