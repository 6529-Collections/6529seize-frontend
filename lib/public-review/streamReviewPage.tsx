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
import type {
  PublicReviewPageDefinition,
  PublicReviewSectionDefinition,
} from "@/lib/public-review/publicReviewTypes";
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

type CurrentStreamReviewPages = {
  readonly artworkLifecycle: boolean;
  readonly communityReview: boolean;
  readonly developmentStatus: boolean;
  readonly forArtists: boolean;
  readonly overview: boolean;
  readonly roles: boolean;
};

type StreamReviewSource = {
  readonly commit: string;
  readonly repository: string;
  readonly tree: string;
};

function getCurrentStreamReviewPages(
  route: StreamReviewRouteModel
): CurrentStreamReviewPages {
  const pageId = route.page.id;
  const isCurrent = route.version === undefined;
  return {
    artworkLifecycle: isCurrent && pageId === "artwork-lifecycle",
    communityReview: isCurrent && pageId === "community-review",
    developmentStatus:
      isCurrent && pageId === "security-testing-and-known-limitations",
    forArtists: isCurrent && pageId === "for-artists",
    overview: isCurrent && pageId === "overview",
    roles: isCurrent && pageId === "roles-and-trust",
  };
}

function getDisplayedEditorialMarkdown({
  contentVersion,
  currentPages,
  editorialMarkdown,
  source,
}: {
  readonly contentVersion: string;
  readonly currentPages: CurrentStreamReviewPages;
  readonly editorialMarkdown: string;
  readonly source: StreamReviewSource;
}): string {
  if (currentPages.artworkLifecycle) {
    return getCurrentArtworkLifecycleEditorialMarkdown({ editorialMarkdown });
  }
  if (currentPages.developmentStatus) {
    return getCurrentDevelopmentEditorialMarkdown({
      editorialMarkdown,
      source,
    });
  }
  if (currentPages.communityReview) {
    return getCurrentCommunityReviewEditorialMarkdown({
      reviewVersion: contentVersion,
      source,
    });
  }
  return editorialMarkdown;
}

function getDisplayedPage(
  page: PublicReviewPageDefinition,
  currentPages: CurrentStreamReviewPages
): PublicReviewPageDefinition {
  if (!currentPages.artworkLifecycle) {
    return page;
  }
  return {
    ...page,
    summaryKey: "publicReview.pages.artworkLifecycle.currentSummary",
  };
}

function getDisplayedSections({
  currentPages,
  editorialMarkdown,
}: {
  readonly currentPages: CurrentStreamReviewPages;
  readonly editorialMarkdown: string;
}): readonly PublicReviewSectionDefinition[] {
  if (currentPages.overview) {
    return [];
  }
  if (currentPages.forArtists) {
    return [
      ...STREAM_REVIEW_FOR_ARTISTS_GUIDE_SECTIONS,
      ...STREAM_REVIEW_FOR_ARTISTS_DETAIL_SECTIONS,
    ];
  }
  if (currentPages.roles) {
    return STREAM_REVIEW_ROLES_GUIDE_SECTIONS;
  }
  return extractPublicReviewSections(editorialMarkdown);
}

function getDisplayedFeedbackConfig({
  feedbackConfig,
  pageId,
  sections,
}: {
  readonly feedbackConfig: Awaited<
    ReturnType<typeof createStreamReviewFeedbackConfig>
  >;
  readonly pageId: string;
  readonly sections: readonly PublicReviewSectionDefinition[];
}) {
  return {
    ...feedbackConfig,
    pages: feedbackConfig.pages.map((configuredPage) =>
      configuredPage.value === pageId
        ? {
            ...configuredPage,
            sectionValues: sections.map((section) => section.id),
          }
        : configuredPage
    ),
  };
}

function StreamReviewIntroNotice({
  currentPages,
  isVersioned,
  pages,
}: {
  readonly currentPages: CurrentStreamReviewPages;
  readonly isVersioned: boolean;
  readonly pages: readonly PublicReviewPageDefinition[];
}) {
  return (
    <>
      {currentPages.overview ? <StreamReviewOverviewGuide pages={pages} /> : null}
      {currentPages.developmentStatus ? (
        <StreamReviewDevelopmentStatus />
      ) : null}
      {currentPages.forArtists ? (
        <>
          <StreamReviewForArtistsGuide pages={pages} />
          <StreamReviewForArtistsDetails />
        </>
      ) : null}
      {currentPages.roles ? <StreamReviewRolesGuide pages={pages} /> : null}
      {isVersioned || currentPages.communityReview ? (
        <StreamReviewBotAuthorshipNote />
      ) : null}
    </>
  );
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
  const currentPages = getCurrentStreamReviewPages(route);
  const displayedEditorialMarkdown = getDisplayedEditorialMarkdown({
    contentVersion,
    currentPages,
    editorialMarkdown,
    source: manifest.source,
  });
  const displayedPage = getDisplayedPage(route.page, currentPages);
  const displayedSections = getDisplayedSections({
    currentPages,
    editorialMarkdown: displayedEditorialMarkdown,
  });
  const displayedFeedbackConfig = getDisplayedFeedbackConfig({
    feedbackConfig,
    pageId: route.page.id,
    sections: displayedSections,
  });

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
        <StreamReviewIntroNotice
          currentPages={currentPages}
          isVersioned={route.version !== undefined}
          pages={reviewVersion.pages}
        />
      }
      outroNotice={
        currentPages.communityReview ? (
          <StreamReviewReviewerPrompts pages={reviewVersion.pages} />
        ) : null
      }
      showAudiencePaths={!currentPages.overview}
      showEditorialContent={
        !currentPages.overview &&
        !currentPages.forArtists &&
        !currentPages.roles
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
