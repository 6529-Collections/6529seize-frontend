import { WaveChatVirtualList } from "@/components/waves/drops/chat-window/WaveChatVirtualList";
import type { ChatListHandle } from "@/components/waves/drops/chat-window/chatScrollBehavior";
import { isWaveDropNearViewport } from "@/contexts/wave/drop-visibility";
import { DropSize, type Drop } from "@/helpers/waves/drop.helpers";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRef, type ComponentProps } from "react";

jest.mock("@/components/content-moderation/ContentModerationDropGate", () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

jest.mock("@/components/waves/drops/Drop", () => ({
  __esModule: true,
  default: ({ drop }: any) => (
    <div>
      <button type="button">Reply to {drop.serial_no}</button>
      Post {drop.serial_no}
    </div>
  ),
  DropLocation: { MY_STREAM: "MY_STREAM", WAVE: "WAVE", PROFILE: "PROFILE" },
}));

jest.mock("@/components/waves/drops/LightDrop", () => ({
  __esModule: true,
  default: ({ drop }: any) => <div>Loading post {drop.serial_no}</div>,
}));

jest.mock("@/components/drops/view/UnreadDivider", () => ({
  __esModule: true,
  default: () => <div>New Messages</div>,
}));

jest.mock("@/components/waves/drops/WaveHistoryGap", () => ({
  WaveHistoryGap: ({ gap, onAnnounce }: any) => (
    <button type="button" onClick={() => onAnnounce("Missed messages loaded")}>
      Load missed messages before {gap.olderThan}
    </button>
  ),
}));

const mockFetchAroundSerialNo = jest.fn();
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamActions: () => ({ fetchAroundSerialNo: mockFetchAroundSerialNo }),
}));

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const VIEWPORT_PX = 600;
const ROW_PX = 60;

// jsdom has no layout: give the scroller a viewport and every row a height.
const layout = {
  clientHeight: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "clientHeight"
  ),
  offsetHeight: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetHeight"
  ),
};

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute("data-wave-drops-scroll-container")
        ? VIEWPORT_PX
        : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute("data-chat-item-key") ? ROW_PX : 0;
    },
  });
});

afterAll(() => {
  for (const [name, descriptor] of Object.entries(layout)) {
    if (descriptor) {
      Object.defineProperty(HTMLElement.prototype, name, descriptor);
    }
  }
});

const makeDrop = (serial: number, type = DropSize.FULL): Drop =>
  (type === DropSize.FULL
    ? {
        id: `drop-${serial}`,
        serial_no: serial,
        stableKey: `key-${serial}`,
        stableHash: `hash-${serial}`,
        type,
        wave: { id: "wave-1" },
        author: { handle: "someone" },
        created_at: serial * 1000,
        parts: [{ part_id: 1, content: `Post ${serial}`, media: [] }],
      }
    : {
        id: `drop-${serial}`,
        serial_no: serial,
        stableKey: `key-${serial}`,
        stableHash: `hash-${serial}`,
        type,
        waveId: "wave-1",
      }) as unknown as Drop;

/** Newest first, as the wave store keeps them. */
const makeDrops = (count: number, newest = count) =>
  Array.from({ length: count }, (_, index) => makeDrop(newest - index));

type ListProps = ComponentProps<typeof WaveChatVirtualList>;

const renderList = (overrides: Partial<ListProps> = {}) => {
  const endScrollerRef = createRef<ChatListHandle>();
  const props: ListProps = {
    drops: makeDrops(2000),
    waveId: "wave-1",
    scrollContainerRef: { current: null },
    bottomAnchorRef: { current: null },
    ref: endScrollerRef,
    isFetchingOlder: false,
    showOlderLoader: false,
    onTopIntersection: jest.fn(),
    onReply: jest.fn(),
    onReplyClick: jest.fn(),
    onQuoteClick: jest.fn(),
    activeDrop: null,
    serialNo: null,
    targetDropRef: { current: null },
    dropViewDropId: null,
    boostedDropsDisplayPreference: "expanded",
    suspendLightDropHydration: false,
    isVotingClosed: false,
    isVotingControlsLocked: false,
    ...overrides,
  };
  const view = render(<WaveChatVirtualList {...props} />);
  return { ...view, props, endScrollerRef };
};

const mountedSerials = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("[data-drop-serial-no]")).map((row) =>
    Number(row.getAttribute("data-drop-serial-no"))
  );

