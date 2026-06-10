import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import WaveDrop from "@/components/waves/drops/WaveDrop";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useHasTouchInput from "@/hooks/useHasTouchInput";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { editSlice } from "@/store/editSlice";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

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
          onClick={() =>
            props.onLinkCardActionsActiveChange?.("https://example.com", true)
          }
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
jest.mock("@/components/waves/drops/WaveDropMobileMenu", () => () => (
  <div data-testid="mobile" />
));

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

// Create a test store
const createTestStore = () =>
  configureStore({
    reducer: {
      edit: editSlice.reducer,
    },
  });

const renderWithRedux = (component: React.ReactElement) => {
  const store = createTestStore();
  return render(<Provider store={store}>{component}</Provider>);
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
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(false);
    isTouchDeviceMock.mockReturnValue(false);
    setHoverSupport(false);
  });

  it("shows actions on desktop", () => {
    const { getByTestId } = renderWithRedux(
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

    renderWithRedux(
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

  it("enables touch entry when hover support is removed while open", () => {
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(false);
    const hoverSupport = setHoverSupport(true);

    renderWithRedux(
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

    expect(getLastMockProps(mockWaveDropHeader)).toEqual(
      expect.objectContaining({ showActionsButton: false })
    );

    act(() => {
      hoverSupport.setHasHover(false);
    });

    expect(getLastMockProps(mockWaveDropHeader)).toEqual(
      expect.objectContaining({ showActionsButton: true })
    );
  });

  it("keeps mobile drop interactions for true mobile devices", () => {
    isMobileMock.mockReturnValue(true);
    hasTouchInputMock.mockReturnValue(false);
    isTouchDeviceMock.mockReturnValue(false);

    renderWithRedux(
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

  it("keeps desktop actions with touch entry for touch-only non-mobile devices", () => {
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(true);
    setHoverSupport(false);

    renderWithRedux(
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
      expect.objectContaining({ showActionsButton: true })
    );
  });

  it("keeps touch entry for touch devices with fine pointer and no hover", () => {
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(false);
    setHoverSupport(false);

    renderWithRedux(
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
      expect.objectContaining({ showActionsButton: true })
    );
  });

  it("hides actions on mobile", () => {
    isMobileMock.mockReturnValue(true);
    const { queryByTestId } = renderWithRedux(
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
    renderWithRedux(
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

    renderWithRedux(
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

    renderWithRedux(
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
