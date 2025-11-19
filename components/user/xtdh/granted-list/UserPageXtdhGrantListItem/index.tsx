"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useCallback, useId, useMemo, useState } from "react";

import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import type {
  SupportedChain,
  TokenRange,
} from "@/components/nft-picker/NftPicker.types";
import { toCanonicalRanges } from "@/components/nft-picker/NftPicker.utils";
import { VirtualizedTokenList } from "@/components/token-list/VirtualizedTokenList";
import Spinner from "@/components/utils/Spinner";
import { getTargetTokensCountInfo } from "@/components/user/xtdh/utils/xtdhGrantFormatters";
import { useTdhGrantTokensQuery } from "@/hooks/useTdhGrantTokensQuery";

import {
  GrantItemContent,
  GrantItemError,
  GrantItemSkeleton,
} from "./subcomponents";
import { useGrantItemViewModel } from "./useGrantItemViewModel";

export interface UserPageXtdhGrantListItemProps {
  readonly grant: ApiTdhGrantsPage["data"][number];
}

export function UserPageXtdhGrantListItem({
  grant,
}: Readonly<UserPageXtdhGrantListItemProps>) {
  const {
    chain,
    contract,
    contractAddress,
    contractLabel,
    details,
    errorDetails,
    isLoading,
    status,
    variant,
  } = useGrantItemViewModel(grant);

  const tokenState = useMemo<TokenPanelState>(() => {
    const info = getTargetTokensCountInfo(grant.target_tokens_count ?? null);
    if (info.kind === "all") {
      return { type: "all" };
    }
    if (info.kind === "count") {
      return { type: "count", label: info.label, count: info.count };
    }
    return { type: "unknown", label: info.label };
  }, [grant.target_tokens_count]);

  if (isLoading) {
    return (
      <GrantListItemContainer>
        <GrantItemSkeleton />
      </GrantListItemContainer>
    );
  }

  return (
    <GrantListItemContainer>
      {variant === "contract" && contract ? (
        <GrantItemContent
          contract={contract}
          status={status}
          details={details}
          errorDetails={errorDetails}
        />
      ) : (
        <GrantItemError
          contractLabel={contractLabel}
          status={status}
          details={details}
          errorDetails={errorDetails}
        />
      )}
      <GrantTokensPanel
        chain={chain}
        contractAddress={contractAddress}
        grantId={grant.id}
        state={tokenState}
      />
    </GrantListItemContainer>
  );
}

function GrantListItemContainer({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <li className="tw-list-none tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      {children}
    </li>
  );
}

type TokenPanelState =
  | { type: "all" }
  | { type: "count"; label: string; count: number }
  | { type: "unknown"; label: string };

function GrantTokensPanel({
  chain,
  contractAddress,
  grantId,
  state,
}: Readonly<{
  chain: SupportedChain | null;
  contractAddress: `0x${string}` | null;
  grantId: string;
  state: TokenPanelState;
}>) {
  if (state.type === "all") {
    return (
      <div className="tw-mt-4 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-3">
        <p className="tw-m-0 tw-text-sm tw-text-iron-200">
          This grant applies to every token in the collection.
        </p>
      </div>
    );
  }

  const tokensCount = state.type === "count" ? state.count : null;

  return (
    <GrantTokensDisclosure
      chain={chain}
      contractAddress={contractAddress}
      grantId={grantId}
      tokensCount={tokensCount}
      tokensCountLabel={state.label}
    />
  );
}

const TOKEN_PAGE_SIZE = 500;
const END_REACHED_OFFSET = 48;
const DEFAULT_GRANT_TOKENS_ERROR_MESSAGE =
  "We couldn't load the granted tokens right now. Please try again.";

function GrantTokensDisclosure({
  chain,
  contractAddress,
  grantId,
  tokensCount,
  tokensCountLabel,
}: Readonly<{
  chain: SupportedChain | null;
  contractAddress: `0x${string}` | null;
  grantId: string;
  tokensCount: number | null;
  tokensCountLabel: string;
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const {
    tokens,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTdhGrantTokensQuery({
    grantId,
    pageSize: TOKEN_PAGE_SIZE,
    enabled: isOpen,
  });

  const tokenRanges = useMemo(() => mapTokensToRanges(tokens), [tokens]);
  const showInitialLoading = isOpen && tokenRanges.length === 0 && isLoading;
  const showInitialError = isOpen && tokenRanges.length === 0 && isError;
  const errorMessage = getGrantTokensErrorMessage(error);
  const handleEndReached = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    fetchNextPage().catch(() => {
      // Errors are surfaced through the query state rendered below.
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const handleRetry = useCallback(() => {
    refetch().catch(() => {
      // Errors will re-render the existing error state.
    });
  }, [refetch]);
  const body = renderGrantTokensDisclosureBody({
    showInitialLoading,
    showInitialError,
    tokenRanges,
    errorMessage,
    onRetry: handleRetry,
    contractAddress,
    chain,
    grantId,
    onEndReached: hasNextPage ? handleEndReached : undefined,
    isFetchingNextPage,
  });
  const tokensCountWord = tokensCount === 1 ? "token" : "tokens";
  const tokensCountDescription =
    tokensCount == null
      ? tokensCountLabel
      : `${tokensCountLabel} ${tokensCountWord}`;

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
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
            {isOpen ? "Hide granted tokens" : "Show granted tokens"}
          </span>
          <span className="tw-text-xs tw-text-iron-350">
            Expand to inspect
            {" "}
            {tokensCountDescription}
            {" "}
            granted to this wallet.
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

type GrantTokensDisclosureBodyProps = {
  showInitialLoading: boolean;
  showInitialError: boolean;
  tokenRanges: TokenRange[];
  errorMessage: string;
  onRetry: () => void;
  contractAddress: `0x${string}` | null;
  chain: SupportedChain | null;
  grantId: string;
  onEndReached?: () => void;
  isFetchingNextPage: boolean;
};

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
}: GrantTokensDisclosureBodyProps): ReactNode {
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

function getGrantTokensErrorMessage(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") {
    return "Loading granted tokens took too long. Please try again.";
  }
  return DEFAULT_GRANT_TOKENS_ERROR_MESSAGE;
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

function mapTokensToRanges(tokens: readonly string[]): TokenRange[] {
  if (!tokens.length) {
    return [];
  }
  const ids: bigint[] = [];
  for (const token of tokens) {
    try {
      ids.push(BigInt(token));
    } catch {
      // Ignore malformed token identifiers.
    }
  }
  if (ids.length === 0) {
    console.warn(
      "Grant tokens API returned only malformed token identifiers.",
      { tokensCount: tokens.length }
    );
    return [];
  }
  return toCanonicalRanges(ids);
}

function GrantTokensLoadingMore() {
  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-border-t tw-border-iron-800 tw-bg-iron-900 tw-py-2 tw-text-xs tw-text-iron-300">
      <Spinner />
      <span className="tw-ml-2">Loading more tokens…</span>
    </div>
  );
}
