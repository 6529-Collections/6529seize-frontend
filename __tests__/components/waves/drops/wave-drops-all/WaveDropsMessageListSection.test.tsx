import { WaveDropsMessageListSection } from "@/components/waves/drops/wave-drops-all/subcomponents/WaveDropsMessageListSection";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { DEFAULT_BOOSTED_DROPS_DISPLAY_PREFERENCE } from "@/types/boosted-drops.types";

let mockWindowing = false;
jest.mock("@/components/waves/drops/chat-window/chatWindowingFlag", () => ({
  isChatWindowingEnabled: () => mockWindowing,
}));

let virtualListProps: any = null;
jest.mock("@/components/waves/drops/chat-window/WaveChatVirtualList", () => ({
  WaveChatVirtualList: (props: any) => {
    virtualListProps = props;
    return <div data-testid="virtual-list" />;
  },
}));

jest.mock("@/components/waves/drops/WaveDropsReverseContainer", () => ({
  WaveDropsReverseContainer: ({ children }: any) => (
    <div data-testid="reverse-container">{children}</div>
  ),
}));

jest.mock("@/components/drops/view/DropsList", () => ({
  __esModule: true,
  default: () => <div data-testid="drops-list" />,
}));

jest.mock(
  "@/components/drops/view/item/content/media/ChatVideoPlayback",
  () => ({ ChatVideoPlaybackProvider: ({ children }: any) => children })
);

jest.mock("@/components/waves/drops/WaveDropsScrollControls", () => ({
  WaveDropsScrollControls: () => <div data-testid="scroll-controls" />,
}));

type SectionProps = ComponentProps<typeof WaveDropsMessageListSection>;

const drops = [{ serial_no: 2 }, { serial_no: 1 }];

const props = (): SectionProps =>
  ({
    waveMessages: {
      id: "wave-1",
      drops,
      historyGaps: [{ newerThan: 1, olderThan: 2 }],
      hasNextPage: true,
      isLoadingNextPage: true,
    },
    dropId: null,
    scrollContainerRef: { current: null },
    bottomAnchorRef: { current: null },
    chatEndScrollerRef: { current: null },
    paginationThreshold: 2,
    onTopIntersection: jest.fn(),
    onReply: jest.fn(),
    queueSerialTarget: jest.fn(),
    activeDrop: null,
    serialTarget: 7,
    targetDropRef: { current: null },
    onQuoteClick: jest.fn(),
    isAtBottom: true,
    scrollToBottom: jest.fn(),
    pendingCount: 0,
    onRevealPending: jest.fn(),
    unreadDividerSerialNo: 2,
    onScrollToUnread: jest.fn(),
    onDismissUnread: jest.fn(),
    suspendLightDropHydration: true,
  }) as unknown as SectionProps;

describe("WaveDropsMessageListSection", () => {
  beforeEach(() => {
    virtualListProps = null;
  });

  it("renders the reversed, fully mounted chat with windowing off", () => {
    mockWindowing = false;
    render(<WaveDropsMessageListSection {...props()} />);

    expect(screen.getByTestId("reverse-container")).toBeInTheDocument();
    expect(screen.getByTestId("drops-list")).toBeInTheDocument();
    expect(screen.queryByTestId("virtual-list")).toBeNull();
    expect(screen.getByTestId("scroll-controls")).toBeInTheDocument();
  });

  it("renders the windowed chat with windowing on", () => {
    mockWindowing = true;
    const sectionProps = props();
    render(<WaveDropsMessageListSection {...sectionProps} />);

    expect(screen.queryByTestId("reverse-container")).toBeNull();
    expect(screen.getByTestId("virtual-list")).toBeInTheDocument();
    expect(screen.getByTestId("scroll-controls")).toBeInTheDocument();
    expect(virtualListProps).toMatchObject({
      drops,
      waveId: "wave-1",
      historyGaps: [{ newerThan: 1, olderThan: 2 }],
      endScrollerRef: sectionProps.chatEndScrollerRef,
      isFetchingOlder: true,
      showOlderLoader: true,
      serialNo: 7,
      unreadDividerSerialNo: 2,
      suspendLightDropHydration: true,
      boostedDropsDisplayPreference: DEFAULT_BOOSTED_DROPS_DISPLAY_PREFERENCE,
    });
  });
});
