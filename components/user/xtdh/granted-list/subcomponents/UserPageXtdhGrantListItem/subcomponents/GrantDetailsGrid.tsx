import type { GrantDetails } from "../types";
import { GrantDetailsRow } from "./GrantDetailsRow";

export function GrantDetailsGrid({
  details,
}: Readonly<{ details: GrantDetails }>) {
  return (
    <dl className="tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-3 md:tw-ml-20">
      <GrantDetailsRow label="Token type" value={details.tokenTypeLabel} />
      <GrantDetailsRow label="Total supply" value={details.totalSupplyLabel} />
      <GrantDetailsRow label="Floor price" value={details.floorPriceLabel} />
      <GrantDetailsRow
        label="Tokens granted"
        value={details.tokensCountLabel}
      />
      <GrantDetailsRow
        label="TDH rate"
        value={
          <div className="tw-flex tw-items-baseline tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-100">
            <span>{details.tdhRateLabel}</span>
            {details.tdhRatePerTokenLabel ? (
              <span
                className="tw-text-xs tw-font-semibold tw-text-iron-400 tw-whitespace-nowrap"
                title={details.tdhRatePerTokenHint ?? undefined}
              >
                ({details.tdhRatePerTokenLabel}/token)
              </span>
            ) : null}
          </div>
        }
      />
      <GrantDetailsRow
        label="Total granted"
        value={details.totalGrantedLabel}
      />
      <GrantDetailsRow label="Valid from" value={details.validFromLabel} />
    </dl>
  );
}