describe("WaveChatVirtualList", () => {
  beforeEach(() => {
    mockFetchAroundSerialNo.mockClear();
  });

  it("mounts only the rows near the newest message out of 2,000", async () => {
    const { container } = renderList();

    await waitFor(() => expect(mountedSerials(container)).toContain(2000));
    const serials = mountedSerials(container);
    expect(serials.length).toBeLessThanOrEqual(60);
    expect(serials).not.toContain(1);
    // Rows render in list order, oldest first, so DOM order is reading order.
    expect(serials).toEqual([...serials].sort((left, right) => left - right));
  });

  it("is a labelled, focusable region in normal order", () => {
    renderList({ drops: makeDrops(5) });

    const region = screen.getByRole("region", { name: "Messages" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveAttribute(
      "data-wave-drops-scroll-container",
      "end-anchored"
    );
    expect(region.className).toContain("tw-overflow-y-auto");
    expect(region.className).not.toContain("tw-flex-col-reverse");
  });

  it("keeps the jump target, the unread divider and history gaps mounted", async () => {
    const { container } = renderList({
      serialNo: 5,
      unreadDividerSerialNo: 40,
      historyGaps: [{ newerThan: 100, olderThan: 120 }],
    });

    await waitFor(() => expect(mountedSerials(container)).toContain(2000));
    expect(mountedSerials(container)).toEqual(expect.arrayContaining([5, 40]));
    expect(screen.getByText("New Messages")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Load missed messages before 120" })
    ).toBeInTheDocument();
    expect(mountedSerials(container)).not.toContain(6);
  });

  it("keeps the focused row mounted after the window moves", async () => {
    const { container, rerender, props } = renderList({
      drops: makeDrops(200),
    });

    await waitFor(() => expect(mountedSerials(container)).toContain(200));
    const reply = screen.getByRole("button", { name: "Reply to 200" });
    act(() => {
      reply.focus();
    });
    expect(reply).toHaveFocus();

    // 300 newer messages push row 200 far from the newest.
    rerender(<WaveChatVirtualList {...props} drops={makeDrops(500)} />);

    await waitFor(() => expect(mountedSerials(container)).toContain(500));
    expect(mountedSerials(container)).toContain(200);
    expect(reply).toHaveFocus();
  });

  it("announces new messages together in one polite region", async () => {
    const { rerender, props } = renderList({ drops: makeDrops(20) });
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("");

    rerender(<WaveChatVirtualList {...props} drops={makeDrops(21)} />);
    rerender(<WaveChatVirtualList {...props} drops={makeDrops(23)} />);

    await waitFor(() => expect(status).toHaveTextContent("3 new messages"), {
      timeout: 3000,
    });
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("does not announce the reader's own pending send or older history", async () => {
    const { rerender, props } = renderList({ drops: makeDrops(20, 40) });
    const status = screen.getByRole("status");

    const pending = {
      ...makeDrop(41),
      id: "temp-1",
      stableKey: "temp-1",
    } as Drop;
    rerender(
      <WaveChatVirtualList {...props} drops={[pending, ...makeDrops(30, 40)]} />
    );

    await new Promise((resolve) => setTimeout(resolve, 1800));
    expect(status).toHaveTextContent("");
  });

  it("announces history gap progress in the same region", () => {
    renderList({
      drops: makeDrops(30),
      historyGaps: [{ newerThan: 10, olderThan: 20 }],
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Load missed messages before 20" })
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Missed messages loaded"
    );
  });

  it("asks for the full drop of a mounted light row and marks rows near the viewport", async () => {
    const drops = makeDrops(10);
    drops[0] = makeDrop(10, DropSize.LIGHT);
    const { container, unmount } = renderList({ drops });

    await waitFor(() => expect(mountedSerials(container)).toContain(10));
    expect(mockFetchAroundSerialNo).toHaveBeenCalledWith("wave-1", 10);
    expect(isWaveDropNearViewport("wave-1", "drop-9")).toBe(true);

    unmount();
    expect(isWaveDropNearViewport("wave-1", "drop-9")).toBe(false);
  });

  it("holds light rows while a jump is scrolling", async () => {
    const drops = makeDrops(10);
    drops[0] = makeDrop(10, DropSize.LIGHT);
    const { container } = renderList({
      drops,
      suspendLightDropHydration: true,
    });

    await waitFor(() => expect(mountedSerials(container)).toContain(10));
    expect(mockFetchAroundSerialNo).not.toHaveBeenCalled();
  });

  it("loads older history when the rendered range reaches the top", async () => {
    const onTopIntersection = jest.fn();
    renderList({ drops: makeDrops(8), onTopIntersection });

    await waitFor(() => expect(onTopIntersection).toHaveBeenCalled());
  });

  it("shows the history loader outside the rows", () => {
    const { container } = renderList({
      drops: makeDrops(8),
      isFetchingOlder: true,
      showOlderLoader: true,
    });

    const loader = container.querySelector(".tw-animate-loading-bar");
    expect(loader).not.toBeNull();
    expect(loader?.closest("[data-chat-item-key]")).toBeNull();
  });

  it("registers a scroller for the newest message", () => {
    const { endScrollerRef, unmount } = renderList({ drops: makeDrops(8) });

    expect(endScrollerRef.current?.scrollToEnd).toEqual(expect.any(Function));
    unmount();
    expect(endScrollerRef.current).toBeNull();
  });
});
