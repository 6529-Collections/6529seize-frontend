import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import CommunityCurationsMasonry from "@/components/community-curations/CommunityCurationsMasonry";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

// Masonic yields cells in interval-tree order, which shifts as cards are
// measured. Stand in for that order so the test controls it.
let mockCellOrder: readonly number[] = [];

jest.mock("masonic", () => ({
  usePositioner: () => ({}),
  useResizeObserver: () => ({}),
  useMasonry: ({
    containerRef,
    itemKey,
    items,
  }: {
    readonly containerRef: (element: HTMLElement | null) => void;
    readonly itemKey: (item: { readonly id: string }, index: number) => string;
    readonly items: readonly { readonly id: string }[];
  }) =>
    createElement(
      "div",
      { ref: containerRef, role: "grid" },
      mockCellOrder.map((index) =>
        createElement(
          "div",
          { key: itemKey(items[index]!, index), role: "gridcell" },
          createElement("button", { type: "button" }, items[index]!.id)
        )
      )
    ),
}));
jest.mock("@/hooks/useNavigateToDropWave", () => ({
  useNavigateToDropWave: () => jest.fn(),
}));

const drops = ["first", "second", "third"].map(
  (id) => ({ id, stableKey: id }) as ExtendedDrop
);

const renderFeed = () => (
  <CommunityCurationsMasonry
    drops={drops}
    fetchNextPage={jest.fn()}
    hasNextPage={false}
    isFetchingNextPage={false}
    scrollContainer={null}
  />
);

const getCardOrder = () =>
  screen.getAllByRole("gridcell").map((cell) => cell.textContent);

describe("CommunityCurationsMasonry", () => {
  it("keeps cards in feed order without moving them when masonry reorders cells", () => {
    mockCellOrder = [2, 0, 1];
    const { rerender } = render(renderFeed());
    expect(getCardOrder()).toEqual(["first", "second", "third"]);

    // Browsers blur a focused card when React moves its node. jsdom keeps
    // focus, so assert directly that no mounted card is moved.
    const observer = new MutationObserver(() => undefined);
    observer.observe(screen.getByRole("grid"), { childList: true });
    mockCellOrder = [1, 2, 0];
    rerender(renderFeed());
    const movedCells = observer
      .takeRecords()
      .flatMap((record) => [...record.removedNodes]);
    observer.disconnect();

    expect(movedCells).toEqual([]);
    expect(getCardOrder()).toEqual(["first", "second", "third"]);
  });
});
