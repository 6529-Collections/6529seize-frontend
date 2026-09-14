import "next/dist/compiled/server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicReviewEditorialFeedback } from "@/components/public-review/PublicReviewEditorialFeedback";
import { PublicReviewShell } from "@/components/public-review/PublicReviewShell";
import { getStreamReviewDiagramPresentation } from "@/lib/public-review/streamReviewDiagrams";
import { getStreamReviewLegacyCommentSections } from "@/lib/public-review/streamReviewLegacyEntryFeedback";
import { PublicReviewMarkdown } from "@/components/public-review/PublicReviewMarkdown";
import { StreamReviewBotAuthorshipNote } from "@/components/public-review/StreamReviewBotAuthorshipNote";
import {
  StreamReviewDevelopmentStatus,
  StreamReviewReviewerPrompts,
} from "@/components/public-review/StreamReviewDevelopmentStatus";
import { StreamArtworkConceptPreview } from "@/components/public-review/StreamArtworkConceptPreview";
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
import { getCurrentStreamEditorialMarkdown } from "@/lib/public-review/streamReviewEditorialCorrections";
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
  getStreamReviewPageHref,
  getStreamReviewVersion,
  STREAM_REVIEW_DEFINITION,
} from "@/lib/public-review/streamReviewDefinition";
import { getStreamSolidityReferenceReader } from "@/lib/public-review/streamSolidityReference";
import {
  STREAM_REVIEW_CURRENT_PAGES,
  STREAM_REVIEW_ENTRY_PAGES,
  STREAM_REVIEW_ENTRY_GUIDE_VERSION,
  getStreamReviewEntryMarkdown,
  getStreamReviewRelatedPages,
} from "./streamReviewEntryGuides";

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

/** Loads the selected published editorial version and its validated source context. */
async function loadAvailableStreamEditorialContent({
  contentVersion,
  route,
}: {
  readonly contentVersion: string;
  readonly route: StreamReviewRouteModel;
}): Promise<string | undefined> {
  if (
    route.version === undefined &&
    route.page.id !== "for-artists" &&
    route.page.id !== "overview" &&
    STREAM_REVIEW_ENTRY_PAGES.some((page) => page.id === route.page.id)
  ) {
    // These current-only guides have no corresponding immutable editorial file.
    return "";
  }
  try {
    // A short guide can have a different title from its retained detail page.
    const editorialPage = getStreamReviewVersion(contentVersion)?.pages.find(
      (page) => page.id === route.page.id
    );
    if (!editorialPage) {
      return undefined;
    }
    return await loadStreamEditorialContent(editorialPage, contentVersion);
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

/** Identifies current-route reading features without enabling them on saved versions. */
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
    roles:
      isCurrent &&
      pageId === "roles-and-trust" &&
      STREAM_REVIEW_DEFINITION.activeVersion !==
        STREAM_REVIEW_ENTRY_GUIDE_VERSION,
    tokensAndMinting: isCurrent && pageId === "tokens-collections-and-minting",
    salesAndAuctions: isCurrent && pageId === "fixed-price-sales-and-auctions",
  };
}

/** Selects current corrections and entry guides while preserving saved review text. */
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
  if (contentVersion === STREAM_REVIEW_ENTRY_GUIDE_VERSION) {
    return editorialMarkdown;
  }
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

/** Selects current-route summaries while preserving saved page definitions. */
function getDisplayedPage(
  page: PublicReviewPageDefinition,
  currentPages: CurrentStreamReviewPages
): PublicReviewPageDefinition {
  if (page.summaryKey.startsWith("publicReview.pages.currentSnapshot.")) {
    if (currentPages.revenueSplits) {
      return { ...page, summaryKey: "publicReview.corrections.revenueSummary" };
    }
    return page;
  }
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

/** Derives feedback anchors from visible editorial or the current roles guide. */
function getDisplayedSections({
  currentPages,
  editorialMarkdown,
}: {
  readonly currentPages: CurrentStreamReviewPages;
  readonly editorialMarkdown: string;
}): readonly PublicReviewSectionDefinition[] {
  if (currentPages.roles) {
    return STREAM_REVIEW_ROLES_GUIDE_SECTIONS;
  }
  return extractPublicReviewSections(editorialMarkdown);
}

/** Aligns feedback targets with visible sections and retains historical targets when needed. */
function getDisplayedFeedbackConfig({
  feedbackConfig,
  pageId,
  sections,
  retainSections = false,
}: {
  readonly feedbackConfig: Awaited<
    ReturnType<typeof createStreamReviewFeedbackConfig>
  >;
  readonly pageId: string;
  readonly sections: readonly PublicReviewSectionDefinition[];
  readonly retainSections?: boolean;
}) {
  return {
    ...feedbackConfig,
    pages: feedbackConfig.pages.map((configuredPage) =>
      configuredPage.value === pageId
        ? {
            ...configuredPage,
            sectionValues: [
              ...new Set([
                ...(retainSections ? (configuredPage.sectionValues ?? []) : []),
                ...sections.map((section) => section.id),
              ]),
            ],
          }
        : configuredPage
    ),
  };
}

/** Explains the review status and source boundary above the reading content. */
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
      {currentPages.developmentStatus ? (
        <StreamReviewDevelopmentStatus />
      ) : null}
      {currentPages.roles ? <StreamReviewRolesGuide pages={pages} /> : null}
      {isVersioned || currentPages.communityReview ? (
        <StreamReviewBotAuthorshipNote />
      ) : null}
    </>
  );
}

