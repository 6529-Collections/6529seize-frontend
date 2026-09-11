"use client";

import {
  ArrowTopRightOnSquareIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useState } from "react";
import { withArweaveFallback } from "@/components/nft-image/utils/gateway-fallback";
import Button from "@/components/utils/button/Button";
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

export default function ManifoldMintingSuccess({
  receipt,
  transactionUrl,
  onClose,
}: Readonly<{
  receipt: MintReceipt;
  transactionUrl: string;
  onClose: () => void;
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
            {t(locale, "theMemes.mint.transaction.recipient")}
          </dt>
          <dd className="tw-m-0 tw-mt-1 tw-break-all tw-font-mono tw-text-xxs tw-leading-relaxed tw-text-iron-200">
            {receipt.recipient}
          </dd>
        </div>
      </dl>

      <Button fullWidth size="lg" onClick={onClose}>
        {t(locale, "theMemes.mint.transaction.done")}
      </Button>
      <div className="tw-mt-2 tw-text-center">
        <a
          href={transactionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-inline-flex tw-min-h-11 tw-max-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-text-white focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
        >
          <span>{t(locale, "theMemes.mint.transaction.viewTransaction")}</span>
          <ArrowTopRightOnSquareIcon
            className="tw-size-4 tw-flex-none"
            aria-hidden="true"
          />
          <span className="tw-sr-only">
            {t(locale, "theMemes.mint.transaction.opensNewTab")}
          </span>
        </a>
      </div>
    </>
  );
}
