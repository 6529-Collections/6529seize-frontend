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
    <div className="tw-mt-4 tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-950">
      <button
        type="button"
        className={clsx(
          "tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-border-none tw-bg-transparent tw-px-4 tw-py-3 tw-text-left tw-text-iron-50 tw-transition-colors tw-duration-200 tw-appearance-none focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950",
          isOpen
            ? "tw-bg-iron-900"
            : "desktop-hover:hover:tw-bg-iron-900/40"
        )}
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
            {isOpen ? "Hide granted tokens" : "Show granted tokens"}
          </span>
          <span className="tw-text-xs tw-text-iron-350">
            {`Expand to inspect ${tokensCountDescription} granted to this wallet.`}
          </span>
        </div>
        <span
          aria-hidden="true"
          className="tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-800 tw-bg-iron-900 tw-text-iron-50 tw-transition-colors tw-duration-200"
        >
          <FontAwesomeIcon
            icon={faChevronDown}
            className={clsx(
              "tw-size-5 tw-transition-transform tw-duration-200",
              isOpen && "tw-rotate-180"
            )}
          />
        </span>
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

function renderGrantTokensDisclosureBody({
  showInitialLoading,
  showInitialError,
  tokenRanges,
  errorMessage,
  onRetry,
  contractAddress,
  chain,
  grantId,
  onEndReached,
  isFetchingNextPage,
}: GrantTokensDisclosureState): ReactNode {
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

  return (
    <>
      <VirtualizedTokenList
        contractAddress={contractAddress ?? undefined}
        chain={chain}
        ranges={tokenRanges}
        scrollKey={`grant-token-list-${grantId}`}
        className="tw-rounded-md tw-border tw-border-iron-800 tw-bg-iron-900"
        onEndReached={onEndReached}
        endReachedOffset={END_REACHED_OFFSET}
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
