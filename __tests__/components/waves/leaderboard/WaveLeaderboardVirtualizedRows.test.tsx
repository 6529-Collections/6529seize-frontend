import { act, render, renderHook, screen } from "@testing-library/react";
import { useRef } from "react";
import type { Virtualizer } from "@tanstack/react-virtual";

import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import {
  useLeaderboardLeadingItemCount,
  WaveLeaderboardVirtualizedRows,
} from "@/components/waves/leaderboard/WaveLeaderboardVirtualizedRows";
import { useWaveLeaderboardVotingModal } from "@/components/waves/leaderboard/WaveLeaderboardVotingModal";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

const initialMockVirtualItems = [
  { index: 0, key: "row-0", size: 100, start: 0 },
  { index: 1, key: "row-1", size: 100, start: 100 },
];
let mockVirtualItems = initialMockVirtualItems;
const mockMeasureElement = jest.fn();
const mockScrollToIndex = jest.fn();
const mockVirtualizer = {
  getVirtualItems: () => mockVirtualItems,
  getTotalSize: () => 500,
  measureElement: mockMeasureElement,
  scrollToIndex: mockScrollToIndex,
} as unknown as Virtualizer<HTMLDivElement, Element>;
interface MockVirtualizerOptions {
  readonly getScrollElement?: () => HTMLDivElement | null;
  readonly onChange?: (
    instance: Virtualizer<HTMLDivElement, Element>
  ) => void;
}
let mockVirtualizerOptions: MockVirtualizerOptions | undefined;
let mockOnVirtualizerChange:
  | ((instance: Virtualizer<HTMLDivElement, Element>) => void)
  | undefined;

