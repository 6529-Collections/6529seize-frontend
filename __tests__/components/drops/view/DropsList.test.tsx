import DropsList from "@/components/drops/view/DropsList";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { fireEvent, render, screen } from "@testing-library/react";

let dropProps: any[] = [];
let lightProps: any[] = [];
let wrapperProps: any[] = [];
let highlightProps: any[] = [];
let boostedCardProps: any[] = [];
let compactBoostedCardProps: any[] = [];

jest.mock("@/components/waves/drops/Drop", () => {
  const MockedDrop = (props: any) => {
    dropProps.push(props);
    return <div data-testid="drop" />;
  };
  return {
    __esModule: true,
    default: MockedDrop,
    DropLocation: {
      MY_STREAM: "MY_STREAM",
      WAVE: "WAVE",
    },
  };
});

jest.mock("@/components/waves/drops/LightDrop", () => ({
  __esModule: true,
  default: (props: any) => {
    lightProps.push(props);
    return <div data-testid="light" />;
  },
}));

jest.mock("@/components/waves/drops/VirtualScrollWrapper", () => ({
  __esModule: true,
  default: (props: any) => {
    wrapperProps.push(props);
    return <div data-testid="wrapper">{props.children}</div>;
  },
}));

jest.mock("@/components/drops/view/HighlightDropWrapper", () => ({
  __esModule: true,
  default: (props: any) => {
    highlightProps.push(props);
    return <div data-testid="highlight">{props.children}</div>;
  },
}));

jest.mock("@/components/drops/view/UnreadDivider", () => ({
  __esModule: true,
  default: () => <div data-testid="unread-divider" />,
}));

jest.mock("@/components/home/boosted/BoostedDropCardHome", () => ({
  __esModule: true,
  default: (props: any) => {
    boostedCardProps.push(props);
    return (
      <button data-testid="boosted-card" onClick={props.onClick} type="button">
        boosted-{props.rank}-{props.variant}
      </button>
    );
  },
}));

jest.mock("@/components/home/boosted/BoostedDropCompactChatItem", () => ({
  __esModule: true,
  default: (props: any) => {
    compactBoostedCardProps.push(props);
    return (
      <button
        data-testid="compact-boosted-card"
        onClick={props.onClick}
        type="button"
      >
        compact-boosted-{props.drop.serial_no}
      </button>
    );
  },
}));

