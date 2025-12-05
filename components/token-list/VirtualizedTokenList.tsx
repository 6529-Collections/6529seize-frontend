"use client";

import { useMemo } from "react";
import { createBreakpoint } from "react-use";

import type { VirtualizedTokenListProps } from "./types";

import { getTotalCount } from "./utils";
import { VirtualizedTokenListContent } from "./VirtualizedTokenListContent";

const useBreakpoint = createBreakpoint({ LG: 1024, MD: 768, S: 0 });

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
  columns: columnsProp,

  tokens,
}: Readonly<VirtualizedTokenListProps>) {
  const breakpoint = useBreakpoint();
  const responsiveColumns = breakpoint === "LG" ? 3 : breakpoint === "MD" ? 2 : 1;
  const columns = columnsProp ?? responsiveColumns;

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
