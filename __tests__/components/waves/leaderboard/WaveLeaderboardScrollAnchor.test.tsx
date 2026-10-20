import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { WaveLeaderboardScrollAnchor } from "@/components/waves/leaderboard/WaveLeaderboardScrollAnchor";
import { useScrollStableLeaderboardItems } from "@/components/waves/leaderboard/useScrollStableLeaderboardItems";

const getId = (item: { id: string; score: number }) => item.id;
const revealIndex = jest.fn();

function StableItems({
  items,
}: {
  readonly items: { id: string; score: number }[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const stable = useScrollStableLeaderboardItems(
    items,
    getId,
    ref,
    "wave:rank"
  );
  return (
    <div ref={ref} data-testid="stable">
      {stable.map(({ id, score }) => `${id}:${score}`).join(",")}
    </div>
  );
}

function Harness({
  ids,
  windowKey = "wave:rank",
  mountedIds = ids,
  columns = 1,
}: {
  readonly ids: string[];
  readonly windowKey?: string;
  readonly mountedIds?: string[];
  readonly columns?: number;
}) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  return (
    <div ref={scrollContainerRef} data-testid="scroller">
      <WaveLeaderboardScrollAnchor
        rootRef={rootRef}
        scrollContainerRef={scrollContainerRef}
        itemIds={ids}
        windowKey={windowKey}
        columns={columns}
        leadingItemCount={0}
        masonry={false}
        revealIndex={revealIndex}
      >
        <div ref={rootRef}>
          {mountedIds.map((id) => (
            <div
              key={id}
              data-leaderboard-drop-id={id}
              data-position={Math.floor(ids.indexOf(id) / columns)}
            >
              {id}
            </div>
          ))}
        </div>
      </WaveLeaderboardScrollAnchor>
    </div>
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: HTMLElement) {
      const index = Number(this.dataset["position"] ?? 0);
      const scroller = screen.queryByTestId("scroller");
      const top = this.hasAttribute("data-position")
        ? index * 100 - (scroller?.scrollTop ?? 0)
        : 0;
      return {
        top,
        bottom: top + (this.hasAttribute("data-position") ? 100 : 200),
        height: 200,
        left: 0,
        right: 400,
        width: 400,
        x: 0,
        y: top,
        toJSON: () => ({}),
      };
    });
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: jest.fn(function (this: HTMLElement, options: ScrollToOptions) {
      if (typeof options === "object")
        this.scrollTop = options.top ?? this.scrollTop;
    }),
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
});

it("preserves the visible artwork and pixel offset when rankings change", () => {
  const { rerender } = render(<Harness ids={["a", "b", "c", "d"]} />);
  screen.getByTestId("scroller").scrollTop = 210;
  rerender(<Harness ids={["d", "a", "b", "c"]} />);
  expect(screen.getByTestId("scroller").scrollTop).toBe(310);
});

it("reveals the artwork at its new rank when it moves outside the virtual range", () => {
  const { rerender } = render(
    <Harness ids={["a", "b", "c", "d", "e"]} mountedIds={["c", "d"]} />
  );
  screen.getByTestId("scroller").scrollTop = 210;
  rerender(<Harness ids={["a", "b", "d", "e", "c"]} mountedIds={["d", "e"]} />);
  expect(revealIndex).toHaveBeenCalledWith(4);
});

it("anchors a surviving visible neighbour when the first visible artwork is removed", () => {
  const { rerender } = render(
    <Harness ids={["a", "b", "c", "d"]} mountedIds={["c", "d"]} />
  );
  screen.getByTestId("scroller").scrollTop = 210;
  rerender(<Harness ids={["a", "b", "d"]} />);
  expect(screen.getByTestId("scroller").scrollTop).toBe(110);
});

it.each(["top", "new-sort"])(
  "does not restore an obsolete anchor for %s",
  (scenario) => {
    const { rerender } = render(<Harness ids={["a", "b", "c"]} />);
    screen.getByTestId("scroller").scrollTop = scenario === "top" ? 0 : 210;
    rerender(
      <Harness
        ids={["c", "a", "b"]}
        windowKey={scenario === "new-sort" ? "wave:newest" : "wave:rank"}
      />
    );
    expect(HTMLElement.prototype.scrollTo).not.toHaveBeenCalled();
  }
);

