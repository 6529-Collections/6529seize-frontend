import Image from "next/image";
import type { ReactNode } from "react";

import type { ApiXTdhTokensPage } from "@/generated/models/ApiXTdhTokensPage";
import Spinner from "@/components/utils/Spinner";
import type { TokenMetadata } from "@/types/nft";

import { formatXtdhRate, formatXtdhValue } from "../utils/formatters";
import { useXtdhTokenMetadataMap } from "./useXtdhTokenMetadataMap";

type ApiXtdhToken = ApiXTdhTokensPage["data"][number];

interface XtdhTokensListProps {
  readonly tokens: ApiXTdhTokensPage["data"];
  readonly contractAddress: `0x${string}` | null;
  readonly isEnabled: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly errorMessage?: string;
  readonly onRetry: () => void;
}

export function XtdhTokensList({
  tokens,
  contractAddress,
  isEnabled,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: Readonly<XtdhTokensListProps>) {
  const {
    metadataMap,
    isFetching: isFetchingMetadata,
    hasError: hasMetadataError,
  } = useXtdhTokenMetadataMap(contractAddress, tokens);

  if (!isEnabled) {
    return (
      <ListMessage>
        Unable to load token details for this collection.
      </ListMessage>
    );
  }

  const showInitialLoading = isLoading && tokens.length === 0;
  if (showInitialLoading) {
    return <TokensSkeleton />;
  }

  const showInitialError = isError && tokens.length === 0;
  if (showInitialError) {
    return <ListError message={errorMessage} onRetry={onRetry} />;
  }

  if (!tokens.length) {
    return (
      <ListMessage>
        No individual token allocations were returned for this collection.
      </ListMessage>
    );
  }

  return (
    <div className="tw-space-y-3">
      <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-p-0">
        {tokens.map((token) => {
          const decimalId = Number.isFinite(token.token)
            ? Math.trunc(token.token).toString()
            : "";
          const metadata = decimalId ? metadataMap.get(decimalId) : undefined;
          const isMetadataLoading = !!decimalId && !metadata && isFetchingMetadata;
          const metadataError = !!decimalId && !metadata && hasMetadataError;
          return (
            <TokenListItem
              key={getTokenKey(token)}
              token={token}
              metadata={metadata}
              isMetadataLoading={isMetadataLoading}
              hasMetadataError={metadataError}
            />
          );
        })}
      </ul>
      {isError ? (
        <InlineRetry message={errorMessage} onRetry={onRetry} />
      ) : null}
    </div>
  );
}

function TokenListItem({
  token,
  metadata,
  isMetadataLoading,
  hasMetadataError,
}: Readonly<{
  token: ApiXtdhToken;
  metadata?: TokenMetadata;
  isMetadataLoading: boolean;
  hasMetadataError: boolean;
}>) {
  const tokenLabel = Number.isFinite(token.token)
    ? `#${Math.trunc(token.token).toString()}`
    : "Token";

  const xtdhValue = formatXtdhValue(token.xtdh);
  const xtdhRateValue = formatXtdhRate(token.xtdh_rate);

  return (
    <li className="tw-list-none tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
      <div className="tw-flex tw-items-center tw-gap-3">
        <TokenThumbnail
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
      <dl className="tw-mt-4 tw-grid tw-gap-3 sm:tw-grid-cols-2">
        <TokenMetric label="xTDH" value={xtdhValue} />
        <TokenMetric label="xTDH rate" value={xtdhRateValue} />
      </dl>
    </li>
  );
}

function TokenThumbnail({
  tokenLabel,
  metadata,
  isLoading,
  hasError,
}: Readonly<{
  tokenLabel: string;
  metadata?: TokenMetadata;
  isLoading: boolean;
  hasError: boolean;
}>) {
  let content: ReactNode;

  if (metadata?.imageUrl) {
    content = (
      <Image
        src={metadata.imageUrl}
        alt={metadata.name ?? tokenLabel}
        fill
        sizes="48px"
        className="tw-h-full tw-w-full tw-object-cover"
      />
    );
  } else if (isLoading) {
    content = (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
        <Spinner />
      </div>
    );
  } else if (hasError) {
    content = (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-[10px] tw-font-semibold tw-text-red-300">
        Error
      </div>
    );
  } else {
    content = (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-text-iron-400">
        {tokenLabel}
      </div>
    );
  }

  return (
    <div className="tw-relative tw-h-12 tw-w-12 tw-overflow-hidden tw-rounded-xl tw-bg-iron-800">
      {content}
    </div>
  );
}

function TokenMetric({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-0.5">
      <dt className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
        {value}
      </dd>
    </div>
  );
}

function TokensSkeleton() {
  return (
    <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-p-0">
      {SKELETON_INDICES.map((index) => (
        <li
          key={`token-skeleton-${index}`}
          className="tw-list-none tw-animate-pulse tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3"
        >
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-h-12 tw-w-12 tw-rounded-xl tw-bg-iron-800" />
            <div className="tw-flex-1 tw-space-y-2">
              <div className="tw-h-4 tw-w-32 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-3 tw-w-24 tw-rounded tw-bg-iron-850" />
            </div>
          </div>
          <div className="tw-mt-4 tw-grid tw-gap-3 sm:tw-grid-cols-2">
            <div className="tw-space-y-2">
              <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-850" />
            </div>
            <div className="tw-space-y-2">
              <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-850" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

const SKELETON_INDICES = [0, 1, 2];

function ListMessage({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="tw-m-0 tw-text-sm tw-text-iron-300">{children}</p>;
}

function ListError({
  message,
  onRetry,
}: Readonly<{ message?: string; onRetry: () => void }>) {
  const displayMessage = message ?? "Failed to load received tokens.";
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <p className="tw-m-0 tw-text-sm tw-text-red-400" role="alert">
        {displayMessage}
      </p>
      <RetryButton onRetry={onRetry} />
    </div>
  );
}

function InlineRetry({
  message,
  onRetry,
}: Readonly<{ message?: string; onRetry: () => void }>) {
  const displayMessage = message ?? "Unable to load more tokens.";
  return (
    <div className="tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-3">
      <p className="tw-m-0 tw-text-sm tw-text-iron-100" role="alert">
        {displayMessage}
      </p>
      <div className="tw-mt-2">
        <RetryButton onRetry={onRetry} />
      </div>
    </div>
  );
}

function RetryButton({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <button
      type="button"
      onClick={onRetry}
      className="tw-rounded tw-bg-primary-500 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-black desktop-hover:hover:tw-bg-primary-400"
    >
      Retry
    </button>
  );
}

function getTokenKey(token: ApiXtdhToken): string {
  const contract = token.contract?.toLowerCase() ?? "unknown";
  const tokenId = Number.isFinite(token.token)
    ? Math.trunc(token.token).toString()
    : "unknown";
  return `${contract}-${tokenId}`;
}
