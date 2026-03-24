"use client";

import { getDropForgeStorageLocationInfo } from "@/components/drop-forge/drop-forge-storage-location.helpers";
import DropForgeLinkCard from "@/components/drop-forge/DropForgeLinkCard";

export default function DropForgeStorageLinkCard({
  label,
  value,
  cardClassName,
  labelClassName,
}: Readonly<{
  label: string;
  value: string | null | undefined;
  cardClassName?: string;
  labelClassName?: string;
}>) {
  const locationInfo = getDropForgeStorageLocationInfo(value);

  return (
    <DropForgeLinkCard
      label={
        <span className="tw-flex tw-items-center tw-gap-2">
          <span>{label}</span>
          {locationInfo?.providerBadgeLabel ? (
            <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-500/15 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300 tw-ring-1 tw-ring-inset tw-ring-primary-500/30">
              {locationInfo.providerBadgeLabel}
            </span>
          ) : null}
        </span>
      }
      displayValue={locationInfo?.displayValue}
      displayTitle={locationInfo?.displayTitle}
      copyValue={locationInfo?.copyValue}
      openUrl={locationInfo?.openUrl}
      copyLabel={`Copy ${label} link`}
      openLabel={`Open ${label} ${
        locationInfo?.provider === "ipfs" ? "on IPFS" : "on Arweave"
      }`}
      cardClassName={cardClassName}
      labelClassName={labelClassName}
    />
  );
}
