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
    expect(row).not.toHaveClass("tw-pl-2");
  });

  it("renders one row link and keeps the subwave expand button separate", async () => {
    const onToggleExpand = jest.fn();
    const user = userEvent.setup();

    render(
      <BrainLeftSidebarWave
        wave={baseWave}
        onHover={onHover}
        canExpand
        hasUnreadSubwaves
        onToggleExpand={onToggleExpand}
      />
    );

    const expandButton = screen.getByRole("button", {
      name: "Expand Chat Wave subwaves",
    });

    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    expect(expandButton).not.toHaveClass("tw-absolute");
    expect(expandButton).toHaveClass("tw-relative");
    expect(expandButton).toHaveClass("tw-inline-flex");
    expect(expandButton).toHaveClass("tw-size-5");
    expect(expandButton).toHaveClass("tw-rounded-full");
    expect(expandButton).toHaveClass("tw-border-0");
    expect(expandButton).toHaveClass("tw-bg-transparent");
    expect(expandButton).toHaveClass("desktop-hover:hover:tw-bg-iron-700/70");
    expect(expandButton.querySelector("svg")).toHaveClass("tw-size-3.5");
    expect(expandButton.querySelector(".tw-bg-primary-400")).toBeNull();
    const unreadSubwavesDot = getWaveRow().querySelector(".tw-bg-primary-400");
    expect(unreadSubwavesDot).not.toBeNull();
    expect(unreadSubwavesDot).toHaveClass("tw-right-[-3px]");
    expect(unreadSubwavesDot).toHaveClass("tw-top-[-3px]");
    expect(getWaveRow()).toHaveClass("tw-px-5");
    expect(getWaveRow()).toHaveClass("tw-gap-x-4");
    expect(getWaveRow()).not.toHaveClass("tw-pl-2");
    const rowLink = screen.getByRole("link", { name: "Chat Wave" });
    expect(rowLink).toHaveClass("tw-absolute");
    expect(rowLink).toHaveClass("tw-inset-0");
    expect(rowLink).toHaveClass("tw-z-[5]");
    expect(rowLink).toHaveClass("focus-visible:tw-ring-2");
    expect(rowLink.nextElementSibling).toHaveClass("tw-pointer-events-none");
    expect(expandButton.closest("a")).toBeNull();
    expect(expandButton.parentElement).toHaveClass("tw-z-10");
    expect(expandButton.parentElement).toHaveClass("tw-pointer-events-auto");
    const avatar = screen.getByTestId("sidebar-wave-avatar");
    expect(avatar).toHaveAttribute("aria-hidden", "true");
    expect(avatar.closest("a")).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(1);

    await user.click(expandButton);

    expect(onToggleExpand).toHaveBeenCalledWith("1");
    expect(setActiveWave).not.toHaveBeenCalled();
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

  it("keeps the expand button visually active when subwaves are open", () => {
    render(
      <BrainLeftSidebarWave
        wave={baseWave}
        onHover={onHover}
        canExpand
        isExpanded
        onToggleExpand={jest.fn()}
      />
    );

    const expandButton = screen.getByRole("button", {
      name: "Collapse Chat Wave subwaves",
    });

    expect(expandButton).toHaveClass("tw-bg-iron-700/60");
    expect(expandButton).toHaveClass("tw-text-iron-200");
    expect(expandButton).toHaveClass("tw-opacity-100");
  });

  it("shows a busy expand control while subwaves are loading", () => {
    render(
      <BrainLeftSidebarWave
        wave={baseWave}
        onHover={onHover}
        canExpand
        isLoadingSubwaves
        onToggleExpand={jest.fn()}
      />
    );

    const expandButton = screen.getByRole("button", {
      name: "Loading Chat Wave subwaves",
    });

    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    expect(expandButton).toHaveAttribute("aria-busy", "true");
    expect(expandButton).toHaveClass("tw-bg-iron-700/60");
    expect(expandButton.querySelector("svg")).toHaveClass("tw-animate-spin");
  });

  it("places the timestamp below the title and pushes score to the far edge", () => {
    render(
      <BrainLeftSidebarWave
        wave={{ ...baseWave, waveScore }}
        onHover={onHover}
      />
    );

    const timestamp = screen.getByTestId("drop-time");
    const timestampWrapper = timestamp.parentElement;
    const metadataRow = timestampWrapper?.parentElement;
    const score = screen.getByText("83").closest("[aria-label]")?.parentElement;

    expect(metadataRow?.children[0]).toBe(timestampWrapper);
    expect(metadataRow?.children[1]).toBe(score);
    expect(timestampWrapper).not.toHaveClass("tw-ml-auto");
    expect(score).toHaveClass("tw-ml-auto");
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
        onToggleExpand={jest.fn()}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Expand Chat Wave subwaves" })
    ).not.toBeInTheDocument();
    expect(getWaveRow()).toHaveClass("tw-pl-[82px]");
    expect(getWaveRow()).toHaveClass("md:tw-pl-[78px]");
    expect(screen.getByTestId("wave-picture").parentElement).toHaveClass(
      "tw-size-7"
    );
    const rail = getWaveRow().querySelector(".tw-w-px");
    expect(rail).not.toBeNull();
    expect(rail).toHaveClass("tw-left-14");
    expect(rail).toHaveClass("md:tw-left-[52px]");
    expect(rail).toHaveClass("-tw-top-1");
    expect(rail).toHaveClass("tw-bottom-4");
    expect(getWaveRow().querySelector(".tw-h-px")).toBeNull();
    expect(screen.queryByTestId("pin")).not.toBeInTheDocument();
  });
});
