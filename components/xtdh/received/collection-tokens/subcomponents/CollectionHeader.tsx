import Image from "next/image";

import type { CollectionMetricDatum } from "../types";
import { CollectionMetric } from "./CollectionMetric";

interface CollectionHeaderProps {
  readonly contractDisplayName: string;
  readonly subtitleLabel: string;
  readonly contractImageUrl?: string;
  readonly headerMetrics: readonly CollectionMetricDatum[];
}

export function CollectionHeader({
  contractDisplayName,
  subtitleLabel,
  contractImageUrl,
  headerMetrics,
}: Readonly<CollectionHeaderProps>) {
  return (
    <header className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-shadow-inner tw-shadow-black/20">
        <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-relative tw-h-14 tw-w-14 tw-overflow-hidden tw-rounded-xl tw-bg-iron-800">
              {contractImageUrl ? (
                <Image
                  src={contractImageUrl}
                  alt={contractDisplayName}
                  fill
                  sizes="56px"
                  className="tw-h-full tw-w-full tw-object-cover"
                />
              ) : (
                <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-font-semibold tw-text-iron-400">
                  NFT
                </div>
              )}
            </div>
            <div className="tw-flex tw-flex-col">
              <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
                {contractDisplayName}
              </p>
              {subtitleLabel ? (
                <p className="tw-m-0 tw-text-xs tw-text-iron-400 tw-break-all">
                  {subtitleLabel}
                </p>
              ) : null}
            </div>
          </div>
          <div className="tw-text-sm tw-text-iron-300">
            Inspect each token&apos;s contribution to your received xTDH.
          </div>
        </div>
        <dl className="tw-mt-4 tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
          {headerMetrics.map((metric) => (
            <CollectionMetric
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </dl>
      </div>
    </header>
  );
}
