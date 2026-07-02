import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BrainLeftSidebarWave from "@/components/brain/left-sidebar/waves/BrainLeftSidebarWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiWaveScore } from "@/generated/models/ApiWaveScore";

type MockWavePinProps = {
  readonly className?: string;
  readonly isPinned?: boolean;
};

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    onMouseEnter,
    onClick,
    className,
    ...rest
  }: any) => (
    <a
      href={href}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={className}
      {...rest}
    >
      {children}
    </a>
  ),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(),
}));
jest.mock("@/hooks/usePrefetchWaveData");
jest.mock("@/components/waves/WavePicture", () => () => (
  <span data-testid="wave-picture" />
));
jest.mock(
  "@/components/brain/left-sidebar/waves/BrainLeftSidebarWaveDropTime",
  () => (props: any) => <span data-testid="drop-time">{props.time}</span>
);
jest.mock(
  "@/components/brain/left-sidebar/waves/BrainLeftSidebarWavePin",
  () => (props: MockWavePinProps) => (
    <button
      type="button"
      className={props.className}
      data-testid="pin"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {String(props.isPinned)}
    </button>
  )
);

const mockedPrefetch = usePrefetchWaveData as jest.Mock;
const mockedUseMyStream = useMyStream as jest.Mock;

const getWaveRow = (): HTMLElement => {
  const row = screen.getByRole("link").closest(".tw-group");
  if (row === null) {
    throw new Error("Expected wave link to have a row ancestor");
  }
  return row as HTMLElement;
};

