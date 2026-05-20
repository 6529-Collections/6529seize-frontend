"use client";

import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import CollectionCardMetadataBadge from "./CollectionCardMetadataBadge";

interface OwnershipProps {
  readonly contract: string;
  readonly tokenId: number;
  readonly show: boolean;
}

interface Props {
  readonly tokenId: number | string;
  readonly mediaMimeType?: string | null | undefined;
  readonly mediaBadgeId?: string | undefined;
  readonly ownership?: OwnershipProps | undefined;
  readonly align?: "split" | "center" | undefined;
  readonly className?: string | undefined;
}

export default function CollectionCardMetadataRow({
  tokenId,
  mediaMimeType,
  mediaBadgeId,
  ownership,
  align = "split",
  className = "",
}: Props) {
  const rowClassName =
    align === "center"
      ? "tw-mt-3 tw-flex tw-w-full tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-center tw-gap-x-2 tw-gap-y-1"
      : "tw-mt-3 tw-flex tw-w-full tw-min-w-0 tw-items-center tw-justify-between tw-gap-x-2 tw-gap-y-1";
  const metadataClassName =
    align === "center"
      ? "tw-flex tw-min-w-0 tw-items-center tw-justify-center"
      : "tw-ml-auto tw-flex tw-min-w-0 tw-items-center tw-justify-end";

  return (
    <div className={`${rowClassName} ${className}`.trim()}>
      {ownership?.show && (
        <div className="tw-flex tw-shrink-0 tw-items-center">
          <NFTImageBalance
            contract={ownership.contract}
            tokenId={ownership.tokenId}
            height={300}
            size="sm"
            variant="compact"
          />
        </div>
      )}
      <div className={metadataClassName}>
        <CollectionCardMetadataBadge
          tokenId={tokenId}
          mediaMimeType={mediaMimeType}
          mediaBadgeId={mediaBadgeId}
        />
      </div>
    </div>
  );
}