/**
 * Loads a review's pinned content and evidence, then renders its reading view.
 * Current routes receive checked corrections; saved routes retain their content.
 */
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
  const currentEditorialMarkdown = getCurrentStreamEditorialMarkdown({
    pageId: route.page.id,
    markdown: editorialMarkdown,
    version: contentVersion,
    routeVersion: route.version,
    source: manifest.source,
  });
  const feedbackConfig = await createStreamReviewFeedbackConfig({ manifest });
  const currentPages = getCurrentStreamReviewPages(route);
  const displayedReviewVersion = {
    ...reviewVersion,
    pages: (route.version === undefined
      ? STREAM_REVIEW_CURRENT_PAGES
      : reviewVersion.pages
    ).map((page) => getDisplayedPageTitle(page, route.version !== undefined)),
  };
  const entryMarkdown =
    route.version === undefined
      ? getStreamReviewEntryMarkdown({
          pageId: route.page.id,
          version: contentVersion,
          source: manifest.source,
        })
      : undefined;
  const displayedEditorialMarkdown =
    entryMarkdown ??
    getDisplayedEditorialMarkdown({
      contentVersion,
      currentPages,
      editorialMarkdown: currentEditorialMarkdown,
      source: manifest.source,
    });
  const diagramPresentation = getStreamReviewDiagramPresentation({
    pageId: route.page.id,
    markdown: displayedEditorialMarkdown,
    version: contentVersion,
    routeVersion: route.version,
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
  const feedbackSections = currentPages.forArtists
    ? [...displayedSections, ...extractPublicReviewSections(editorialMarkdown)]
    : displayedSections;
  const commentSections = currentPages.overview
    ? [
        ...feedbackSections,
        ...extractPublicReviewSections(editorialMarkdown)
          .filter(
            (section) =>
              !feedbackSections.some((visible) => visible.id === section.id)
          )
          .map((section) => ({
            ...section,
            href: `${getStreamReviewPageHref({ page: route.page, version: contentVersion })}#${section.id}`,
          })),
      ]
    : feedbackSections;
  const displayedFeedbackConfig = getDisplayedFeedbackConfig({
    retainSections: entryMarkdown !== undefined,
    feedbackConfig,
    pageId: route.page.id,
    sections: feedbackSections,
  });

  return (
    <PublicReviewShell
      primaryPageIds={
        route.version === undefined
          ? STREAM_REVIEW_ENTRY_PAGES.map((page) => page.id)
          : undefined
      }
      relatedPages={
        route.version === undefined
          ? getStreamReviewRelatedPages(route.page.id)
          : undefined
      }
      editorialMarkdown={diagramPresentation.markdown}
      sectionIntros={diagramPresentation.sectionIntros}
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
        ) : (
          <>
            {currentPages.overview ? (
              <details className="tw-mt-8">
                <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-white">
                  {t(DEFAULT_LOCALE, "publicReview.navigation.artworkPreview")}
                </summary>
                <StreamArtworkConceptPreview />
              </details>
            ) : null}
            {currentPages.forArtists ? (
              <details className="tw-mt-8">
                <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-white">
                  {t(
                    DEFAULT_LOCALE,
                    "publicReview.navigation.fullArtistDetails"
                  )}
                </summary>
                <PublicReviewMarkdown
                  markdown={currentEditorialMarkdown}
                  internalLinkBasePath="/reviews/6529-stream"
                />
              </details>
            ) : null}
          </>
        )
      }
      showAudiencePaths={route.version !== undefined}
      showEditorialContent={!currentPages.roles}
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
            currentRoute: route.version === undefined,
          })}
          sections={feedbackSections}
          commentSections={[
            ...commentSections,
            ...getStreamReviewLegacyCommentSections({
              page: route.page,
              version: contentVersion,
            }),
          ]}
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
