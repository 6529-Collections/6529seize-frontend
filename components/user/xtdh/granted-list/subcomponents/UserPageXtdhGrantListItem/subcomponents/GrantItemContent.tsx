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
    <div className="tw-flex tw-flex-col tw-gap-4 [&>dl>div]:tw-min-w-0 max-sm:[&>dl]:tw-grid-cols-2 [&>dl_dd>div>span]:tw-whitespace-normal [&>dl_dd>div]:tw-flex-wrap [&>dl_dd>div]:tw-gap-y-1 [&>dl_dd]:tw-break-words">
      <header className="tw-flex tw-flex-col tw-items-start tw-justify-between tw-gap-4 md:tw-flex-row">
        <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-3">
          <div className="tw-relative tw-h-12 tw-w-12 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800 sm:tw-h-16 sm:tw-w-16">
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
          <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-0.5">
            <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-100 group-data-[typography=profile]/profile-xtdh:tw-text-[15px] group-data-[typography=profile]/profile-xtdh:tw-font-semibold">
              {name}
            </p>
            <p className="tw-m-0 tw-text-xs tw-text-iron-500 group-data-[typography=profile]/profile-xtdh:tw-text-meta group-data-[typography=profile]/profile-xtdh:tw-font-normal group-data-[typography=profile]/profile-xtdh:tw-tabular-nums">
              {shortenAddress(contract.address)}
            </p>
          </div>
        </div>
        <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-3">
          <GrantExpiryBadge
            validUntil={typeof validTo === "number" ? validTo : null}
          />
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
