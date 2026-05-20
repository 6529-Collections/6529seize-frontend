"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";

interface Props {
  readonly tokenId: number | string;
  readonly mediaMimeType?: string | null | undefined;
  readonly mediaBadgeId?: string | undefined;
}

export default function CollectionCardMetadataBadge({
  tokenId,
  mediaMimeType,
  mediaBadgeId,
}: Props) {
  return (
    <div
      aria-label={`Token #${tokenId}`}
      className="tw-inline-flex tw-max-w-full tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-500"
    >
      <span className="tw-truncate">#{tokenId}</span>
      {mediaMimeType && (
        <MediaTypeBadge
          mimeType={mediaMimeType}
          {...(mediaBadgeId ? { dropId: mediaBadgeId } : {})}
          size="sm"
          tone="muted"
          className="tw-shrink-0"
          iconClassName="tw-size-5"
        />
      )}
    </div>
  );
}