it("preserves the artwork across a column resize", () => {
  const { rerender } = render(<Harness ids={["a", "b", "c", "d"]} />);
  screen.getByTestId("scroller").scrollTop = 210;
  rerender(<Harness ids={["a", "b", "c", "d"]} columns={2} />);
  expect(screen.getByTestId("scroller").scrollTop).toBe(110);
});

it("stops pending restoration when the user starts another gesture", () => {
  const { rerender } = render(
    <Harness ids={["a", "b", "c", "d", "e"]} mountedIds={["c", "d"]} />
  );
  screen.getByTestId("scroller").scrollTop = 210;
  rerender(<Harness ids={["a", "b", "d", "e", "c"]} mountedIds={["d", "e"]} />);
  fireEvent.wheel(screen.getByText("d"));
  act(() => jest.advanceTimersByTime(100));
  expect(revealIndex).toHaveBeenCalledTimes(1);
});

it("does not correct scrolling when an update leaves card positions unchanged", () => {
  const { rerender } = render(<Harness ids={["a", "b", "c", "d"]} />);
  screen.getByTestId("scroller").scrollTop = 210;
  rerender(<Harness ids={["a", "b", "c", "d"]} />);
  act(() => jest.advanceTimersByTime(100));
  expect(HTMLElement.prototype.scrollTo).not.toHaveBeenCalled();
  expect(revealIndex).not.toHaveBeenCalled();
});

it("keeps scores live during touch and momentum scrolling, then applies the new order", () => {
  const { rerender } = render(
    <StableItems
      items={[
        { id: "a", score: 20 },
        { id: "b", score: 10 },
      ]}
    />
  );
  fireEvent.touchStart(screen.getByTestId("stable"));
  rerender(
    <StableItems
      items={[
        { id: "b", score: 30 },
        { id: "a", score: 20 },
      ]}
    />
  );
  act(() => jest.advanceTimersByTime(500));
  expect(screen.getByTestId("stable")).toHaveTextContent("a:20,b:30");
  fireEvent.touchEnd(screen.getByTestId("stable"));
  act(() => jest.advanceTimersByTime(100));
  fireEvent.scroll(screen.getByTestId("stable"));
  act(() => jest.advanceTimersByTime(100));
  expect(screen.getByTestId("stable")).toHaveTextContent("a:20,b:30");
  act(() => jest.advanceTimersByTime(100));
  expect(screen.getByTestId("stable")).toHaveTextContent("b:30,a:20");
});

it("keeps values live throughout continuous desktop scrolling and reconciles at scrollend", () => {
  const { rerender } = render(
    <StableItems
      items={[
        { id: "a", score: 20 },
        { id: "b", score: 10 },
      ]}
    />
  );
  const scroller = screen.getByTestId("stable");
  for (let score = 30; score < 42; score++) {
    fireEvent.scroll(scroller);
    rerender(
      <StableItems
        items={[
          { id: "b", score },
          { id: "a", score: 20 },
        ]}
      />
    );
    act(() => jest.advanceTimersByTime(100));
    expect(scroller).toHaveTextContent(`a:20,b:${score}`);
  }
  fireEvent(scroller, new Event("scrollend"));
  expect(scroller).toHaveTextContent("b:41,a:20");
});

it("does not let a scrollend event move artwork while a finger is still down", () => {
  const { rerender } = render(
    <StableItems
      items={[
        { id: "a", score: 20 },
        { id: "b", score: 10 },
      ]}
    />
  );
  const scroller = screen.getByTestId("stable");
  fireEvent.touchStart(scroller);
  rerender(
    <StableItems
      items={[
        { id: "b", score: 30 },
        { id: "a", score: 20 },
      ]}
    />
  );
  fireEvent(scroller, new Event("scrollend"));
  expect(scroller).toHaveTextContent("a:20,b:30");
  fireEvent.touchEnd(scroller);
  act(() => jest.advanceTimersByTime(180));
  expect(scroller).toHaveTextContent("b:30,a:20");
});
