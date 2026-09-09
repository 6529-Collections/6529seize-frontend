import type { ApiContentModerationReportedContent } from "@/generated/models/ApiContentModerationReportedContent";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatFileSizeLabel } from "@/lib/link-preview/filePreviewI18n";
import Image from "next/image";
import Link from "next/link";
import WavesIcon from "@/components/common/icons/WavesIcon";

export default function ReportedContentPreview({
  content,
  dropId,
  dropStatus,
}: {
  readonly content: ApiContentModerationReportedContent;
  readonly dropId: string;
  readonly dropStatus: ApiDropModerationStatus;
}) {
  const locale = useBrowserLocale();
  const assetCount = content.parts.reduce(
    (count, part) => count + part.media.length + part.attachments.length,
    0
  );
  const waveHref = content.wave_id
    ? getWaveRoute({
        waveId: content.wave_id,
        isDirectMessage: content.wave_is_direct_message,
        isApp: false,
      })
    : null;
  const postHref =
    dropStatus === ApiDropModerationStatus.Visible && content.wave_id
      ? getWaveRoute({
          waveId: content.wave_id,
          extraParams: { drop: dropId },
          isDirectMessage: content.wave_is_direct_message,
          isApp: false,
        })
      : null;
  const hasText = [content.title, ...content.parts.map((part) => part.content)]
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.trim().length > 0);

  return (
    <div className="tw-mt-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-3">
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
        {t(locale, "contentModeration.preferences.reports.reportedContent")}
      </p>
      {waveHref && content.wave_name ? (
        <Link
          href={waveHref}
          prefetch={false}
          className="tw-mt-2 tw-inline-flex tw-max-w-full tw-items-center tw-gap-x-2 tw-rounded-md tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-primary-300"
        >
          <span className="tw-flex tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-white/10">
            {content.wave_picture ? (
              <Image
                src={getScaledImageUri(
                  content.wave_picture,
                  ImageScale.W_AUTO_H_50
                )}
                alt=""
                width={32}
                height={32}
                className="tw-size-8 tw-object-cover"
              />
            ) : (
              <WavesIcon className="tw-size-5 tw-text-iron-400" />
            )}
          </span>
          <span className="tw-truncate">{content.wave_name}</span>
        </Link>
      ) : (
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-medium tw-text-iron-400">
          {t(locale, "contentModeration.preferences.reports.waveUnavailable")}
        </p>
      )}
      {content.title?.trim() && (
        <p className="tw-mb-0 tw-mt-2 tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100">
          {content.title}
        </p>
      )}
      {content.parts.map(
        (part) =>
          part.content?.trim() && (
            <p
              key={part.part_no}
              className="tw-mb-0 tw-mt-2 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-6 tw-text-iron-200"
            >
              {part.content}
            </p>
          )
      )}
      {!hasText && (
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-italic tw-text-iron-400">
          {t(locale, "contentModeration.preferences.reports.noText")}
        </p>
      )}
      {assetCount > 0 && (
        <details className="tw-mt-3 tw-text-sm tw-text-iron-300">
          <summary className="tw-cursor-pointer tw-font-semibold focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
            {t(locale, "contentModeration.preferences.reports.assets", {
              count: assetCount,
            })}
          </summary>
          <ul className="tw-mb-0 tw-mt-2 tw-space-y-1 tw-pl-5 tw-text-xs tw-text-iron-400">
            {content.parts.flatMap((part) => [
              ...part.media.map((media) => (
                <li key={`media-${part.part_no}-${media.url}`}>
                  {t(locale, "contentModeration.preferences.reports.media", {
                    type: media.mime_type,
                  })}
                </li>
              )),
              ...part.attachments.map((attachment) => {
                const size = formatFileSizeLabel(attachment.size_bytes, locale);
                return (
                  <li
                    key={`attachment-${part.part_no}-${attachment.original_file_name}-${attachment.ipfs_url ?? ""}`}
                  >
                    {attachment.original_file_name}
                    {size ? ` · ${size}` : ""}
                  </li>
                );
              }),
            ])}
          </ul>
        </details>
      )}
      {postHref && (
        <Link
          href={postHref}
          prefetch={false}
          className="desktop-hover:hover:tw-text-primary-200 tw-mt-3 tw-inline-flex tw-rounded tw-font-semibold tw-text-primary-300 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(locale, "contentModeration.preferences.reports.viewPostInWave")}
        </Link>
      )}
    </div>
  );
}
