import Image from "next/image";
import { shortenAddress } from "../formatters";
import type { GrantItemContentProps } from "../types";
import { GrantExpiryBadge } from "./GrantExpiryBadge";
import { StatusBadge } from "./StatusBadge";
import { GrantDetailsGrid } from "./GrantDetailsGrid";
import { GrantErrorDetails } from "./GrantErrorDetails";

export function GrantItemContent({
  contract,
  details,
  errorDetails,
  status,
  validFrom,
  validTo,
  actions,
}: Readonly<GrantItemContentProps>) {
  const name = contract.name ?? shortenAddress(contract.address);

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <header className="tw-flex tw-flex-col md:tw-flex-row tw-items-start tw-justify-between tw-gap-4">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-relative tw-h-16 tw-w-16 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
            {contract.imageUrl ? (
              <Image
                src={contract.imageUrl}
                alt={name}
                fill
                sizes="64px"
                className="tw-h-full tw-w-full tw-object-cover"
              />
            ) : (
              <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
                NFT
              </div>
            )}
          </div>
          <div className="tw-flex tw-flex-col tw-gap-0.5">
            <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
              {name}
            </p>
            <p className="tw-m-0 tw-text-xs tw-text-iron-500">
              {shortenAddress(contract.address)}
            </p>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <GrantExpiryBadge validUntil={typeof validTo === "number" ? validTo : null} />
          <StatusBadge
            status={status}
            validFrom={validFrom}
            validTo={validTo}
          />
          {actions}
        </div>
      </header>
      <GrantDetailsGrid details={details} />
      {errorDetails ? <GrantErrorDetails message={errorDetails} /> : null}
    </div>
  );
}
