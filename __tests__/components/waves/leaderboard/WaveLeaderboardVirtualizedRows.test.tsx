import { act, render, renderHook, screen } from "@testing-library/react";
import { useRef } from "react";

import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import {
  useLeaderboardLeadingItemCount,
  WaveLeaderboardVirtualizedRows,
} from "@/components/waves/leaderboard/WaveLeaderboardVirtualizedRows";
import { useWaveLeaderboardVotingModal } from "@/components/waves/leaderboard/WaveLeaderboardVotingModal";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

jest.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [
      { index: 0, key: "row-0", size: 100, start: 0 },
      { index: 1, key: "row-1", size: 100, start: 100 },
    ],
    getTotalSize: () => 500,
    measureElement: jest.fn(),
    scrollToIndex: jest.fn(),
  }),
}));

describe("useLeaderboardLeadingItemCount", () => {
  it("keeps logical positions stable when an earlier page is evicted", () => {
    const { result, rerender } = renderHook(
      ({ page, visibleItemIds }) =>
        useLeaderboardLeadingItemCount({
          pageMetadata: [page],
          visibleItemIds,
          windowKey: "wave-1:rank",
        }),
      {
        initialProps: {
          page: { page: 1, dropIds: ["drop-1", "drop-2"] },
          visibleItemIds: new Set(["drop-1", "drop-2"]),
        },
      }
    );

    expect(result.current).toBe(0);

    rerender({
      page: { page: 2, dropIds: ["drop-3", "drop-4"] },
      visibleItemIds: new Set(["drop-3", "drop-4"]),
    });

    expect(result.current).toBe(2);

    rerender({
      page: { page: 1, dropIds: ["drop-1", "drop-2"] },
      visibleItemIds: new Set(["drop-1", "drop-2"]),
    });

    expect(result.current).toBe(0);
  });

  it("counts only visible gallery items in evicted pages", () => {
    const { result, rerender } = renderHook(
      ({ page, visibleItemIds }) =>
        useLeaderboardLeadingItemCount({
          pageMetadata: [page],
          visibleItemIds,
          windowKey: "wave-1:gallery",
        }),
      {
        initialProps: {
          page: { page: 1, dropIds: ["with-media", "without-media"] },
          visibleItemIds: new Set(["with-media"]),
        },
      }
    );

    expect(result.current).toBe(0);

    rerender({
      page: { page: 2, dropIds: ["next-with-media"] },
      visibleItemIds: new Set(["next-with-media"]),
    });

    expect(result.current).toBe(1);
  });

  it("resets its page ledger when the query changes", () => {
    const { result, rerender } = renderHook(
      ({ page, windowKey }) =>
        useLeaderboardLeadingItemCount({
          pageMetadata: [page],
          visibleItemIds: new Set(page.dropIds),
          windowKey,
        }),
      {
        initialProps: {
          page: { page: 1, dropIds: ["drop-1"] },
          windowKey: "wave-1:rank",
        },
      }
    );

    rerender({
      page: { page: 2, dropIds: ["drop-2"] },
      windowKey: "wave-1:rank",
    });
    expect(result.current).toBe(1);

    rerender({
      page: { page: 2, dropIds: ["drop-2"] },
      windowKey: "wave-1:price",
    });

    expect(result.current).toBe(WAVE_DROPS_PARAMS.limit);
  });
});

describe("useWaveLeaderboardVotingModal", () => {
  it("keeps the active drop available when virtualization removes its card", () => {
    const originalDrop = { id: "drop-1", rating: 10 } as ExtendedDrop;
    const updatedDrop = { ...originalDrop, rating: 20 } as ExtendedDrop;
    const { result, rerender } = renderHook(
      ({ drops }) => useWaveLeaderboardVotingModal(drops),
      { initialProps: { drops: [originalDrop] } }
    );

    act(() => result.current.openVotingModal(originalDrop));
    expect(result.current.votingDrop).toBe(originalDrop);

    rerender({ drops: [updatedDrop] });
    expect(result.current.votingDrop).toBe(updatedDrop);

    rerender({ drops: [] });
    expect(result.current.votingDrop).toBe(originalDrop);
  });
});

describe("WaveLeaderboardVirtualizedRows", () => {
  it("mounts only rows selected by the virtualizer", () => {
    const fetchPage = jest.fn().mockResolvedValue(undefined);

    function Harness() {
      const scrollContainerRef = useRef<HTMLDivElement | null>(null);
      return (
        <div ref={scrollContainerRef}>
          <WaveLeaderboardVirtualizedRows
            items={["drop-1", "drop-2", "drop-3", "drop-4", "drop-5"]}
            getItemId={(item) => item}
            leadingItemCount={0}
            windowKey="wave-1:rank"
            layout="list"
            scrollContainerRef={scrollContainerRef}
            renderItem={(item) => <div>{item}</div>}
            fetchNextPage={fetchPage}
            fetchPreviousPage={fetchPage}
            hasNextPage={false}
            hasPreviousPage={false}
            isFetchingNextPage={false}
            isFetchingPreviousPage={false}
            isFetchNextPageError={false}
            isFetchPreviousPageError={false}
          />
        </div>
      );
    }

    render(<Harness />);

    expect(screen.getByText("drop-1")).toBeInTheDocument();
    expect(screen.getByText("drop-2")).toBeInTheDocument();
    expect(screen.queryByText("drop-3")).not.toBeInTheDocument();
    expect(screen.queryByText("drop-4")).not.toBeInTheDocument();
    expect(screen.queryByText("drop-5")).not.toBeInTheDocument();
  });
});
