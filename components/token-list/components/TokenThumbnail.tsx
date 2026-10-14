import Image from "next/image";
import { useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import Spinner from "@/components/utils/Spinner";
import type { TokenMetadata } from "@/components/nft-picker/types";

type TokenThumbnailProps = Readonly<{
  metadata?: TokenMetadata | undefined;
  decimalId: string;
  isLoading: boolean;
  hasError: boolean;
  locale?: SupportedLocale;
}>;

export function TokenThumbnail({
  metadata,
  decimalId,
  isLoading,
  hasError,
  locale = DEFAULT_LOCALE,
}: Readonly<TokenThumbnailProps>) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageUrl = metadata?.imageUrl;
  const hasImageError = Boolean(imageUrl && imageUrl === failedImageUrl);
  let content: ReactNode;

  if (imageUrl && !hasImageError) {
    content = (
      <Image
        key={imageUrl}
        src={imageUrl}
        onError={() => setFailedImageUrl(imageUrl)}
        alt={metadata.name ?? decimalId}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="tw-h-full tw-w-full tw-object-cover"
      />
    );
  } else if (isLoading && !hasImageError) {
    content = (
      <div
        aria-label={translate(locale, "tokenList.thumbnail.loading")}
        aria-live="polite"
        className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center"
      >
        <Spinner />
      </div>
    );
  } else if (hasError || hasImageError) {
    content = (
      <div
        role="img"
        aria-label={translate(locale, "tokenList.thumbnail.failed")}
        className="tw-text-red-300 tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-text-[10px] tw-font-medium tw-leading-tight"
      >
        <span className="tw-max-w-[3em] tw-text-center" aria-hidden="true">
          {translate(locale, "tokenList.thumbnail.error")}
        </span>
      </div>
    );
  } else {
    content = (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-text-iron-400">
        {translate(locale, "tokenList.thumbnail.tokenId", {
          tokenId: decimalId,
        })}
      </div>
    );
  }

  return (
    <div className="tw-relative tw-h-full tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800">
      {content}
    </div>
  );
}
