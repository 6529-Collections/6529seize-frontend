import type { ReactNode } from "react";

import type { ApiXTdhCollectionsPage } from "@/generated/models/ApiXTdhCollectionsPage";

import { XtdhReceivedCollectionCard } from "../collection-card-content";

type ApiXtdhCollection = ApiXTdhCollectionsPage["data"][number];

interface XtdhCollectionsListProps {
  readonly isEnabled: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly collections: ApiXTdhCollectionsPage["data"];
  readonly errorMessage?: string;
  readonly onRetry: () => void;
}

export function XtdhCollectionsList({
  isEnabled,
  isLoading,
  isError,
  collections,
  errorMessage,
  onRetry,
}: Readonly<XtdhCollectionsListProps>) {
  if (!isEnabled) {
    return (
      <ListMessage>
        Unable to load xTDH received collections for this identity.
      </ListMessage>
    );
  }

  const showInitialLoading = isLoading && collections.length === 0;
  if (showInitialLoading) {
    return <CollectionsSkeleton />;
  }

  const showInitialError = isError && collections.length === 0;
  if (showInitialError) {
    return (
      <ListError message={errorMessage} onRetry={onRetry} />
    );
  }

  if (!collections.length) {
    return (
      <ListMessage>
        This identity hasn't received any xTDH yet. When grants send xTDH to NFT
        collections, collectors start accruing TDH automatically once they hold
        eligible tokens. Grants received here will appear as soon as the identity
        is included in a collection.
      </ListMessage>
    );
  }

  return (
    <div className="tw-space-y-3">
      <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-p-0">
        {collections.map((collection) => (
          <XtdhReceivedCollectionCard
            key={getCollectionKey(collection)}
            collection={collection}
          />
        ))}
      </ul>
      {isError ? (
        <InlineRetry message={errorMessage} onRetry={onRetry} />
      ) : null}
    </div>
  );
}

function ListMessage({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="tw-m-0 tw-text-sm tw-text-iron-300">{children}</p>;
}

function ListError({
  message,
  onRetry,
}: Readonly<{ message?: string; onRetry: () => void }>) {
  const displayMessage = message ?? "Failed to load received collections.";
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
  const displayMessage = message ?? "Unable to load more collections.";
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

function CollectionsSkeleton() {
  return (
    <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-p-0">
      {SKELETON_INDICES.map((index) => (
        <li
          key={`skeleton-${index}`}
          className="tw-list-none tw-animate-pulse tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4"
        >
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-h-14 tw-w-14 tw-rounded-xl tw-bg-iron-800" />
            <div className="tw-flex-1 tw-space-y-2">
              <div className="tw-h-4 tw-w-32 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-3 tw-w-48 tw-rounded tw-bg-iron-850" />
            </div>
          </div>
          <div className="tw-mt-4 tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
            {SKELETON_METRIC_KEYS.map((metricKey) => (
              <div key={metricKey} className="tw-space-y-2">
                <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
                <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-850" />
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

const SKELETON_INDICES = [0, 1, 2];
const SKELETON_METRIC_KEYS = Array.from({ length: 7 }, (_, index) => `metric-${index}`);

function getCollectionKey(collection: ApiXtdhCollection) {
  const normalizedContract = collection.contract?.trim().toLowerCase();
  if (normalizedContract) {
    return normalizedContract;
  }

  return [
    collection.xtdh,
    collection.xtdh_rate,
    collection.token_count,
    collection.grant_count,
  ].join("-");
}
