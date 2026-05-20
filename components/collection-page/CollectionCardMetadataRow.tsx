"use client";

import type { ReactNode } from "react";
import CollectionCardMetadataBadge from "./CollectionCardMetadataBadge";

interface Props {
  readonly tokenId: number | string;
  readonly mediaMimeType?: string | null | undefined;
  readonly mediaBadgeId?: string | undefined;
  readonly children?: ReactNode;
}

export default function CollectionCardMetadataRow({
  tokenId,
  mediaMimeType,
  mediaBadgeId,
  children,
}: Props) {
  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-2 tw-px-2 tw-pt-3 md:tw-px-4">
      <CollectionCardMetadataBadge
        tokenId={tokenId}
        mediaMimeType={mediaMimeType}
        mediaBadgeId={mediaBadgeId}
      />
      {children ? <div className="tw-min-w-0 tw-shrink">{children}</div> : null}
    </div>
  );
}
