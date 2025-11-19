import type { TokenMetadata } from "@/types/nft";

import { formatNumberWithCommas } from "@/helpers/Helpers";

import { formatXtdhRate, formatXtdhValue } from "../../utils/formatters";
import { getTokenLabel } from "../utils/getTokenLabel";
import type { ApiXtdhToken } from "../types";
import type { XtdhTokenListItemMetricItem } from "./XtdhTokenListItemMetrics";
import { XtdhTokenListItemMetrics } from "./XtdhTokenListItemMetrics";
import { XtdhTokenListItemThumbnail } from "./XtdhTokenListItemThumbnail";

interface TokenHeaderProps {
  readonly token: ApiXtdhToken;
  readonly metadata?: TokenMetadata;
  readonly isMetadataLoading: boolean;
  readonly hasMetadataError: boolean;
}

export function TokenHeader({
  token,
  metadata,
  isMetadataLoading,
  hasMetadataError,
}: Readonly<TokenHeaderProps>) {
  const tokenLabel = getTokenLabel(token.token);
  const metrics: ReadonlyArray<XtdhTokenListItemMetricItem> = [
    { label: "xTDH", value: formatXtdhValue(token.xtdh) },
    { label: "xTDH rate", value: formatXtdhRate(token.xtdh_rate) },
    {
      label: "Contributors",
      value: formatNumberWithCommas(token.total_contributor_count),
    },
    {
      label: "Active contributors",
      value: formatNumberWithCommas(token.active_contributor_count),
    },
  ];

  return (
    <section className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-shadow-inner tw-shadow-black/20">
      <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-3">
          <XtdhTokenListItemThumbnail
            tokenLabel={tokenLabel}
            metadata={metadata}
            isLoading={isMetadataLoading}
            hasError={hasMetadataError}
          />
          <div className="tw-flex tw-flex-col">
            <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
              {metadata?.name ?? tokenLabel}
            </p>
            <p className="tw-m-0 tw-text-xs tw-text-iron-400">{tokenLabel}</p>
          </div>
        </div>
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          Explore the grants and grantors powering this token&apos;s xTDH.
        </p>
      </div>
      <XtdhTokenListItemMetrics metrics={metrics} />
    </section>
  );
}
