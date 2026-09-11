"use client";

import { PhotoIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useState } from "react";
import { withArweaveFallback } from "@/components/nft-image/utils/gateway-fallback";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

export interface MintReceipt {
  readonly quantity: number;
  readonly recipient: string;
  readonly artworkName: string;
  readonly imageUrl?: string | undefined;
  readonly collectionLabel?: string | undefined;
}

export default function ManifoldMintingDetails({
  receipt,
  recipientLabel,
}: Readonly<{
  receipt: MintReceipt;
  recipientLabel?: string | undefined;
}>) {
  const locale = useBrowserLocale();
  const [failedImageUrl, setFailedImageUrl] = useState<string>();
  const imageUrl = receipt.imageUrl?.trim();
  const hasImage = Boolean(imageUrl && imageUrl !== failedImageUrl);

  return (
    <>
      <div className="tw-flex tw-items-center tw-gap-4">
        <div className="tw-flex tw-size-20 tw-flex-none tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 sm:tw-size-24">
          {hasImage && imageUrl ? (
            <Image
              key={imageUrl}
              unoptimized
              src={imageUrl}
              alt={receipt.artworkName}
              width={96}
              height={96}
              className="tw-h-full tw-w-full tw-object-contain"
              onError={withArweaveFallback(() => setFailedImageUrl(imageUrl))}
            />
          ) : (
            <span
              role="img"
              aria-label={t(
                locale,
                "theMemes.mint.transaction.artworkFallback"
              )}
            >
              <PhotoIcon
                className="tw-size-8 tw-text-iron-500"
                aria-hidden="true"
              />
            </span>
          )}
        </div>
        <div className="tw-min-w-0">
          {receipt.collectionLabel && (
            <p className="tw-mb-1 tw-text-sm tw-text-iron-400">
              {receipt.collectionLabel}
            </p>
          )}
          <p className="tw-m-0 tw-break-words tw-text-base tw-font-semibold tw-leading-snug tw-text-iron-50 [overflow-wrap:anywhere]">
            {receipt.artworkName}
          </p>
        </div>
      </div>

      <dl className="tw-mb-6 tw-mt-5 tw-space-y-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4 tw-text-sm">
        <div className="tw-flex tw-items-baseline tw-justify-between tw-gap-4">
          <dt className="tw-font-normal tw-text-iron-400">
            {t(locale, "theMemes.mint.transaction.quantity")}
          </dt>
          <dd className="tw-m-0 tw-font-medium tw-tabular-nums tw-text-iron-100">
            {formatInteger(locale, receipt.quantity)}
          </dd>
        </div>
        <div>
          <dt className="tw-font-normal tw-text-iron-400">
            {recipientLabel ?? t(locale, "theMemes.mint.transaction.recipient")}
          </dt>
          <dd className="tw-m-0 tw-mt-1 tw-break-all tw-font-mono tw-text-xxs tw-leading-relaxed tw-text-iron-200">
            {receipt.recipient}
          </dd>
        </div>
      </dl>
    </>
  );
}
