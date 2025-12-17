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
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-4 sm:tw-grid lg:tw-grid-cols-3 lg:tw-gap-4 tw-items-start">
      <div className="tw-flex tw-flex-1 tw-items-center tw-gap-3">
        <XtdhTokenListItemThumbnail
          tokenLabel={tokenLabel}
          metadata={metadata}
          isLoading={isMetadataLoading}
          hasError={hasMetadataError}
        />
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
            {metadata?.name ?? tokenLabel}
          </p>
          <p className="tw-m-0 tw-text-xs tw-text-iron-500">{tokenLabel}</p>
        </div>
      </div>
      <XtdhContributorSummary
        activeCount={activeContributors}
        totalCount={totalContributors}
        className="tw-text-left tw-order-3 lg:tw-order-2"
      />
      <XtdhRatePill
        rateLabel={xtdhRateValue}
        totalLabel={xtdhValue}
        className="tw-justify-start lg:tw-justify-end tw-mt-4 lg:tw-mt-0 tw-order-2 lg:tw-order-3"
      />
    </div>
  );

  const Wrapper = as === "div" ? "div" : "li";
  const wrapperClassName = clsx(
    "tw-rounded-xl tw-border tw-border-solid tw-border-white/5 desktop-hover:hover:tw-border-white/10 tw-bg-iron-900 tw-transition-all tw-duration-300 desktop-hover:hover:tw-bg-iron-900/60 tw-p-4",
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
