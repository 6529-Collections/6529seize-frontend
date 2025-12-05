import Image from "next/image";
import type { ReactNode } from "react";
import Spinner from "@/components/utils/Spinner";
import type { TokenMetadata } from "@/components/nft-picker/NftPicker.types";

type TokenThumbnailProps = Readonly<{
  metadata?: TokenMetadata;
  decimalId: string;
  isLoading: boolean;
  hasError: boolean;
}>;

export function TokenThumbnail({ metadata, decimalId, isLoading, hasError }: Readonly<TokenThumbnailProps>) {
  let content: ReactNode;

  if (metadata?.imageUrl) {
    content = (
      <Image
        src={metadata.imageUrl}
        alt={metadata.name ?? decimalId}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="tw-h-full tw-w-full tw-object-cover"
      />
    );
  } else if (isLoading) {
    content = (
      <div
        aria-label="Loading thumbnail"
        aria-live="polite"
        className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center"
      >
        <Spinner />
      </div>
    );
  } else if (hasError) {
    content = (
      <div
        aria-label="Failed to load thumbnail"
        className="tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-text-[10px] tw-font-medium tw-leading-tight tw-text-red-300"
      >
        <span>Load</span>
        <span>Error</span>
      </div>
    );
  } else {
    content = (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-text-iron-400">
        #{decimalId}
      </div>
    );
  }

  return (
    <div className="tw-relative tw-h-full tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800">
      {content}
    </div>
  );
}
