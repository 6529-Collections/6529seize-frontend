import "next/dist/compiled/server-only";

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import PublicReviewLedger from "@/components/public-review/PublicReviewLedger";
import { PublicReviewStatusBanner } from "@/components/public-review/PublicReviewStatusBanner";
import { getAppMetadata } from "@/components/providers/metadata";
import { isPublicReviewEnabled } from "@/config/publicReviews";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  createStreamReviewFeedbackConfig,
  resolveStreamReviewFeedbackDestination,
} from "@/lib/public-review/streamReviewFeedback.server";
import {
  getStreamReviewFeedbackHref,
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";
import type { SolidityReferenceManifest } from "@/lib/public-review/solidityReferenceTypes";
import { getStreamSolidityReferenceReader } from "@/lib/public-review/streamSolidityReference";

export function getStreamReviewFeedbackMetadata({
  baseEndpoint,
  review,
  version,
}: {
  readonly baseEndpoint: string;
  readonly review: string;
  readonly version?: string | undefined;
}): Metadata | undefined {
  if (
    review !== STREAM_REVIEW_SLUG ||
    !isPublicReviewEnabled(baseEndpoint) ||
    (version !== undefined &&
      !STREAM_REVIEW_DEFINITION.versions.some(
        (candidate) => candidate.version === version
      ))
  ) {
    return undefined;
  }
  return {
    ...getAppMetadata({
      title: t(DEFAULT_LOCALE, "publicReview.ledger.pageTitle"),
      description: t(DEFAULT_LOCALE, "publicReview.ledger.pageIntro"),
    }),
    alternates: {
      canonical: new URL(
        getStreamReviewFeedbackHref(version),
        baseEndpoint
      ).toString(),
    },
    robots: { index: false, follow: false },
  };
}

function FeedbackPageShell({
  children,
  immutable,
  manifest,
  version,
}: {
  readonly children: ReactNode;
  readonly immutable: boolean;
  readonly manifest: SolidityReferenceManifest;
  readonly version: string;
}) {
  return (
    <div className="tailwind-scope tw-min-h-screen tw-bg-[#0b0b0d] tw-text-white">
      <PublicReviewStatusBanner
        review={STREAM_REVIEW_DEFINITION}
        displayedVersion={version}
        source={{
          repository: manifest.source.repository,
          commit: manifest.source.commit,
        }}
      />
      <div className="tw-mx-auto tw-w-full tw-max-w-[88rem] tw-px-4 tw-pb-20 tw-pt-8 sm:tw-px-6 lg:tw-px-8 lg:tw-pt-12">
        <Link
          href={
            immutable
              ? `/reviews/${STREAM_REVIEW_SLUG}/versions/${version}`
              : `/reviews/${STREAM_REVIEW_SLUG}`
          }
          className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-font-semibold tw-text-iron-100 tw-no-underline focus-visible:tw-ring-2 focus-visible:tw-ring-white/30"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.backToReview")}
        </Link>
        <header className="tw-mt-8 tw-max-w-4xl">
          <h1 className="tw-m-0 tw-text-4xl tw-font-semibold tw-tracking-tight sm:tw-text-5xl">
            {t(DEFAULT_LOCALE, "publicReview.ledger.pageTitle")}
          </h1>
          <p className="tw-mb-0 tw-mt-4 tw-text-lg tw-leading-8 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "publicReview.ledger.pageIntro")}
          </p>
        </header>
        <div className="tw-mt-8">{children}</div>
      </div>
    </div>
  );
}

export async function renderStreamReviewFeedbackPage({
  baseEndpoint,
  version,
}: {
  readonly baseEndpoint: string;
  readonly version?: string | undefined;
}) {
  const resolvedVersion =
    version ?? STREAM_REVIEW_DEFINITION.activeVersion;
  if (
    !isPublicReviewEnabled(baseEndpoint) ||
    !STREAM_REVIEW_DEFINITION.versions.some(
      (candidate) => candidate.version === resolvedVersion
    )
  ) {
    throw new Error("Public review feedback is disabled.");
  }
  const { manifest } = await getStreamSolidityReferenceReader().loadManifest(
    resolvedVersion
  );
  const config = await createStreamReviewFeedbackConfig({
    manifest,
    sourcePaths: "all",
  });
  const destination =
    resolveStreamReviewFeedbackDestination(baseEndpoint);

  return (
    <FeedbackPageShell
      immutable={version !== undefined}
      manifest={manifest}
      version={resolvedVersion}>
      <PublicReviewLedger
        locale={DEFAULT_LOCALE}
        config={config}
        destination={destination}
        internalSourceBasePath={`/reviews/${STREAM_REVIEW_SLUG}`}
      />
    </FeedbackPageShell>
  );
}
