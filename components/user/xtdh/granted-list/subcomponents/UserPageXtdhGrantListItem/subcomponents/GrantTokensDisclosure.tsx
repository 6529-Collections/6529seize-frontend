"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

import type { SupportedChain } from "@/components/nft-picker/NftPicker.types";
import { VirtualizedTokenList } from "@/components/token-list/VirtualizedTokenList";
import Spinner from "@/components/utils/Spinner";

import type { GrantTokensDisclosureState } from "../types";
import { useGrantTokensDisclosure } from "../hooks/useGrantTokensDisclosure";

const END_REACHED_OFFSET = 48;

interface GrantTokensDisclosureProps {
  readonly chain: SupportedChain | null;
  readonly contractAddress: `0x${string}` | null;
  readonly grantId: string;
  readonly tokensCount: number | null;
  readonly tokensCountLabel: string;

}

export function GrantTokensDisclosure({
  chain,
  contractAddress,
  grantId,
  tokensCount,
  tokensCountLabel,

}: Readonly<GrantTokensDisclosureProps>) {
  const { isOpen, panelId, toggleOpen, disclosureState } =
    useGrantTokensDisclosure({
      chain,
      contractAddress,
      grantId,
    });

  const tokensCountWord = tokensCount === 1 ? "token" : "tokens";
  const tokensCountDescription =
    tokensCount == null
      ? tokensCountLabel
      : `${tokensCountLabel} ${tokensCountWord}`;
  const body = renderGrantTokensDisclosureBody(disclosureState);

  return (
    <div className="tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950">
      <button
        type="button"
        className={clsx(
          "tw-group tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-none tw-px-4 tw-py-3 tw-transition-colors tw-duration-200 tw-appearance-none focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-bg-iron-900",
          isOpen ? "tw-bg-iron-900" : "tw-bg-iron-900/30"
        )}
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="tw-text-sm tw-font-semibold tw-text-iron-400 tw-transition-colors tw-duration-200 desktop-hover:group-hover:tw-text-iron-200">
          {isOpen
            ? `Hide ${tokensCountDescription}`
            : `Show ${tokensCountDescription}`}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          aria-hidden="true"
          className={clsx(
            "tw-size-4 tw-text-iron-400 tw-transition-all tw-duration-200 desktop-hover:group-hover:tw-text-iron-200",
            isOpen && "tw-rotate-180"
          )}
        />
      </button>
      {isOpen ? (
        <div
          id={panelId}
          className="tw-border-t tw-border-iron-800 tw-bg-iron-950 tw-p-3"
        >
          {body}
        </div>
      ) : null}
    </div>
  );
}

function renderGrantTokensDisclosureBody(
  {
    showInitialLoading,
    showInitialError,
    tokenRanges,
    tokens,
    errorMessage,
    onRetry,
    contractAddress,
    chain,
    grantId,
    onEndReached,
    isFetchingNextPage,
  }: GrantTokensDisclosureState,
): ReactNode {
  if (showInitialLoading) {
    return <GrantTokensLoadingState />;
  }

  if (showInitialError) {
    return (
      <GrantTokensErrorState message={errorMessage} onRetry={onRetry} />
    );
  }

  if (tokenRanges.length === 0) {
    return <GrantTokensEmptyState />;
  }

  const mappedTokens = tokens.map((t) => ({
    tokenId: BigInt(t.token),
    xtdh: t.xtdh,
  }));

  return (
    <>
      <VirtualizedTokenList
        contractAddress={contractAddress ?? undefined}
        chain={chain}
        ranges={tokenRanges}
        scrollKey={`grant-token-list-${grantId}`}
        className=""
        scrollContainerClassName="tw-max-h-[480px] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
        onEndReached={onEndReached}
        endReachedOffset={END_REACHED_OFFSET}
        layout="grid"
        tokens={mappedTokens}
      />
      {isFetchingNextPage ? <GrantTokensLoadingMore /> : null}
    </>
  );
}

function GrantTokensLoadingState() {
  return (
    <div className="tw-flex tw-min-h-24 tw-items-center tw-justify-center">
      <Spinner />
    </div>
  );
}

function GrantTokensErrorState({
  message,
  onRetry,
}: Readonly<{ message: string; onRetry: () => void }>) {
  return (
    <div className="tw-rounded-lg tw-border tw-border-red-500/40 tw-bg-red-500/5 tw-p-4">
      <p className="tw-m-0 tw-text-sm tw-text-red-300">{message}</p>
      <button
        type="button"
        className="tw-mt-3 tw-rounded-md tw-border tw-border-red-500/60 tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-red-200 desktop-hover:hover:tw-bg-red-500/10"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}

function GrantTokensEmptyState() {
  return (
    <div className="tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-925 tw-p-4">
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">
        No specific token IDs were returned for this grant.
      </p>
    </div>
  );
}

function GrantTokensLoadingMore() {
  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-border-t tw-border-iron-800 tw-bg-iron-900 tw-py-2 tw-text-xs tw-text-iron-300">
      <Spinner />
      <span className="tw-ml-2">Loading more tokens…</span>
    </div>
  );
}