describe("DropsList", () => {
  beforeEach(() => {
    dropProps = [];
    lightProps = [];
    wrapperProps = [];
    highlightProps = [];
    boostedCardProps = [];
    compactBoostedCardProps = [];
  });

  it("renders full and light drops correctly", () => {
    const drops: any = [
      { stableKey: "a", serial_no: 1, type: DropSize.FULL, wave: { id: "w" } },
      { stableKey: "b", serial_no: 2, type: DropSize.LIGHT, waveId: "w" },
    ];

    render(
      <DropsList
        scrollContainerRef={{ current: null }}
        drops={drops}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        serialNo={null}
        targetDropRef={null}
        parentContainerRef={undefined}
        onQuoteClick={jest.fn()}
        onDropContentClick={jest.fn()}
        dropViewDropId={null}
      />
    );

    expect(screen.getAllByTestId("wrapper")).toHaveLength(2);
    expect(screen.getAllByTestId("highlight")).toHaveLength(2);
    expect(dropProps).toHaveLength(1);
    expect(lightProps).toHaveLength(1);
  });

  it("allows historical light drops to hydrate after serial scrolling settles", () => {
    const props = {
      scrollContainerRef: { current: null },
      drops: [
        {
          stableKey: "historical-light",
          serial_no: 2,
          type: DropSize.LIGHT,
          waveId: "w",
        },
      ] as any,
      showWaveInfo: false,
      activeDrop: null,
      showReplyAndQuote: false,
      onReply: jest.fn(),
      onReplyClick: jest.fn(),
      serialNo: null,
      targetDropRef: null,
      parentContainerRef: undefined,
      onQuoteClick: jest.fn(),
      onDropContentClick: jest.fn(),
      dropViewDropId: null,
      suspendLightDropHydration: false,
      // Regression input: this marker previously kept the light row suspended forever.
      autoCollapseSerials: new Set([2]),
    };

    render(<DropsList {...props} />);

    expect(wrapperProps).toHaveLength(1);
    expect(wrapperProps[0].suspendLightDropHydration).toBe(false);
  });

  it("passes approve wave state to full drops", () => {
    const drops: any = [
      { stableKey: "a", serial_no: 1, type: DropSize.FULL, wave: { id: "w" } },
    ];

    render(
      <DropsList
        scrollContainerRef={{ current: null }}
        drops={drops}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        serialNo={null}
        targetDropRef={null}
        parentContainerRef={undefined}
        onQuoteClick={jest.fn()}
        onDropContentClick={jest.fn()}
        dropViewDropId={null}
        winningThreshold={42}
        winningThresholdMinDurationMs={120_000}
        isVotingClosed={true}
        isVotingControlsLocked={true}
      />
    );

    expect(dropProps).toHaveLength(1);
    expect(dropProps[0].winningThreshold).toBe(42);
    expect(dropProps[0].winningThresholdMinDurationMs).toBe(120_000);
    expect(dropProps[0].isVotingClosed).toBe(true);
    expect(dropProps[0].isVotingControlsLocked).toBe(true);
  });

  it("renders unread divider when unreadDividerSerialNo matches a drop", () => {
    const drops: any = [
      { stableKey: "a", serial_no: 1, type: DropSize.FULL, wave: { id: "w" } },
      { stableKey: "b", serial_no: 2, type: DropSize.FULL, wave: { id: "w" } },
      { stableKey: "c", serial_no: 3, type: DropSize.FULL, wave: { id: "w" } },
    ];

    render(
      <DropsList
        scrollContainerRef={{ current: null }}
        drops={drops}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        serialNo={null}
        targetDropRef={null}
        parentContainerRef={undefined}
        onQuoteClick={jest.fn()}
        onDropContentClick={jest.fn()}
        dropViewDropId={null}
        unreadDividerSerialNo={2}
      />
    );

    expect(screen.getByTestId("unread-divider")).toBeInTheDocument();
  });

  it("does not render unread divider when unreadDividerSerialNo is null", () => {
    const drops: any = [
      { stableKey: "a", serial_no: 1, type: DropSize.FULL, wave: { id: "w" } },
      { stableKey: "b", serial_no: 2, type: DropSize.FULL, wave: { id: "w" } },
    ];

    render(
      <DropsList
        scrollContainerRef={{ current: null }}
        drops={drops}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        serialNo={null}
        targetDropRef={null}
        parentContainerRef={undefined}
        onQuoteClick={jest.fn()}
        onDropContentClick={jest.fn()}
        dropViewDropId={null}
        unreadDividerSerialNo={null}
      />
    );

    expect(screen.queryByTestId("unread-divider")).not.toBeInTheDocument();
  });

  it("does not render unread divider when unreadDividerSerialNo does not match any drop", () => {
    const drops: any = [
      { stableKey: "a", serial_no: 1, type: DropSize.FULL, wave: { id: "w" } },
      { stableKey: "b", serial_no: 2, type: DropSize.FULL, wave: { id: "w" } },
    ];

    render(
      <DropsList
        scrollContainerRef={{ current: null }}
        drops={drops}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        serialNo={null}
        targetDropRef={null}
        parentContainerRef={undefined}
        onQuoteClick={jest.fn()}
        onDropContentClick={jest.fn()}
        dropViewDropId={null}
        unreadDividerSerialNo={999}
      />
    );

    expect(screen.queryByTestId("unread-divider")).not.toBeInTheDocument();
  });

  it("renders compact boosted cards inline by default", () => {
    const drops: any = Array.from({ length: 6 }, (_, index) => ({
      stableKey: `drop-${index + 1}`,
      serial_no: index + 1,
      type: DropSize.FULL,
      wave: { id: "w" },
    }));
    const boostedDrop = {
      id: "boost-1",
      serial_no: 999,
      author: { handle: "boosted" },
      wave: { id: "w", name: "Wave" },
      parts: [],
      boosts: 3,
    };

    render(
      <DropsList
        scrollContainerRef={{ current: null }}
        drops={drops}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        serialNo={null}
        targetDropRef={null}
        parentContainerRef={undefined}
        onQuoteClick={jest.fn()}
        onDropContentClick={jest.fn()}
        dropViewDropId={null}
        boostedDrops={[boostedDrop] as any}
        onBoostedDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("compact-boosted-card")).toBeInTheDocument();
    expect(screen.queryByTestId("boosted-card")).not.toBeInTheDocument();
    expect(compactBoostedCardProps).toHaveLength(1);
    expect(compactBoostedCardProps[0]).toMatchObject({
      drop: boostedDrop,
    });

    const boostedCard = screen.getByTestId("compact-boosted-card");

    expect(boostedCard.parentElement).toHaveClass(
      "tw-px-3",
      "tw-py-1.5",
      "sm:tw-px-4"
    );
  });

  it("renders expanded boosted cards with the existing chat card", () => {
    const drops: any = Array.from({ length: 6 }, (_, index) => ({
      stableKey: `drop-${index + 1}`,
      serial_no: index + 1,
      type: DropSize.FULL,
      wave: { id: "w" },
    }));
    const boostedDrop = {
      id: "boost-expanded",
      serial_no: 999,
      author: { handle: "boosted" },
      wave: { id: "w", name: "Wave" },
      parts: [],
      boosts: 3,
    };

    render(
      <DropsList
        scrollContainerRef={{ current: null }}
        drops={drops}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        serialNo={null}
        targetDropRef={null}
        parentContainerRef={undefined}
        onQuoteClick={jest.fn()}
        onDropContentClick={jest.fn()}
        dropViewDropId={null}
        boostedDrops={[boostedDrop] as any}
        boostedDropsDisplayPreference="expanded"
        onBoostedDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("boosted-card")).toBeInTheDocument();
    expect(
      screen.queryByTestId("compact-boosted-card")
    ).not.toBeInTheDocument();
    expect(boostedCardProps).toHaveLength(1);
    expect(boostedCardProps[0]).toMatchObject({
      drop: boostedDrop,
      rank: 1,
      variant: "chat",
    });

    const boostedCard = screen.getByTestId("boosted-card");

    expect(boostedCard.parentElement).toHaveClass(
      "tw-px-3",
      "tw-py-3",
      "sm:tw-px-4"
    );
  });

  it("hides inserted boosted cards without hiding chronological drops", () => {
    const drops: any = Array.from({ length: 6 }, (_, index) => ({
      stableKey: `drop-${index + 1}`,
      serial_no: index + 1,
      type: DropSize.FULL,
      wave: { id: "w" },
    }));

    render(
      <DropsList
        scrollContainerRef={{ current: null }}
        drops={drops}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        serialNo={null}
        targetDropRef={null}
        parentContainerRef={undefined}
        onQuoteClick={jest.fn()}
        onDropContentClick={jest.fn()}
        dropViewDropId={null}
        boostedDrops={
          [
            {
              id: "boost-hidden",
              serial_no: 321,
              author: { handle: "boosted" },
              wave: { id: "w", name: "Wave" },
              parts: [],
              boosts: 2,
            },
          ] as any
        }
        boostedDropsDisplayPreference="hidden"
        onBoostedDropClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("boosted-card")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("compact-boosted-card")
    ).not.toBeInTheDocument();
    expect(screen.getAllByTestId("wrapper")).toHaveLength(6);
  });

  it("clicking a compact inline boosted card calls onBoostedDropClick with the drop serial", () => {
    const drops: any = Array.from({ length: 6 }, (_, index) => ({
      stableKey: `drop-${index + 1}`,
      serial_no: index + 1,
      type: DropSize.FULL,
      wave: { id: "w" },
    }));
    const onBoostedDropClick = jest.fn();

    render(
      <DropsList
        scrollContainerRef={{ current: null }}
        drops={drops}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        onReply={jest.fn()}
        onReplyClick={jest.fn()}
        serialNo={null}
        targetDropRef={null}
        parentContainerRef={undefined}
        onQuoteClick={jest.fn()}
        onDropContentClick={jest.fn()}
        dropViewDropId={null}
        boostedDrops={
          [
            {
              id: "boost-2",
              serial_no: 321,
              author: { handle: "boosted" },
              wave: { id: "w", name: "Wave" },
              parts: [],
              boosts: 2,
            },
          ] as any
        }
        onBoostedDropClick={onBoostedDropClick}
      />
    );

    fireEvent.click(screen.getByTestId("compact-boosted-card"));

    expect(onBoostedDropClick).toHaveBeenCalledWith(321);
  });
});