describe("BrainLeftSidebarWave", () => {
  const prefetch = jest.fn();
  const onHover = jest.fn();
  const setActiveWave = jest.fn();
  let activeWaveId: string | null = null;

  const baseWave = {
    id: "1",
    type: ApiWaveType.Chat,
    name: "Chat Wave",
    picture: "",
    contributors: [],
    newDropsCount: { count: 2, latestDropTimestamp: 123 },
    isPinned: false,
    unreadDropsCount: 0,
    latestReadTimestamp: 0,
    firstUnreadDropSerialNo: null,
    isMuted: false,
  } as any;
  const waveScore = {
    visibility_score: 83,
    quality_score: 78,
    hotness_score: 92,
    rep_sort_score: 41,
  } as ApiWaveScore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrefetch.mockReturnValue(prefetch);
    activeWaveId = null;
    mockedUseMyStream.mockImplementation(() => ({
      activeWave: { id: activeWaveId, set: setActiveWave },
    }));
  });

  it("prefetches wave data on hover when not active", async () => {
    render(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    const link = screen.getByRole("link");
    await userEvent.hover(link);
    expect(onHover).toHaveBeenCalledWith("1");
    expect(prefetch).toHaveBeenCalledWith("1");
  });

  it("does not prefetch when hovering active wave", async () => {
    activeWaveId = "1";
    mockedUseMyStream.mockImplementation(() => ({
      activeWave: { id: activeWaveId, set: setActiveWave },
    }));
    render(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    await userEvent.hover(screen.getByRole("link"));
    expect(onHover).not.toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
  });

  it("computes href based on current wave", () => {
    const { rerender } = render(
      <BrainLeftSidebarWave wave={baseWave} onHover={onHover} />
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/waves/1");
    activeWaveId = "1";
    mockedUseMyStream.mockImplementation(() => ({
      activeWave: { id: activeWaveId, set: setActiveWave },
    }));
    rerender(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/waves");
  });

  it("uses canonical message routes for direct message waves", () => {
    render(
      <BrainLeftSidebarWave wave={baseWave} onHover={onHover} isDirectMessage />
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", "/messages/1");
  });

  it("pushes shallow route on click", async () => {
    render(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    const link = screen.getByRole("link");
    await userEvent.click(link);
    expect(setActiveWave).toHaveBeenCalledWith("1", {
      isDirectMessage: false,
      divider: null,
    });
  });

  it("shows drop indicators for non-chat waves", () => {
    const dropWave = { ...baseWave, id: "2", type: ApiWaveType.Approve };
    render(<BrainLeftSidebarWave wave={dropWave} onHover={onHover} />);
    expect(screen.getByTestId("drop-time")).toHaveTextContent("123");
  });

  it("includes firstUnreadDropSerialNo in href when present", () => {
    const waveWithUnread = {
      ...baseWave,
      id: "3",
      firstUnreadDropSerialNo: 42,
    };
    render(<BrainLeftSidebarWave wave={waveWithUnread} onHover={onHover} />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/waves/3?divider=42"
    );
  });

  it("does not include serialNo in href when firstUnreadDropSerialNo is null", () => {
    const waveWithoutUnread = {
      ...baseWave,
      id: "4",
      firstUnreadDropSerialNo: null,
    };
    render(<BrainLeftSidebarWave wave={waveWithoutUnread} onHover={onHover} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/waves/4");
  });

  it("shows muted indicator when wave is muted", () => {
    const mutedWave = { ...baseWave, id: "5", isMuted: true };
    render(<BrainLeftSidebarWave wave={mutedWave} onHover={onHover} />);
    const bellSlashIcons = document.querySelectorAll(
      '[data-icon="bell-slash"]'
    );
    expect(bellSlashIcons.length).toBeGreaterThan(0);
  });

  it("does not show muted indicator when wave is not muted", () => {
    const unmutedWave = { ...baseWave, id: "6", isMuted: false };
    render(<BrainLeftSidebarWave wave={unmutedWave} onHover={onHover} />);
    const bellSlashIcons = document.querySelectorAll(
      '[data-icon="bell-slash"]'
    );
    expect(bellSlashIcons.length).toBe(0);
  });

  it("keeps hidden subwave unread out of the main row unread badge", () => {
    const parentWave = {
      ...baseWave,
      id: "parent",
      newDropsCount: { count: 0, latestDropTimestamp: null },
      unreadDropsCount: 2,
      unreadFollowedSubwaveDrops: 7,
    };

    render(
      <BrainLeftSidebarWave
        wave={parentWave}
        onHover={onHover}
        hasUnreadSubwaves
      />
    );

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText("7")).not.toBeInTheDocument();
    expect(getWaveRow().querySelector(".tw-bg-primary-400")).not.toBeNull();
  });

  it("hides the pin control when showPin is false", () => {
    const wave = {
      ...baseWave,
      id: "7",
    };
    render(
      <BrainLeftSidebarWave wave={wave} onHover={onHover} showPin={false} />
    );
    expect(screen.queryByTestId("pin")).not.toBeInTheDocument();
  });

  it("shows the unpin control when showPin is true", () => {
    const wave = {
      ...baseWave,
      id: "8",
      isPinned: true,
    };
    render(<BrainLeftSidebarWave wave={wave} onHover={onHover} showPin />);
    expect(screen.getByTestId("pin")).toHaveTextContent("true");
  });

  it("uses normal row padding when a wave has no subwaves", () => {
    render(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);

    const row = getWaveRow();

    expect(
      screen.queryByRole("button", { name: "Expand Chat Wave subwaves" })
    ).not.toBeInTheDocument();
    expect(row).toHaveClass("tw-px-5");
    expect(row).toHaveClass("tw-gap-x-4");
    expect(row).toHaveClass("tw-items-center");
    expect(row).not.toHaveClass("tw-items-start");
    expect(row).toHaveClass("tw-h-full");
    expect(row).toHaveClass("tw-min-h-[62px]");
    expect(row).not.toHaveClass("tw-pl-2");
  });

  it("keeps expandable parent rows focused on the wave link", () => {
    render(
      <BrainLeftSidebarWave
        wave={baseWave}
        onHover={onHover}
        canExpand
        hasUnreadSubwaves
      />
    );

    expect(
      screen.queryByRole("button", { name: "Expand Chat Wave subwaves" })
    ).not.toBeInTheDocument();
    expect(getWaveRow().querySelector(".tw-bg-primary-400")).toBeNull();
    expect(getWaveRow()).toHaveClass("tw-px-5");
    expect(getWaveRow()).toHaveClass("tw-gap-x-4");
    expect(getWaveRow()).toHaveClass("tw-items-center");
    expect(getWaveRow()).not.toHaveClass("tw-items-start");
    expect(getWaveRow()).toHaveClass("tw-h-full");
    expect(getWaveRow()).toHaveClass("tw-min-h-[62px]");
    expect(getWaveRow()).not.toHaveClass("tw-pl-2");
    const rowLink = screen.getByRole("link", { name: "Chat Wave" });
    expect(rowLink).toHaveClass("tw-static");
    expect(rowLink).toHaveClass("before:tw-absolute");
    expect(rowLink).toHaveClass("before:tw-inset-0");
    expect(rowLink).toHaveClass("before:tw-z-[5]");
    expect(rowLink).toHaveClass("before:tw-content-['']");
    expect(rowLink).toHaveClass("focus-visible:before:tw-ring-2");
    const avatar = screen.getByTestId("sidebar-wave-avatar");
    expect(avatar).toHaveAttribute("aria-hidden", "true");
    expect(avatar.closest("a")).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("does not navigate when the pin control is clicked", async () => {
    const user = userEvent.setup();

    render(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} showPin />);

    await user.click(screen.getByTestId("pin"));

    expect(setActiveWave).not.toHaveBeenCalled();
  });

  it("prefetches subwaves after hover intent on expandable parent rows", () => {
    jest.useFakeTimers();
    const onPrefetchSubwaves = jest.fn();

    try {
      render(
        <BrainLeftSidebarWave
          wave={baseWave}
          onHover={onHover}
          canExpand
          onPrefetchSubwaves={onPrefetchSubwaves}
        />
      );

      const waveRow = getWaveRow();

      fireEvent.mouseEnter(waveRow);

      act(() => {
        jest.advanceTimersByTime(149);
      });
      expect(onPrefetchSubwaves).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(onPrefetchSubwaves).toHaveBeenCalledWith("1");
    } finally {
      jest.useRealTimers();
    }
  });

  it("places the timestamp below the title and keeps pin before the far-right score", () => {
    render(
      <BrainLeftSidebarWave
        wave={{ ...baseWave, waveScore }}
        onHover={onHover}
      />
    );

    const timestamp = screen.getByTestId("drop-time");
    const timestampWrapper = timestamp.parentElement;
    const textStack = timestampWrapper?.parentElement;
    const metadataRow = textStack?.parentElement;
    const trailingCluster = screen
      .getByText("83")
      .closest("[aria-label]")
      ?.closest(".tw-ml-auto");
    const pin = screen.getByTestId("pin");
    const score = screen.getByText("83").closest("[aria-label]");

    expect(timestamp).toHaveTextContent("123");
    expect(textStack?.children[1]).toBe(timestampWrapper);
    expect(metadataRow?.children[1]).toBe(trailingCluster);
    expect(timestampWrapper).not.toHaveClass("tw-ml-auto");
    expect(timestampWrapper).not.toHaveClass("-tw-mt-0.5");
    expect(trailingCluster).toHaveClass("tw-ml-auto");
    expect(trailingCluster).toHaveClass("tw-items-center");
    expect(trailingCluster?.firstElementChild).toBe(pin);
    expect(trailingCluster?.lastElementChild).toContainElement(score);
  });

  it("cancels subwave prefetch when hover intent ends early", () => {
    jest.useFakeTimers();
    const onPrefetchSubwaves = jest.fn();

    try {
      render(
        <BrainLeftSidebarWave
          wave={baseWave}
          onHover={onHover}
          canExpand
          onPrefetchSubwaves={onPrefetchSubwaves}
        />
      );

      const row = getWaveRow();

      fireEvent.mouseEnter(row);
      fireEvent.mouseLeave(row);

      act(() => {
        jest.advanceTimersByTime(150);
      });
      expect(onPrefetchSubwaves).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("does not render a nested expand button for child rows", () => {
    render(
      <BrainLeftSidebarWave
        wave={baseWave}
        onHover={onHover}
        depth={1}
        canExpand
        isLastSubwave
      />
    );

    expect(
      screen.queryByRole("button", { name: "Expand Chat Wave subwaves" })
    ).not.toBeInTheDocument();
    expect(getWaveRow()).toHaveClass("tw-pl-[74px]");
    expect(getWaveRow()).toHaveClass("md:tw-pl-[70px]");
    expect(screen.getByTestId("wave-picture").parentElement).toHaveClass(
      "tw-size-7"
    );
    const elbow = getWaveRow().querySelector('[class~="tw-rounded-bl-xl"]');
    const continuation = getWaveRow().querySelector(
      '[class~="tw-top-1/2"][class~="tw-bottom-0"]'
    );
    expect(elbow).not.toBeNull();
    expect(elbow).toHaveClass("tw-left-9");
    expect(elbow).not.toHaveClass("md:tw-left-[52px]");
    expect(elbow).toHaveClass("tw-top-0");
    expect(elbow).toHaveClass("tw-h-1/2");
    expect(elbow).toHaveClass("tw-w-7");
    expect(elbow).toHaveClass("tw-border-l");
    expect(elbow).toHaveClass("tw-border-b");
    expect(continuation).toBeNull();
    expect(getWaveRow()).toHaveClass("tw-items-center");
    expect(getWaveRow()).not.toHaveClass("tw-items-start");
    expect(getWaveRow()).toHaveClass("tw-h-full");
    expect(getWaveRow()).toHaveClass("tw-min-h-[48px]");
    expect(screen.queryByTestId("pin")).not.toBeInTheDocument();
  });
});
