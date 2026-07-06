import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { EditingDropProvider } from "@/contexts/EditingDropContext";
import WaveDrop from "@/components/waves/drops/WaveDrop";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useHasTouchInput from "@/hooks/useHasTouchInput";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import { DropLocation } from "@/components/waves/drops/drop.types";

const mockWaveDropActions = jest.fn();
const mockWaveDropContent = jest.fn();
const mockWaveDropHeader = jest.fn();
const mockMutate = jest.fn();
let mockEditMentionedGroups: ApiDropGroupMention[] = [];
jest.mock("@/components/waves/drops/WaveDropActions", () => (props: any) => {
  mockWaveDropActions(props);
  return <div data-testid="actions" />;
});
jest.mock("@/components/waves/drops/WaveDropReply", () => () => (
  <div data-testid="reply" />
));
jest.mock("@/components/waves/drops/WaveDropContent", () => {
  return function MockWaveDropContent(props: any) {
    mockWaveDropContent(props);
    return (
      <div>
        <button
          type="button"
          data-testid="content"
          onClick={() => {
            props.onDropContentClick?.(props.drop);
            props.onLinkCardActionsActiveChange?.("https://example.com", true);
          }}
        />
        <button
          type="button"
          data-testid="save-edit"
          onClick={() =>
            props.onSave?.("edited", [], mockEditMentionedGroups, [])
          }
        />
      </div>
    );
  };
});
jest.mock("@/components/waves/drops/WaveDropHeader", () => (props: any) => {
  mockWaveDropHeader(props);
  return <div data-testid="header" />;
});
jest.mock("@/components/waves/drops/WaveDropAuthorPfp", () => () => (
  <div data-testid="pfp" />
));
jest.mock("@/components/waves/drops/WaveDropMetadata", () => () => (
  <div data-testid="meta" />
));
jest.mock("@/components/waves/drops/WaveDropRatings", () => () => (
  <div data-testid="ratings" />
));
jest.mock("@/components/waves/drops/WaveDropReactions", () => () => (
  <div data-testid="reactions" />
));
let mobileMenuProps: any;
jest.mock("@/components/waves/drops/WaveDropMobileMenu", () => (props: any) => {
  mobileMenuProps = props;
  return <div data-testid="mobile" data-open={String(props.isOpen)} />;
});

jest.mock("@/hooks/isMobileDevice");
jest.mock("@/hooks/useHasTouchInput", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: () => "/",
  useSearchParams: () => ({ get: () => null, toString: () => "" }),
}));

jest.mock("@/hooks/drops/useDropUpdateMutation", () => ({
  useDropUpdateMutation: jest.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}));

const isMobileMock = useIsMobileDevice as jest.Mock;
const hasTouchInputMock = useHasTouchInput as jest.Mock;
const isTouchDeviceMock = useIsTouchDevice as jest.Mock;

const getLastMockProps = (mock: jest.Mock) => {
  const lastCall = mock.mock.calls.at(-1);
  return lastCall?.[0];
};

type MediaQueryChangeListener = () => void;

const HOVER_INPUT_MEDIA_QUERIES = new Set([
  "(any-hover: hover)",
  "(hover: hover)",
]);

const setHoverSupport = (initialHasHover: boolean) => {
  let hasHover = initialHasHover;
  const listeners = new Set<MediaQueryChangeListener>();

  Object.defineProperty(globalThis, "matchMedia", {
    writable: true,
    value: jest.fn((query: string) => ({
      get matches() {
        return hasHover && HOVER_INPUT_MEDIA_QUERIES.has(query);
      },
      media: query,
      onchange: null,
      addListener: jest.fn((listener: MediaQueryChangeListener) => {
        listeners.add(listener);
      }),
      removeListener: jest.fn((listener: MediaQueryChangeListener) => {
        listeners.delete(listener);
      }),
      addEventListener: jest.fn(
        (eventName: string, listener: MediaQueryChangeListener) => {
          if (eventName === "change") {
            listeners.add(listener);
          }
        }
      ),
      removeEventListener: jest.fn(
        (eventName: string, listener: MediaQueryChangeListener) => {
          if (eventName === "change") {
            listeners.delete(listener);
          }
        }
      ),
      dispatchEvent: jest.fn(),
    })),
  });

  return {
    setHasHover(nextHasHover: boolean) {
      hasHover = nextHasHover;
      listeners.forEach((listener) => listener());
    },
  };
};