jest.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: (options: MockVirtualizerOptions) => {
    mockVirtualizerOptions = options;
    mockOnVirtualizerChange = options.onChange;
    return mockVirtualizer;
  },
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
  beforeEach(() => {
    jest.clearAllMocks();
    mockVirtualItems = initialMockVirtualItems;
    mockVirtualizerOptions = undefined;
    mockOnVirtualizerChange = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("updates mounted rows when the virtualizer range changes", () => {
    const fetchPage = jest.fn().mockResolvedValue(undefined);

    function Harness() {
      const scrollContainerRef = useRef<HTMLDivElement | null>(null);
      return (
        <div ref={scrollContainerRef} data-testid="scroll-container">
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

    const { rerender } = render(<Harness />);

    expect(screen.getByText("drop-1")).toBeInTheDocument();
    expect(screen.getByText("drop-2")).toBeInTheDocument();
    expect(screen.queryByText("drop-3")).not.toBeInTheDocument();
    expect(screen.queryByText("drop-4")).not.toBeInTheDocument();
    expect(screen.queryByText("drop-5")).not.toBeInTheDocument();
    expect(screen.getByText("drop-1").parentElement).toHaveAttribute(
      "aria-posinset",
      "1"
    );
    expect(screen.getByText("drop-2").parentElement).toHaveAttribute(
      "aria-posinset",
      "2"
    );
    expect(mockVirtualizerOptions?.getScrollElement?.()).toBe(
      screen.getByTestId("scroll-container")
    );
    expect(mockMeasureElement).toHaveBeenCalled();

    mockVirtualItems = [
      { index: 3, key: "row-3", size: 100, start: 300 },
      { index: 4, key: "row-4", size: 100, start: 400 },
    ];
    rerender(<Harness />);

    expect(screen.queryByText("drop-1")).not.toBeInTheDocument();
    expect(screen.queryByText("drop-2")).not.toBeInTheDocument();
    expect(screen.getByText("drop-4")).toBeInTheDocument();
    expect(screen.getByText("drop-5")).toBeInTheDocument();
  });

  it("automatically fetches the next page near the last virtual row", () => {
    const fetchNextPage = jest.fn().mockResolvedValue(undefined);
    mockVirtualItems = [
      { index: 8, key: "row-8", size: 100, start: 800 },
      { index: 9, key: "row-9", size: 100, start: 900 },
    ];

    function Harness() {
      const scrollContainerRef = useRef<HTMLDivElement | null>(null);
      return (
        <div ref={scrollContainerRef}>
          <WaveLeaderboardVirtualizedRows
            items={Array.from({ length: 10 }, (_, index) => `drop-${index}`)}
            getItemId={(item) => item}
            leadingItemCount={0}
            windowKey="wave-1:rank"
            layout="list"
            scrollContainerRef={scrollContainerRef}
            renderItem={(item) => <div>{item}</div>}
            fetchNextPage={fetchNextPage}
            fetchPreviousPage={jest.fn().mockResolvedValue(undefined)}
            hasNextPage={true}
            hasPreviousPage={false}
            isFetchingNextPage={false}
            isFetchingPreviousPage={false}
            isFetchNextPageError={false}
            isFetchPreviousPageError={false}
            autoLoadNext={true}
          />
        </div>
      );
    }

    render(<Harness />);
    act(() => mockOnVirtualizerChange?.(mockVirtualizer));

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("keeps a loaded grid card beside a mixed-boundary retry", () => {
    const getBoundingClientRectSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        bottom: 100,
        right: 800,
        width: 800,
        height: 100,
        toJSON: () => ({}),
      } as DOMRect);

    function Harness() {
      const scrollContainerRef = useRef<HTMLDivElement | null>(null);
      return (
        <div ref={scrollContainerRef}>
          <WaveLeaderboardVirtualizedRows
            items={["drop-1", "drop-2"]}
            getItemId={(item) => item}
            leadingItemCount={2}
            windowKey="wave-1:rank"
            layout="grid"
            scrollContainerRef={scrollContainerRef}
            renderItem={(item) => <div>{item}</div>}
            fetchNextPage={jest.fn().mockResolvedValue(undefined)}
            fetchPreviousPage={jest.fn().mockResolvedValue(undefined)}
            hasNextPage={false}
            hasPreviousPage={true}
            isFetchingNextPage={false}
            isFetchingPreviousPage={false}
            isFetchNextPageError={false}
            isFetchPreviousPageError={true}
          />
        </div>
      );
    }

    render(<Harness />);

    const retryButton = screen.getByRole("button", {
      name: "Retry loading earlier drops",
    });
    expect(retryButton.parentElement).toHaveAttribute(
      "style",
      expect.stringContaining("grid-column: span 2")
    );
    expect(screen.getByText("drop-1")).toBeInTheDocument();
    expect(screen.getByText("drop-2")).toBeInTheDocument();

    getBoundingClientRectSpy.mockRestore();
  });

  it("prefetches each newly available previous page", () => {
    const fetchPreviousPage = jest.fn().mockResolvedValue(undefined);

    function Harness({
      leadingItemCount,
    }: {
      readonly leadingItemCount: number;
    }) {
      const scrollContainerRef = useRef<HTMLDivElement | null>(null);
      return (
        <div ref={scrollContainerRef}>
          <WaveLeaderboardVirtualizedRows
            items={["drop-1", "drop-2"]}
            getItemId={(item) => item}
            leadingItemCount={leadingItemCount}
            windowKey="wave-1:rank"
            layout="list"
            scrollContainerRef={scrollContainerRef}
            renderItem={(item) => <div>{item}</div>}
            fetchNextPage={jest.fn().mockResolvedValue(undefined)}
            fetchPreviousPage={fetchPreviousPage}
            hasNextPage={true}
            hasPreviousPage={true}
            isFetchingNextPage={false}
            isFetchingPreviousPage={false}
            isFetchNextPageError={false}
            isFetchPreviousPageError={false}
          />
        </div>
      );
    }

    const { rerender } = render(<Harness leadingItemCount={100} />);

    act(() => mockOnVirtualizerChange?.(mockVirtualizer));
    expect(fetchPreviousPage).toHaveBeenCalledTimes(1);

    rerender(<Harness leadingItemCount={50} />);
    act(() => mockOnVirtualizerChange?.(mockVirtualizer));

    expect(fetchPreviousPage).toHaveBeenCalledTimes(2);
  });
});
