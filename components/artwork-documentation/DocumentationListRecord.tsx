"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ApiArtworkDocumentationContextSummary } from "@/generated/models/ApiArtworkDocumentationContextSummary";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { documentationWorkspacePath } from "@/services/api/artwork-documentation-api";
import { documentationOptionLabel } from "@/i18n/messages/artwork-documentation-fields";
import { formatDate } from "@/i18n/format";
import { documentationSourcePreviewUrl } from "@/lib/artwork-documentation/source-preview";
import { ArtworkImage } from "./DocumentationArtworkPreview";
import { useDocumentationMessages } from "./DocumentationControls";

export type DocumentationCatalogueItem = ApiArtworkDocumentationContextSummary;

export default function DocumentationListRecord({
  record,
  sourceDrop,
}: {
  readonly record: DocumentationCatalogueItem;
  readonly sourceDrop?: ApiDrop | undefined;
}) {
  const { msg, locale } = useDocumentationMessages();
  const credit = record.artist_preferred_credit ?? record.artist_display_name;
  const identity = useQuery({
    ...getIdentityQueryOptions({ handleOrWallet: record.owner_profile_id }),
    enabled: !!record.owner_profile_id && !credit,
    retry: false,
  });
  const source = record.source_submission;
  const matched =
    source &&
    sourceDrop?.id === source.drop_id &&
    sourceDrop.wave.id === source.wave_id;
  const media =
    matched && sourceDrop.moderation?.can_view !== false
      ? sourceDrop.parts
          .flatMap((part) => part.media)
          .find(
            (item) =>
              item.mime_type.startsWith("image/") &&
              (item.media_status === undefined ||
                item.media_status === ApiDropMediaStatus.Ready) &&
              item.url.startsWith("https://")
          )
      : undefined;
  const previewUrl = media && documentationSourcePreviewUrl(media.url, true);
  return (
    <article className="tw-grid tw-min-w-0 tw-gap-6 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-8 sm:tw-grid-cols-[10rem_minmax(0,1fr)] sm:tw-gap-8">
      {media && previewUrl ? (
        <figure className="tw-m-0 tw-min-w-0">
          <div className="tw-flex tw-min-h-32 tw-items-center tw-bg-iron-950 tw-p-3">
            <ArtworkImage
              key={previewUrl}
              url={previewUrl}
              fallbackUrl={media.url}
              title={source?.title ?? msg("editorial.submissionImage")}
              compact
            />
          </div>
          <figcaption className="tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
            {msg("editorial.submissionReference")}
          </figcaption>
        </figure>
      ) : (
        <div className="tw-flex tw-min-h-24 tw-items-center tw-border-0 tw-border-l tw-border-solid tw-border-iron-700 tw-pl-4 tw-text-sm tw-leading-6 tw-text-iron-400">
          {msg("editorial.recordInPreparation")}
        </div>
      )}
      <div className="tw-min-w-0">
        <h2 className="tw-m-0 tw-break-words tw-font-serif tw-text-3xl tw-font-normal tw-leading-tight tw-text-iron-100">
          <Link
            href={documentationWorkspacePath(record.work_id, record.id)}
            className="tw-text-inherit tw-no-underline hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {record.title ?? msg("untitled")}
          </Link>
        </h2>
        {credit ? (
          <p className="tw-mb-0 tw-mt-3 tw-whitespace-pre-wrap tw-break-words tw-text-base tw-leading-7 tw-text-iron-200">
            {credit}
          </p>
        ) : (
          identity.data?.handle && (
            <p className="tw-mb-0 tw-mt-3 tw-break-words tw-text-sm tw-text-iron-300">
              {msg("editorial.artistProfile", { handle: identity.data.handle })}
            </p>
          )
        )}
        {!record.title && source?.title && (
          <p className="tw-mb-0 tw-mt-3 tw-break-words tw-text-sm tw-leading-6 tw-text-iron-400">
            {msg("editorial.submittedAs", { title: source.title })}
          </p>
        )}
        <p className="tw-mb-0 tw-mt-4 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          <span>{documentationOptionLabel(record.confirmation_status)}</span>
          {record.lifecycle === "archived" && <span>{msg("archived")}</span>}
          <span>
            {msg("savedAt", { date: formatDate(locale, record.updated_at) })}
          </span>
        </p>
        {record.reviews.length > 0 && (
          <details className="tw-mt-2 tw-text-sm tw-text-iron-400">
            <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
              {msg("editorial.reviewStatus")}
            </summary>
            <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
              {record.reviews.map((review) => (
                <li key={review.lane}>
                  {msg("lane." + review.lane)}: {msg("review." + review.status)}
                </li>
              ))}
            </ul>
          </details>
        )}
        <Link
          href={documentationWorkspacePath(record.work_id, record.id)}
          className="tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {msg("editorial.openRecord")}{" "}
          <span className="tw-ml-2" aria-hidden>
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