/** Sets the jsdom viewport width and notifies resize subscribers. */
const setViewportWidth = (width: number) => {
  Object.defineProperty(globalThis.window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  globalThis.window.dispatchEvent(new Event("resize"));
};

const renderWithEditingDropProvider = (component: React.ReactElement) => {
  return render(<EditingDropProvider>{component}</EditingDropProvider>);
};

const drop: any = {
  id: "1",
  serial_no: 1,
  drop_type: "Chat",
  rank: null,
  wave: { id: "w1" },
  reply_to: null,
  author: { handle: "alice" },
  created_at: 0,
  updated_at: null,
  title: null,
  parts: [
    {
      part_id: 1,
      content: "c",
      media: [],
      quoted_drop: null,
      replies_count: 0,
      quotes_count: 0,
    },
  ],
  parts_count: 1,
  referenced_nfts: [],
  mentioned_users: [],
  mentioned_groups: [],
  metadata: [],
  rating: 0,
  realtime_rating: 0,
  rating_prediction: 0,
  top_raters: [],
  raters_count: 0,
  context_profile_context: null,
  subscribed_actions: [],
  is_signed: false,
  type: "FULL",
  stableKey: "",
  stableHash: "",
};

describe("WaveDrop", () => {
  beforeEach(() => {
    mockWaveDropActions.mockClear();
    mockWaveDropContent.mockClear();
    mockWaveDropHeader.mockClear();
    mockMutate.mockClear();
    mockEditMentionedGroups = [];
    mobileMenuProps = undefined;
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(false);
    isTouchDeviceMock.mockReturnValue(false);
    setHoverSupport(false);
    setViewportWidth(1440);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows actions on desktop", () => {
    setHoverSupport(true);

    const { getByTestId } = renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );
    expect(getByTestId("actions")).toBeInTheDocument();
  });

  it("keeps hybrid touchscreen laptops on desktop drop interactions", () => {
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(false);
    setHoverSupport(true);

    renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("actions")).toBeInTheDocument();
    expect(getLastMockProps(mockWaveDropHeader)).toEqual(
      expect.objectContaining({ showActionsButton: false })
    );
    expect(getLastMockProps(mockWaveDropContent)).toEqual(
      expect.objectContaining({ hasTouch: false })
    );
  });

  it("keeps touch sheet entry for touch-only detection on a wide viewport without hover", async () => {
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(true);
    setHoverSupport(false);
    setViewportWidth(1440);

    renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("actions")).not.toBeInTheDocument();
    expect(getLastMockProps(mockWaveDropHeader)).toEqual(
      expect.objectContaining({ showActionsButton: true })
    );
    expect(getLastMockProps(mockWaveDropContent)).toEqual(
      expect.objectContaining({ hasTouch: true })
    );

    act(() => {
      getLastMockProps(mockWaveDropHeader).onOpenActions({
        stopPropagation: jest.fn(),
      });
    });

    await waitFor(() => expect(mobileMenuProps?.isOpen).toBe(true));
  });

  it("keeps hybrid touchscreen laptops on desktop interactions even in compact layouts", () => {
    // Regression: a Windows touch laptop in a snapped/narrow window must NOT
    // switch to the touch sheet — it still has hover input.
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(false);
    setHoverSupport(true);
    setViewportWidth(800);

    renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("actions")).toBeInTheDocument();
    expect(getLastMockProps(mockWaveDropHeader)).toEqual(
      expect.objectContaining({ showActionsButton: false })
    );
    expect(getLastMockProps(mockWaveDropContent)).toEqual(
      expect.objectContaining({ hasTouch: false })
    );
  });

  it("clears an open touch sheet when hover input appears at desktop width", async () => {
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(true);
    setHoverSupport(false);
    setViewportWidth(800);

    renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    act(() => {
      getLastMockProps(mockWaveDropHeader).onOpenActions({
        stopPropagation: jest.fn(),
      });
    });

    await waitFor(() => expect(mobileMenuProps?.isOpen).toBe(true));

    act(() => {
      // e.g. iPad gaining a trackpad: hover appears and the viewport widens.
      setHoverSupport(true);
      setViewportWidth(1440);
    });

    await waitFor(() => expect(mobileMenuProps?.isOpen).toBe(false));

    act(() => {
      setViewportWidth(800);
    });

    expect(mobileMenuProps.isOpen).toBe(false);
  });

  it("keeps mobile drop interactions for true mobile devices", () => {
    isMobileMock.mockReturnValue(true);
    hasTouchInputMock.mockReturnValue(false);
    isTouchDeviceMock.mockReturnValue(false);
    setViewportWidth(390);

    renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("actions")).not.toBeInTheDocument();
    expect(getLastMockProps(mockWaveDropHeader)).toEqual(
      expect.objectContaining({ showActionsButton: true })
    );
  });

  it("keeps touch entry for touch-only compact layouts", () => {
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(true);
    setHoverSupport(false);
    setViewportWidth(800);

    renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("actions")).not.toBeInTheDocument();
    expect(getLastMockProps(mockWaveDropHeader)).toEqual(
      expect.objectContaining({ showActionsButton: true })
    );
    expect(getLastMockProps(mockWaveDropContent)).toEqual(
      expect.objectContaining({ hasTouch: true })
    );
  });

  it("keeps touch entry for touch devices with fine pointer and no hover", () => {
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(false);
    setHoverSupport(false);
    setViewportWidth(800);

    renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("actions")).not.toBeInTheDocument();
    expect(getLastMockProps(mockWaveDropHeader)).toEqual(
      expect.objectContaining({ showActionsButton: true })
    );
    expect(getLastMockProps(mockWaveDropContent)).toEqual(
      expect.objectContaining({ hasTouch: true })
    );
  });

  it("suppresses the synthetic click after an extended touch long press opens the sheet", () => {
    jest.useFakeTimers();
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(true);
    setHoverSupport(false);
    setViewportWidth(800);
    const onDropContentClick = jest.fn();

    renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
        onDropContentClick={onDropContentClick}
      />
    );

    fireEvent.touchStart(screen.getByTestId("content"), {
      touches: [{ clientX: 0, clientY: 0 }],
    });
    act(() => {
      jest.advanceTimersByTime(1300);
    });
    fireEvent.touchEnd(screen.getByTestId("content"));
    fireEvent.click(screen.getByTestId("content"));

    expect(mobileMenuProps.isOpen).toBe(true);
    expect(onDropContentClick).not.toHaveBeenCalled();
  });

  it("keeps normal short clicks on touch layouts", () => {
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(true);
    setHoverSupport(false);
    setViewportWidth(800);
    const onDropContentClick = jest.fn();

    renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
        onDropContentClick={onDropContentClick}
      />
    );

    fireEvent.touchStart(screen.getByTestId("content"), {
      touches: [{ clientX: 0, clientY: 0 }],
    });
    fireEvent.touchEnd(screen.getByTestId("content"));
    fireEvent.click(screen.getByTestId("content"));

    expect(onDropContentClick).toHaveBeenCalledTimes(1);
    expect(onDropContentClick).toHaveBeenCalledWith(drop);
  });

  it("renders one swipe timestamp affordance for grouped messages without an author row", () => {
    const previousGroupedDrop = {
      ...drop,
      id: "previous-grouped",
      created_at: 1_700_000_000_000,
      stableHash: "previous-grouped",
    };
    const groupedDrop = {
      ...drop,
      id: "current-grouped",
      created_at: 1_700_000_040_000,
      stableHash: "current-grouped",
    };

    renderWithEditingDropProvider(
      <WaveDrop
        drop={groupedDrop}
        previousDrop={previousGroupedDrop}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={DropLocation.WAVE}
        dropViewDropId={null}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("header")).not.toBeInTheDocument();
    // Desktop (no touch sheet): the timestamp reveals on hover, never via the
    // pointer swipe that would hijack drag-to-select.
    expect(
      screen.queryByTestId("grouped-drop-swipe-timestamp")
    ).not.toBeInTheDocument();
    const timestamp = screen.getByTestId("grouped-drop-hover-timestamp");
    expect(timestamp).toBeInTheDocument();
    expect(timestamp).toHaveClass("tw-w-[9.25rem]");
    expect(timestamp).toHaveClass("desktop-hover:group-hover:tw-opacity-100");
    expect(timestamp.querySelector("p")).toHaveClass("tw-whitespace-nowrap");
  });

  it("does not hijack mouse drags for the timestamp swipe on desktop", () => {
    const previousGroupedDrop = {
      ...drop,
      id: "previous-grouped",
      created_at: 1_700_000_000_000,
      stableHash: "previous-grouped",
    };
    const groupedDrop = {
      ...drop,
      id: "current-grouped",
      created_at: 1_700_000_040_000,
      stableHash: "current-grouped",
    };

    renderWithEditingDropProvider(
      <WaveDrop
        drop={groupedDrop}
        previousDrop={previousGroupedDrop}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={DropLocation.WAVE}
        dropViewDropId={null}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    const swipeable = screen.getByTestId("grouped-drop-swipeable-content");
    const dropRoot = swipeable.parentElement!;

    // A leftward mouse drag (the shape of a text-selection gesture).
    fireEvent.pointerDown(dropRoot, {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      clientX: 220,
      clientY: 40,
    });
    fireEvent.pointerMove(dropRoot, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 48,
      clientY: 44,
    });

    expect(swipeable.style.transform).toBe("");
    fireEvent.pointerUp(dropRoot, { pointerId: 1, pointerType: "mouse" });
  });

  it("reveals a grouped message timestamp on left swipe without opening long press actions", () => {
    jest.useFakeTimers();
    isMobileMock.mockReturnValue(true);
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(true);
    setHoverSupport(false);
    setViewportWidth(390);
    const onDropContentClick = jest.fn();
    const previousGroupedDrop = {
      ...drop,
      id: "previous-grouped",
      created_at: 1_700_000_000_000,
      stableHash: "previous-grouped",
    };
    const groupedDrop = {
      ...drop,
      id: "current-grouped",
      created_at: 1_700_000_040_000,
      stableHash: "current-grouped",
    };

    renderWithEditingDropProvider(
      <WaveDrop
        drop={groupedDrop}
        previousDrop={previousGroupedDrop}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={DropLocation.WAVE}
        dropViewDropId={null}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
        onDropContentClick={onDropContentClick}
      />
    );

    expect(getLastMockProps(mockWaveDropContent)).toEqual(
      expect.objectContaining({ hasTouch: true })
    );

    const content = screen.getByTestId("content");
    const dropRoot = screen.getByTestId(
      "grouped-drop-swipeable-content"
    ).parentElement!;
    act(() => {
      fireEvent.touchStart(dropRoot, {
        changedTouches: [{ clientX: 220, clientY: 40 }],
        targetTouches: [{ clientX: 220, clientY: 40 }],
        touches: [{ clientX: 220, clientY: 40 }],
      });
      fireEvent.touchMove(dropRoot, {
        changedTouches: [{ clientX: 48, clientY: 44 }],
        targetTouches: [{ clientX: 48, clientY: 44 }],
        touches: [{ clientX: 48, clientY: 44 }],
      });
    });

    expect(
      screen.getByTestId("grouped-drop-swipeable-content").style.transform
    ).toBe("translateX(-148px)");
    expect(
      screen.getByTestId("grouped-drop-swipe-timestamp").style.opacity
    ).toBe("1");

    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(mobileMenuProps).toBeUndefined();

    fireEvent.touchEnd(dropRoot);
    fireEvent.click(content);

    expect(onDropContentClick).not.toHaveBeenCalled();
  });

  it("hides actions on mobile", () => {
    isMobileMock.mockReturnValue(true);
    const { queryByTestId } = renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );
    expect(queryByTestId("actions")).not.toBeInTheDocument();
  });

  it("suppresses row actions while link card actions are active", () => {
    isMobileMock.mockReturnValue(false);
    setHoverSupport(true);

    renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("content"));

    expect(getLastMockProps(mockWaveDropActions)).toEqual(
      expect.objectContaining({ suppressed: true })
    );
  });

  it("reveals desktop actions from mouse pointer events without CSS :hover", () => {
    // Capability-lying browsers never activate :hover although mouse pointer
    // events flow — the row's pointerenter must force the action bar visible.
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(false);
    setHoverSupport(true);
    setViewportWidth(1440);

    renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={DropLocation.WAVE}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(getLastMockProps(mockWaveDropActions)).toEqual(
      expect.objectContaining({ forceVisible: false })
    );

    const dropRoot = screen.getByTestId("content").closest(
      "[data-wave-drop-id]"
    )!;
    // React synthesizes onPointerEnter/Leave from pointerover/pointerout.
    fireEvent.pointerOver(dropRoot, { pointerType: "mouse" });
    expect(getLastMockProps(mockWaveDropActions)).toEqual(
      expect.objectContaining({ forceVisible: true })
    );

    fireEvent.pointerOut(dropRoot, {
      pointerType: "mouse",
      relatedTarget: document.body,
    });
    expect(getLastMockProps(mockWaveDropActions)).toEqual(
      expect.objectContaining({ forceVisible: false })
    );

    // Touch enter must not force the desktop reveal. jsdom drops pointerType
    // from event init, so define it explicitly on a hand-built event.
    const touchOver = new Event("pointerover", { bubbles: true });
    Object.defineProperty(touchOver, "pointerType", { value: "touch" });
    dropRoot.dispatchEvent(touchOver);
    expect(getLastMockProps(mockWaveDropActions)).toEqual(
      expect.objectContaining({ forceVisible: false })
    );
  });

  it("omits group mention metadata from edit update requests", () => {
    isMobileMock.mockReturnValue(false);
    mockEditMentionedGroups = [ApiDropGroupMention.All];
    const stormDrop = {
      ...drop,
      mentioned_groups: [ApiDropGroupMention.All],
      parts: [
        { ...drop.parts[0], content: "edited part" },
        { ...drop.parts[0], part_id: 2, content: "hello @all" },
      ],
    };

    renderWithEditingDropProvider(
      <WaveDrop
        drop={stormDrop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("save-edit"));

    const request = mockMutate.mock.calls[0][0].request;
    expect(request).not.toHaveProperty("mentioned_groups");
  });

  it("passes embed guard props to content", () => {
    isMobileMock.mockReturnValue(false);
    const guardProps = {
      embedPath: ["parent-drop"],
      quotePath: ["w1:1"],
      embedDepth: 2,
      maxEmbedDepth: 4,
    };

    renderWithEditingDropProvider(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
        {...guardProps}
      />
    );

    expect(mockWaveDropContent).toHaveBeenLastCalledWith(
      expect.objectContaining(guardProps)
    );
  });
});
