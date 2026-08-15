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
import { getCurrentCurationTdhEditorialMarkdown } from "@/lib/public-review/streamReviewCurationTdhPage";
import { getCurrentDevelopmentEditorialMarkdown } from "@/lib/public-review/streamReviewDevelopmentPage";
import { getCurrentTokensMintingEditorialMarkdown } from "@/lib/public-review/streamReviewTokensMintingPage";
import { getCurrentGovernanceEditorialMarkdown } from "@/lib/public-review/streamReviewGovernancePage";
import { getCurrentSalesAndAuctionsEditorialMarkdown } from "@/lib/public-review/streamReviewSalesAndAuctionsPage";
import { getCurrentFreezingFinalityEditorialMarkdown } from "@/lib/public-review/streamReviewFreezingFinalityPage";
import { getCurrentRevenueSplitsEditorialMarkdown } from "@/lib/public-review/streamReviewRevenueSplitsPage";
import { getCurrentRandomnessEditorialMarkdown } from "@/lib/public-review/streamReviewRandomnessPage";
import { getCurrentMetadataEditorialMarkdown } from "@/lib/public-review/streamReviewMetadataPage";
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
  const currentPages = getCurrentStreamReviewPages(route);
  const displayedPage = getDisplayedPage(
    getDisplayedPageTitle(route.page, route.version !== undefined),
    currentPages
  );

  return {
    ...getAppMetadata({
      title: t(DEFAULT_LOCALE, "publicReview.metadata.title", {
        page: t(DEFAULT_LOCALE, displayedPage.titleKey),
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
  readonly curationAndTdhAuthorization: boolean;
  readonly developmentStatus: boolean;
  readonly forArtists: boolean;
  readonly governance: boolean;
  readonly freezingFinality: boolean;
  readonly metadata: boolean;
  readonly overview: boolean;
  readonly revenueSplits: boolean;
  readonly randomness: boolean;
  readonly roles: boolean;
  readonly tokensAndMinting: boolean;
  readonly salesAndAuctions: boolean;
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
    curationAndTdhAuthorization:
      isCurrent && pageId === "curation-and-tdh-authorization",
    developmentStatus:
      isCurrent && pageId === "security-testing-and-known-limitations",
    forArtists: isCurrent && pageId === "for-artists",
    governance: isCurrent && pageId === "governance-pausing-and-successors",
    freezingFinality:
      isCurrent && pageId === "freezing-preservation-and-artwork-finality",
    metadata: isCurrent && pageId === "metadata-scripts-and-dependencies",
    overview: isCurrent && pageId === "overview",
    revenueSplits: isCurrent && pageId === "revenue-splits-and-royalties",
    randomness: isCurrent && pageId === "randomness",
    roles: isCurrent && pageId === "roles-and-trust",
    tokensAndMinting: isCurrent && pageId === "tokens-collections-and-minting",
    salesAndAuctions: isCurrent && pageId === "fixed-price-sales-and-auctions",
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
    return getCurrentArtworkLifecycleEditorialMarkdown({
      editorialMarkdown,
      source,
    });
  }
  if (currentPages.freezingFinality) {
    return getCurrentFreezingFinalityEditorialMarkdown({
      editorialMarkdown,
      source,
    });
  }
  if (currentPages.developmentStatus) {
    return getCurrentDevelopmentEditorialMarkdown({
      editorialMarkdown,
      source,
    });
  }
  if (currentPages.curationAndTdhAuthorization) {
    return getCurrentCurationTdhEditorialMarkdown({
      editorialMarkdown,
      source,
    });
  }
  if (currentPages.governance) {
    return getCurrentGovernanceEditorialMarkdown({
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
  if (currentPages.tokensAndMinting) {
    return getCurrentTokensMintingEditorialMarkdown({
      editorialMarkdown,
      source,
    });
  }
  if (currentPages.salesAndAuctions) {
    return getCurrentSalesAndAuctionsEditorialMarkdown({
      editorialMarkdown,
      source,
    });
  }
  if (currentPages.revenueSplits) {
    return getCurrentRevenueSplitsEditorialMarkdown({
      editorialMarkdown,
      source,
    });
  }
  if (currentPages.randomness) {
    return getCurrentRandomnessEditorialMarkdown({
      editorialMarkdown,
      source,
    });
  }
  if (currentPages.metadata) {
    return getCurrentMetadataEditorialMarkdown({
      editorialMarkdown,
      source,
    });
  }
  return editorialMarkdown;
}

function getDisplayedPage(
  page: PublicReviewPageDefinition,
  currentPages: CurrentStreamReviewPages
): PublicReviewPageDefinition {
  if (currentPages.artworkLifecycle) {
    return {
      ...page,
      summaryKey: "publicReview.pages.artworkLifecycle.currentSummary",
    };
  }
  if (currentPages.curationAndTdhAuthorization) {
    return {
      ...page,
      summaryKey:
        "publicReview.pages.curationAndTdhAuthorization.currentSummary",
    };
  }
  if (currentPages.tokensAndMinting) {
    return {
      ...page,
      summaryKey:
        "publicReview.pages.tokensCollectionsAndMinting.currentSummary",
    };
  }
  if (currentPages.salesAndAuctions) {
    return {
      ...page,
      summaryKey:
        "publicReview.pages.fixedPriceSalesAndAuctions.currentSummary",
    };
  }
  if (currentPages.freezingFinality) {
    return {
      ...page,
      summaryKey:
        "publicReview.pages.freezingPreservationAndArtworkFinality.currentSummary",
    };
  }
  if (currentPages.revenueSplits) {
    return {
      ...page,
      summaryKey: "publicReview.pages.revenueSplitsAndRoyalties.currentSummary",
    };
  }
  if (currentPages.randomness) {
    return {
      ...page,
      summaryKey: "publicReview.pages.randomness.currentSummary",
    };
  }
  return page;
}

function getDisplayedPageTitle(
  page: PublicReviewPageDefinition,
  isVersioned: boolean
): PublicReviewPageDefinition {
  if (!isVersioned && page.id === "curation-and-tdh-authorization") {
    return {
      ...page,
      titleKey: "publicReview.pages.curationAndTdhAuthorization.currentTitle",
    };
  }
  return page;
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
      {currentPages.overview ? (
        <StreamReviewOverviewGuide pages={pages} />
      ) : null}
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
  const displayedReviewVersion = {
    ...reviewVersion,
    pages: reviewVersion.pages.map((page) =>
      getDisplayedPageTitle(page, route.version !== undefined)
    ),
  };
  const displayedEditorialMarkdown = getDisplayedEditorialMarkdown({
    contentVersion,
    currentPages,
    editorialMarkdown,
    source: manifest.source,
  });
  const displayedPage = getDisplayedPage(
    getDisplayedPageTitle(route.page, route.version !== undefined),
    currentPages
  );
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
      reviewVersion={displayedReviewVersion}
      sections={displayedSections}
      routeVersion={route.version}
      displayedVersion={contentVersion}
      introNotice={
        <StreamReviewIntroNotice
          currentPages={currentPages}
          isVersioned={route.version !== undefined}
          pages={displayedReviewVersion.pages}
        />
      }
      outroNotice={
        currentPages.communityReview ? (
          <StreamReviewReviewerPrompts pages={displayedReviewVersion.pages} />
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
