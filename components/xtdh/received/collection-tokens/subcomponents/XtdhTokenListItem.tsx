import type { TokenMetadata } from "@/types/nft";

import { formatCount, formatXtdhRate, formatXtdhValue } from "../../utils/formatters";
import { XtdhContributorSummary } from "../../subcomponents/XtdhContributorSummary";
import { XtdhRatePill } from "../../collection-card-content/subcomponents/XtdhRatePill";
import { getTokenLabel } from "../utils/getTokenLabel";
import type { ApiXtdhToken } from "../types";
import { XtdhTokenListItemThumbnail } from "./XtdhTokenListItemThumbnail";

interface XtdhTokenListItemProps {
  readonly token: ApiXtdhToken;
  readonly metadata?: TokenMetadata;
  readonly isMetadataLoading: boolean;
  readonly hasMetadataError: boolean;
  readonly onSelect?: () => void;
}

export function XtdhTokenListItem({
  token,
  metadata,
  isMetadataLoading,
  hasMetadataError,
  onSelect,
}: Readonly<XtdhTokenListItemProps>) {
  const tokenLabel = getTokenLabel(token.token);
  const xtdhValue = formatXtdhValue(token.xtdh);
  const xtdhRateValue = formatXtdhRate(token.xtdh_rate);
  const activeContributors = formatCount(token.active_contributor_count);
  const totalContributors = formatCount(token.total_contributor_count);

  const content = (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
      <div className="tw-flex tw-flex-1 tw-items-center tw-gap-3">
        <XtdhTokenListItemThumbnail
          tokenLabel={tokenLabel}
          metadata={metadata}
          isLoading={isMetadataLoading}
          hasError={hasMetadataError}
        />
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
            {metadata?.name ?? tokenLabel}
          </p>
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">{tokenLabel}</p>
        </div>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between lg:tw-gap-6">
        <XtdhContributorSummary
          activeCount={activeContributors}
          totalCount={totalContributors}
          className="sm:tw-text-left"
        />
        <XtdhRatePill
          rateLabel={xtdhRateValue}
          totalLabel={xtdhValue}
          className="sm:tw-justify-end"
        />
      </div>
    </div>
  );

  return (
    <li className="tw-list-none tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className="tw-flex tw-w-full tw-flex-col tw-gap-3 tw-rounded-xl tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-inherit"
        >
          {content}
        </button>
      ) : (
        content
      )}
    </li>
  );
}
