import type { GrantDetails } from "../types";
import { GrantDetailsRow } from "./GrantDetailsRow";

export function GrantDetailsGrid({
  details,
}: Readonly<{ details: GrantDetails }>) {
  return (
    <dl className="tw-grid tw-grid-cols-2 tw-gap-3 md:tw-ml-20 md:tw-grid-cols-2 lg:tw-grid-cols-3">
      <GrantDetailsRow
        label="Token type"
        className="tw-order-5 md:tw-order-none"
        value={details.tokenTypeLabel}
      />
      <GrantDetailsRow
        label="Total supply"
        className="tw-order-6 md:tw-order-none"
        value={details.totalSupplyLabel}
      />
      <GrantDetailsRow
        label="Floor price"
        className="tw-order-7 md:tw-order-none"
        value={details.floorPriceLabel}
      />
      <GrantDetailsRow
        label="Tokens granted"
        className="tw-order-3 md:tw-order-none"
        value={details.tokensCountLabel}
      />
      <GrantDetailsRow
        label="TDH rate"
        className="tw-order-1 md:tw-order-none"
        value={
          <div className="tw-flex tw-items-baseline tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-100">
            <span>{details.tdhRateLabel}</span>
            {details.tdhRatePerTokenLabel ? (
              <span
                className="tw-whitespace-nowrap tw-text-xs tw-font-semibold tw-text-iron-400 group-data-[typography=profile]/profile-xtdh:tw-text-meta group-data-[typography=profile]/profile-xtdh:tw-font-normal group-data-[typography=profile]/profile-xtdh:tw-tabular-nums group-data-[typography=profile]/profile-xtdh:tw-text-iron-500"
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
        className="tw-order-2 md:tw-order-none"
        value={details.totalGrantedLabel}
      />
      <GrantDetailsRow
        label="Valid from"
        className="tw-order-4 md:tw-order-none"
        value={details.validFromLabel}
      />
    </dl>
  );
}
