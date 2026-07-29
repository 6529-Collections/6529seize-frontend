import "next/dist/compiled/server-only";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
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
  isStreamReviewVersionPubliclyAvailable,
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
} from "@/lib/public-review/streamReviewDefinition";
import { isStreamReviewPubliclyAvailable } from "@/lib/public-review/streamReviewRoutes";
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
    (version === undefined && !isStreamReviewPubliclyAvailable(baseEndpoint)) ||
    (version !== undefined && !isStreamReviewVersionPubliclyAvailable(version))
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
    <div className="tailwind-scope tw-min-h-screen tw-bg-[#0D0D0F] tw-text-white">
      <div className="tw-mx-auto tw-w-full tw-max-w-[76rem] tw-px-4 tw-pb-20 tw-pt-6 sm:tw-px-7 lg:tw-px-10">
        <PublicReviewStatusBanner
          review={STREAM_REVIEW_DEFINITION}
          displayedVersion={version}
          source={{
            repository: manifest.source.repository,
            commit: manifest.source.commit,
          }}
        />
        <Link
          href={
            immutable
              ? `/reviews/${STREAM_REVIEW_SLUG}/versions/${version}`
              : `/reviews/${STREAM_REVIEW_SLUG}`
          }
          className="tw-mt-6 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-text-base tw-font-medium tw-text-iron-400 tw-no-underline tw-transition-colors hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          <ArrowLeftIcon
            aria-hidden="true"
            className="tw-size-3.5 tw-flex-none"
          />
          {t(DEFAULT_LOCALE, "publicReview.reference.backToReview")}
        </Link>
        <header className="tw-mt-10 tw-max-w-[52rem] sm:tw-mt-12">
          <h1 className="tw-m-0 tw-text-[2rem] tw-font-semibold tw-leading-[1.05] tw-tracking-[-0.03em] sm:tw-text-5xl">
            {t(DEFAULT_LOCALE, "publicReview.ledger.pageTitle")}
          </h1>
          <p className="tw-mb-0 tw-mt-5 tw-text-pretty tw-text-lg tw-font-light tw-leading-8 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "publicReview.ledger.pageIntro")}
          </p>
        </header>
        <div className="tw-mt-12">{children}</div>
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
  const resolvedVersion = version ?? STREAM_REVIEW_DEFINITION.activeVersion;
  if (
    !isPublicReviewEnabled(baseEndpoint) ||
    (version === undefined && !isStreamReviewPubliclyAvailable(baseEndpoint)) ||
    !isStreamReviewVersionPubliclyAvailable(resolvedVersion)
  ) {
    throw new Error("Public review feedback is disabled.");
  }
  const [{ manifest }, destination] = await Promise.all([
    getStreamSolidityReferenceReader().loadManifest(resolvedVersion),
    resolveStreamReviewFeedbackDestination(baseEndpoint),
  ]);
  const config = await createStreamReviewFeedbackConfig({
    manifest,
    sourcePaths: "all",
  });
  const internalSourceBasePath = `/reviews/${STREAM_REVIEW_SLUG}`;

  return (
    <FeedbackPageShell
      immutable={version !== undefined}
      manifest={manifest}
      version={resolvedVersion}
    >
      <PublicReviewLedger
        locale={DEFAULT_LOCALE}
        config={config}
        destination={destination}
        internalSourceBasePath={internalSourceBasePath}
      />
    </FeedbackPageShell>
  );
}
