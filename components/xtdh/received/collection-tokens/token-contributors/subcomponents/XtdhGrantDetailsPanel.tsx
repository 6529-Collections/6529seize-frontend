import { useMemo } from "react";
import Image from "next/image";

import { useXtdhGrantQuery } from "@/hooks/useXtdhGrantQuery";
import { GrantedListSkeleton } from "@/components/user/xtdh/granted-list/subcomponents/GrantedListSkeleton";
import { GrantedListError } from "@/components/user/xtdh/granted-list/subcomponents/GrantedListError";
import {
  GrantListItemContainer,
  StatusBadge,
  GrantExpiryBadge,
  GrantDetailsRow,
  GrantTokensPanel,
} from "@/components/user/xtdh/granted-list/subcomponents/UserPageXtdhGrantListItem/subcomponents";
import {
  mapTokenCountToState,
  getContractAddress,
  mapGrantChainToSupportedChain,
} from "@/components/user/xtdh/granted-list/subcomponents/UserPageXtdhGrantListItem/formatters";
import {
  formatAmount,
  formatDateTime,
  formatTdhRatePerToken,
  getTargetTokensCountInfo,
} from "@/components/user/xtdh/utils/xtdhGrantFormatters";
import { shortenAddress } from "@/helpers/address.helpers";

interface XtdhGrantDetailsPanelProps {
  readonly grantId: string;
}

export function XtdhGrantDetailsPanel({
  grantId,
}: Readonly<XtdhGrantDetailsPanelProps>) {
  const { grant, isLoading, isError, errorMessage, refetch } = useXtdhGrantQuery({
    grantId,
  });

  const viewModel = useMemo(() => {
    if (!grant) {
      return null;
    }

    const contractAddress = getContractAddress(grant.target_contract);
    let chain = null;
    try {
      chain = mapGrantChainToSupportedChain(grant.target_chain);
    } catch {
      // Ignore unsupported chain error for display purposes
    }

    const tokenState = mapTokenCountToState(grant.target_tokens_count);

    const tokensCountInfo = getTargetTokensCountInfo(grant.target_tokens_count ?? null);
    const tokensCountValue = typeof tokensCountInfo.count === "number" ? tokensCountInfo.count : null;
    const rateLabel = formatAmount(grant.rate);
    const ratePerTokenLabel = formatTdhRatePerToken(grant.rate, tokensCountValue);

    const tokensDescription = (() => {
      if (tokensCountInfo.kind === "all") {
        return "all tokens in this collection";
      }
      if (tokensCountInfo.kind === "count") {
        return `${tokensCountInfo.label} tokens granted`;
      }
      return "an unknown number of tokens";
    })();

    const ratePerTokenHint = ratePerTokenLabel
      ? `${rateLabel} total TDH ÷ ${tokensDescription}`
      : null;

    return {
      chain,
      contractAddress,
      tokenState,
      validFromLabel: formatDateTime(grant.valid_from ?? null, {
        fallbackLabel: "Immediately",
      }),
      validUntilLabel: formatDateTime(grant.valid_to ?? null),
      tokensCountLabel: tokensCountInfo.label,
      rateLabel,
      ratePerTokenLabel,
      ratePerTokenHint,
    };
  }, [grant]);

  if (isLoading) {
    return <GrantedListSkeleton />;
  }

  if (isError || !grant || !viewModel) {
    return (
      <GrantedListError
        message={errorMessage ?? "Failed to load grant details."}
        onRetry={() => refetch()}
      />
    );
  }

  const grantor = grant.grantor;
  const grantorHandle = grantor.handle;
  const displayHandle =
    grantorHandle ?? shortenAddress(grantor.primary_address) ?? "Unknown grantor";
  const displayAddress = shortenAddress(grantor.primary_address);

  return (
    <GrantListItemContainer>
      <div className="tw-flex tw-flex-col tw-gap-4">
        <header className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-4">
          <div className="tw-flex tw-items-start tw-gap-3">
            <div className="tw-relative tw-h-14 tw-w-14 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
              {grantor.pfp ? (
                <Image
                  src={grantor.pfp}
                  alt={displayHandle}
                  fill
                  sizes="56px"
                  className="tw-h-full tw-w-full tw-object-cover"
                />
              ) : (
                <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-font-semibold tw-text-iron-400">
                  ?
                </div>
              )}
            </div>
            <div className="tw-flex tw-flex-col tw-gap-1">
              <div className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
                Grantor
              </div>
              <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                {displayHandle}
              </p>
              {grantorHandle && (
                <p className="tw-m-0 tw-text-xs tw-text-iron-400">
                  {displayAddress}
                </p>
              )}
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-gap-3">
            <GrantExpiryBadge validUntil={grant.valid_to} />
            <StatusBadge
              status={grant.status}
              validFrom={grant.valid_from}
              validTo={grant.valid_to}
            />
          </div>
        </header>

        <dl className="tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
          <GrantDetailsRow
            label="Tokens granted"
            value={viewModel.tokensCountLabel}
          />
          <GrantDetailsRow
            label="TDH rate"
            value={
              <div className="tw-flex tw-items-baseline tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-100">
                <span>{viewModel.rateLabel}</span>
                {viewModel.ratePerTokenLabel ? (
                  <span
                    className="tw-text-xs tw-font-semibold tw-text-iron-400 tw-whitespace-nowrap"
                    title={viewModel.ratePerTokenHint ?? undefined}
                  >
                    ({viewModel.ratePerTokenLabel}/token)
                  </span>
                ) : null}
              </div>
            }
          />
          <GrantDetailsRow label="Valid from" value={viewModel.validFromLabel} />
        </dl>
      </div>

      <GrantTokensPanel
        chain={viewModel.chain}
        contractAddress={viewModel.contractAddress ?? null}
        grantId={grant.id}
        state={viewModel.tokenState}
      />
    </GrantListItemContainer>
  );
}
