import clsx from "clsx";

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
  readonly as?: "li" | "div";
  readonly className?: string;
}

export function XtdhTokenListItem({
  token,
  metadata,
  isMetadataLoading,
  hasMetadataError,
  onSelect,
  as = "li",
  className,
}: Readonly<XtdhTokenListItemProps>) {
  const tokenLabel = getTokenLabel(token.token);
  const xtdhValue = formatXtdhValue(token.xtdh);
  const xtdhRateValue = formatXtdhRate(token.xtdh_rate);
  const activeContributors = formatCount(token.active_contributor_count);
  const totalContributors = formatCount(token.total_contributor_count);

  const content = (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-4 lg:tw-grid lg:tw-grid-cols-[minmax(0,1fr)_300px_280px] lg:tw-items-center lg:tw-gap-6">
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
      <XtdhContributorSummary
        activeCount={activeContributors}
        totalCount={totalContributors}
        className="sm:tw-text-left lg:tw-justify-self-start lg:tw-w-[300px]"
      />
      <XtdhRatePill
        rateLabel={xtdhRateValue}
        totalLabel={xtdhValue}
        className="tw-justify-start lg:tw-justify-self-start lg:tw-w-[280px]"
      />
    </div>
  );

  const Wrapper = as === "div" ? "div" : "li";
  const wrapperClassName = clsx(
    "tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3",
    as === "li" && "tw-list-none",
    className
  );

  return (
    <Wrapper className={wrapperClassName}>
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
    </Wrapper>
  );
}
