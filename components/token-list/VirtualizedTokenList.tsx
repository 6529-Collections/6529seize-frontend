"use client";

import { useMemo } from "react";

import type { VirtualizedTokenListProps } from "./types";
import { getTotalCount } from "./utils";
import { VirtualizedTokenListContent } from "./VirtualizedTokenListContent";

export type { VirtualizedTokenListProps } from "./types";

export function VirtualizedTokenList({
  contractAddress,
  chain,
  ranges,
  scrollKey,
  overscan,
  renderTokenExtra,
  action,
  className,
  scrollContainerClassName,
  rowClassName,
  footerContent,
  footerClassName,
  emptyState = <div className="tw-text-sm tw-text-iron-300">No tokens available.</div>,
  onEndReached,
  endReachedOffset,
  layout = "list",
  columns = 3,

  tokens,
}: Readonly<VirtualizedTokenListProps>) {
  const totalCount = useMemo(() => getTotalCount(ranges, tokens), [ranges, tokens]);

  return (
    <VirtualizedTokenListContent
      key={scrollKey}
      contractAddress={contractAddress}
      chain={chain}
      ranges={ranges}
      scrollKey={scrollKey}
      totalCount={totalCount}
      overscan={overscan}
      renderTokenExtra={renderTokenExtra}
      action={action}
      className={className}
      scrollContainerClassName={scrollContainerClassName}
      rowClassName={rowClassName}
      footerContent={footerContent}
      footerClassName={footerClassName}
      onEndReached={onEndReached}
      endReachedOffset={endReachedOffset}
      emptyState={emptyState}
      layout={layout}
      columns={columns}

      tokens={tokens}
    />
  );
}
