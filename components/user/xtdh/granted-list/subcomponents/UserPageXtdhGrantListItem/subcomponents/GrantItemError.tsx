import { formatContractLabel } from "../formatters";
import type { GrantItemErrorProps } from "../types";
import { GrantExpiryBadge } from "./GrantExpiryBadge";
import { StatusBadge } from "./StatusBadge";
import { GrantDetailsGrid } from "./GrantDetailsGrid";
import { GrantErrorDetails } from "./GrantErrorDetails";

export function GrantItemError({
  contractLabel,
  details,
  errorDetails,
  status,
  validFrom,
  validTo,
}: Readonly<GrantItemErrorProps>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <header className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-4">
        <div>
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            Contract details unavailable
          </p>
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {`We couldn't load metadata for ${formatContractLabel(contractLabel)}.`}
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <GrantExpiryBadge validUntil={validTo} />
          <StatusBadge
            status={status}
            validFrom={validFrom}
            validTo={validTo}
          />
        </div>
      </header>
      <GrantDetailsGrid details={details} />
      {errorDetails ? <GrantErrorDetails message={errorDetails} /> : null}
    </div>
  );
}
