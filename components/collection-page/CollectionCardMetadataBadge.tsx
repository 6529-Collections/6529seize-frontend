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
      className="tw-inline-flex tw-h-6 tw-max-w-full tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-solid tw-border-white/[0.06] tw-bg-transparent tw-px-2 tw-text-[0.65625rem] tw-font-medium tw-leading-none tw-text-iron-500"
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
