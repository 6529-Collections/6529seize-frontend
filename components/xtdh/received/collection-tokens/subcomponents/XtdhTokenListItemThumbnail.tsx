import Image from "next/image";
import type { ReactNode } from "react";

import Spinner from "@/components/utils/Spinner";
import type { TokenMetadata } from "@/types/nft";

interface XtdhTokenListItemThumbnailProps {
  readonly tokenLabel: string;
  readonly metadata?: TokenMetadata | undefined;
  readonly isLoading: boolean;
  readonly hasError: boolean;
}

export function XtdhTokenListItemThumbnail({
  tokenLabel,
  metadata,
  isLoading,
  hasError,
}: Readonly<XtdhTokenListItemThumbnailProps>) {
  let content: ReactNode;

  if (metadata?.imageUrl) {
    content = (
      <Image
        src={metadata.imageUrl}
        alt={metadata.name ?? tokenLabel}
        fill
        sizes="48px"
        className="tw-h-full tw-w-full tw-object-cover tw-flex-shrink-0"
      />
    );
  } else if (isLoading) {
    content = (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
        <Spinner />
      </div>
    );
  } else if (hasError) {
    content = (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-[10px] tw-font-semibold tw-text-red-300">
        Error
      </div>
    );
  } else {
    content = (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-text-iron-400">
        {tokenLabel}
      </div>
    );
  }

  return (
    <div className="tw-relative tw-h-12 tw-w-12 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800 tw-flex-shrink-0">
      {content}
    </div>
  );
}
