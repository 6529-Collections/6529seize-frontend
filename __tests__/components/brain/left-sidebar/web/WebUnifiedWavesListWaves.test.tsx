import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import WebUnifiedWavesListWaves from "@/components/brain/left-sidebar/web/WebUnifiedWavesListWaves";
import { SIDEBAR_SUBWAVE_ROW_EXIT_CLEANUP_MS } from "@/hooks/useAnimatedSidebarWaveRows";
import { useVirtualizedWaves } from "@/hooks/useVirtualizedWaves";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";

let mockIsTouchDevice = false;
let mockAuthResult = {
  connectedProfile: { handle: "alice" } as { readonly handle: string } | null,
  activeProfileProxy: null,
};

jest.mock("@/components/utils/button/PrimaryButton", () => (props: any) => (
  <button onClick={props.onClicked}>{props.children}</button>
));
jest.mock("@/hooks/useCreateModalState", () => ({
  __esModule: true,
  default: () => ({ openWave: jest.fn(), isApp: false }),
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => mockIsTouchDevice,
}));
jest.mock("@/hooks/usePrefetchWaveData", () => ({
  usePrefetchWaveData: () => jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockAuthResult,
}));
jest.mock(
  "@/components/brain/left-sidebar/waves/SectionHeader",
  () => (props: any) => (
    <div
      data-testid={`header-${props.label}`}
      data-padding={props.paddingClassName}
    >
      {props.label}
      {props.labelTrailingContent}
      {props.rightContent}
    </div>
  )
);
jest.mock(
  "@/components/brain/left-sidebar/waves/WavesFilterToggle",
  () => () => <div data-testid="waves-filter-toggle" />
);
jest.mock(
  "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWave/subcomponents/WaveAvatar",
  () => ({
    WaveAvatar: (props: {
      readonly size?: string | undefined;
      readonly wave: { readonly id: string };
    }) => (
      <div
        data-testid={`preview-avatar-${props.wave.id}`}
        data-size={props.size ?? "default"}
      />
    ),
  })
);
jest.mock("react-tooltip", () => ({
  Tooltip: (props: any) => (
    <div
      data-testid={`tooltip-${props.id}`}
      data-open-on-click={String(props.openOnClick)}
    />
  ),
}));
jest.mock("@/hooks/useVirtualizedWaves");
jest.mock("@/hooks/useShowFollowingWaves");
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettingsOptional: jest.fn(),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(),
}));

const mockUseVirtualizedWaves = useVirtualizedWaves as jest.Mock;
const mockUseShowFollowingWaves = useShowFollowingWaves as jest.Mock;
const mockUseSeizeSettingsOptional = useSeizeSettingsOptional as jest.Mock;
const mockUseMyStream = useMyStream as jest.Mock;
const loadSubwavesForParent = jest.fn();
const prefetchSubwavesForParent = jest.fn();

const scrollRef = {
  current: document.createElement("div"),
} as React.RefObject<HTMLDivElement>;
const sentinel = document.createElement("div");

const baseWaves = [
  createMockMinimalWave({ id: "a1" }),
  createMockMinimalWave({
    id: "h1",
    name: "Highly Rated One",
    sidebarSection: "highly-rated",
  }),
  createMockMinimalWave({ id: "p1", isPinned: true }),
  createMockMinimalWave({ id: "f1", isFollowing: true }),
  createMockMinimalWave({ id: "r1", isPinned: false }),
];

const flushAnimatedSidebarRows = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  mockIsTouchDevice = false;
  mockAuthResult = {
    connectedProfile: { handle: "alice" },
    activeProfileProxy: null,
  };
  mockUseShowFollowingWaves.mockReturnValue([false, jest.fn()]);
  mockUseMyStream.mockReturnValue({
    activeWave: { id: null, parentWaveId: null, set: jest.fn() },
    waves: {
      loadSubwavesForParent,
      prefetchSubwavesForParent,
      loadingSubwaveParentIds: [],
    },
  });
  mockUseSeizeSettingsOptional.mockReturnValue({
    isAnnouncementsWave: (waveId: string) => waveId === "a1",
  });
  mockUseVirtualizedWaves.mockReturnValue({
    containerRef: { current: document.createElement("div") },
    sentinelRef: { current: sentinel },
    virtualItems: [
      { index: 0, start: 0, size: 62 },
      { index: 1, start: 62, size: 40 },
      { index: 2, start: 102, size: 1 },
    ],
    totalHeight: 103,
    scrollToIndex: jest.fn(() => true),
  });
});

const renderWebWaves = (
  props: Partial<React.ComponentProps<typeof WebUnifiedWavesListWaves>> = {}
) =>
  render(
    <WebUnifiedWavesListWaves
      waves={baseWaves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      sentinelRef={React.createRef<HTMLDivElement>()}
      {...props}
    />
  );

jest.mock(
  "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWave",
  () => (props: any) => (
    <div
      data-testid={`wave-${props.wave.id}`}
      data-pin={String(props.showPin)}
      data-depth={String(props.depth)}
      data-can-expand={String(props.canExpand)}
      data-unread-subwaves={String(props.hasUnreadSubwaves)}
    ></div>
  )
);

it("renders announcement, highly rated preview, pinned, and one filterable bottom list without double rendering", () => {
  const sentinelRef = React.createRef<HTMLDivElement>();
  mockUseVirtualizedWaves.mockReturnValueOnce({
    containerRef: { current: document.createElement("div") },
    sentinelRef: { current: sentinel },
    virtualItems: [
      { index: 0, start: 0, size: 62 },
      { index: 1, start: 62, size: 62 },
      { index: 2, start: 124, size: 62 },
      { index: 3, start: 186, size: 1 },
    ],
    totalHeight: 187,
    scrollToIndex: jest.fn(() => true),
  });

  renderWebWaves({ sentinelRef });

  expect(screen.getByTestId("header-Waves")).toBeInTheDocument();
  expect(screen.getByTestId("header-Waves")).toHaveAttribute(
    "data-padding",
    "tw-px-4"
  );
  const discoverWavesLink = screen.getByRole("link", {
    name: "Discover Waves",
  });
  expect(discoverWavesLink).toHaveAttribute("href", "/discover");
  expect(discoverWavesLink).toHaveClass("tw-text-[13px]", "tw-font-medium");
  expect(discoverWavesLink.querySelector("svg")).toBeNull();
  expect(screen.getByTestId("waves-filter-toggle")).toBeInTheDocument();
  expect(screen.getByLabelText("Announcement waves")).toBeInTheDocument();
  expect(screen.getByText("Worth Checking Out")).toBeInTheDocument();
  expect(
    screen.getByRole("button", {
      name: "Highly rated waves you don’t follow yet.",
    })
  ).toHaveClass("tw-size-6");
  fireEvent.click(
    screen.getByRole("button", {
      name: "Highly rated waves you don’t follow yet.",
    })
  );
  expect(
    screen.getByRole("dialog", {
      name: "Highly rated waves you don’t follow yet.",
    })
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("dialog", {
      name: "Highly rated waves you don’t follow yet.",
    })
  );
  expect(
    screen.queryByRole("dialog", {
      name: "Highly rated waves you don’t follow yet.",
    })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", {
      name: "Expand Worth Checking Out, 1 wave",
    })
  ).toBeNull();
  expect(
    screen.getByRole("link", { name: "Open Highly Rated One" })
  ).toBeInTheDocument();
  expect(screen.getByTestId("preview-avatar-h1")).toBeInTheDocument();
  expect(screen.queryByLabelText("Worth checking out waves")).toBeNull();
  expect(screen.getByLabelText("Pinned waves")).toBeInTheDocument();
  expect(screen.getByLabelText("All recent waves list")).toBeInTheDocument();
  expect(screen.queryByLabelText("Following waves")).toBeNull();
  expect(screen.getByTestId("wave-a1")).toHaveAttribute("data-pin", "false");
  expect(screen.getByTestId("wave-h1")).toHaveAttribute("data-pin", "true");
  expect(screen.getByTestId("wave-p1")).toHaveAttribute("data-pin", "true");
  expect(screen.getByTestId("wave-f1")).toHaveAttribute("data-pin", "true");
  expect(screen.getByTestId("wave-r1")).toHaveAttribute("data-pin", "true");
  expect(
    screen.getAllByTestId(/^wave-/).map((item) => item.dataset.testid)
  ).toEqual(["wave-a1", "wave-p1", "wave-h1", "wave-f1", "wave-r1"]);
  expect(sentinelRef.current).toBeInstanceOf(HTMLDivElement);
});

it("keeps worth checking out waves in All at their recent-activity position", () => {
  renderWebWaves({
    waves: [
      createMockMinimalWave({
        id: "quality-wave",
        sidebarActivityTimestamp: 200,
        sidebarSection: "highly-rated",
      }),
      createMockMinimalWave({
        id: "older-wave",
        sidebarActivityTimestamp: 100,
      }),
      createMockMinimalWave({
        id: "recent-wave",
        sidebarActivityTimestamp: 300,
      }),
    ],
  });

  expect(screen.getByTestId("preview-avatar-quality-wave")).toBeInTheDocument();
  const bottomItems = mockUseVirtualizedWaves.mock.calls.at(-1)?.[0].items;
  expect(bottomItems.map((row: any) => row.wave.id)).toEqual([
    "recent-wave",
    "quality-wave",
    "older-wave",
  ]);
});

it("keeps discovery-only worth checking out waves out of Joined", () => {
  mockUseShowFollowingWaves.mockReturnValue([true, jest.fn()]);

  renderWebWaves({
    waves: [
      createMockMinimalWave({
        id: "recommendation",
        isInAllWaves: false,
        sidebarSection: "highly-rated",
      }),
      createMockMinimalWave({ id: "joined-wave", isFollowing: true }),
    ],
  });

  expect(
    screen.getByTestId("preview-avatar-recommendation")
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Following waves list")).toBeInTheDocument();
  expect(screen.queryByTestId("wave-recommendation")).toBeNull();
  expect(screen.getByTestId("wave-joined-wave")).toBeInTheDocument();
});

it("keeps the worth checking out info tooltip available on touch devices", () => {
  const sentinelRef = React.createRef<HTMLDivElement>();
  mockIsTouchDevice = true;

  renderWebWaves({ sentinelRef });

  expect(
    screen.getByRole("button", {
      name: "Highly rated waves you don’t follow yet.",
    })
  ).toHaveClass("tw-size-6");
  expect(screen.getByTestId("preview-avatar-h1")).toHaveAttribute(
    "data-size",
    "lg"
  );
  const infoButton = screen.getByRole("button", {
    name: "Highly rated waves you don’t follow yet.",
  });
  fireEvent.click(infoButton);
  expect(
    screen.getByRole("dialog", {
      name: "Highly rated waves you don’t follow yet.",
    })
  ).toBeInTheDocument();
  fireEvent.click(infoButton);
  expect(
    screen.queryByRole("dialog", {
      name: "Highly rated waves you don’t follow yet.",
    })
  ).not.toBeInTheDocument();
});

it("keeps the overlaid touch score inside the wave navigation link", () => {
  mockIsTouchDevice = true;
  const scoredWave = createMockMinimalWave({
    id: "h-score",
    name: "Touch Discovery",
    sidebarSection: "highly-rated",
    waveScore: {
      visibility_score: 82,
      quality_score: 86,
      hotness_score: 75,
      rep_sort_score: 64,
    } as any,
  });

  renderWebWaves({ waves: [scoredWave] });

  const waveLink = screen.getByRole("link", {
    name: "Open Touch Discovery, score 82",
  });
  const scoreBadgeText = screen.getByText("82", { selector: "text" });
  const scoreBadge = scoreBadgeText.closest("span");

  expect(waveLink).toHaveClass(
    "tw-relative",
    "tw-size-11",
    "tw-cursor-pointer"
  );
  expect(scoreBadgeText.closest("a")).toBe(waveLink);
  expect(scoreBadge).toHaveClass(
    "tw-absolute",
    "-tw-bottom-1.5",
    "-tw-right-2",
    "tw-h-6",
    "tw-w-7",
    "tw-cursor-pointer"
  );

  fireEvent.click(scoreBadgeText);
  expect(
    screen.queryByRole("dialog", { name: "Wave score details" })
  ).not.toBeInTheDocument();
});

it("hides the worth checking out info tooltip when no profile is connected", () => {
  mockAuthResult = {
    connectedProfile: null,
    activeProfileProxy: null,
  };

  renderWebWaves();

  expect(screen.getByText("Worth Checking Out")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", {
      name: "Highly rated waves you don’t follow yet.",
    })
  ).not.toBeInTheDocument();
});

it("caps highly rated previews at ten without rendering an overflow control", () => {
  const waves = Array.from({ length: 11 }, (_, index) =>
    createMockMinimalWave({
      id: `h${index + 1}`,
      name: `Highly Rated ${index + 1}`,
      sidebarSection: "highly-rated",
    })
  );

  renderWebWaves({ waves });

  expect(screen.getByTestId("preview-avatar-h1")).toBeInTheDocument();
  expect(screen.getByTestId("preview-avatar-h10")).toBeInTheDocument();
  expect(screen.queryByTestId("preview-avatar-h11")).toBeNull();
  expect(
    screen.queryByRole("button", {
      name: /more Highly Rated/,
    })
  ).toBeNull();
  expect(screen.queryByLabelText("Worth checking out waves")).toBeNull();
  expect(screen.queryByTestId("wave-h11")).toBeNull();
});

it("keeps an active loaded all-wave visible in the capped preview strip", () => {
  const activeWave = createMockMinimalWave({
    id: "r11",
    name: "Active Ranked Eleven",
  });
  const waves = [
    ...Array.from({ length: 10 }, (_, index) =>
      createMockMinimalWave({
        id: `h${index + 1}`,
        name: `Highly Rated ${index + 1}`,
        sidebarSection: "highly-rated",
      })
    ),
    activeWave,
  ];
  mockUseMyStream.mockReturnValue({
    activeWave: { id: activeWave.id, parentWaveId: null, set: jest.fn() },
    waves: {
      loadSubwavesForParent,
      prefetchSubwavesForParent,
      loadingSubwaveParentIds: [],
    },
  });

  renderWebWaves({ waves });

  expect(screen.getByTestId("preview-avatar-r11")).toBeInTheDocument();
  expect(screen.queryByTestId("preview-avatar-h10")).toBeNull();
  expect(
    screen.getByRole("link", { name: "Open Active Ranked Eleven" })
  ).toBeInTheDocument();
});

it("keeps the active highly rated wave visible in the preview strip", () => {
  mockUseMyStream.mockReturnValue({
    activeWave: { id: "h1", set: jest.fn() },
    waves: {
      loadSubwavesForParent,
      prefetchSubwavesForParent,
      loadingSubwaveParentIds: [],
    },
  });

  renderWebWaves();

  expect(
    screen.getByRole("link", { name: "Open Highly Rated One" })
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("Worth checking out waves")).toBeNull();
  expect(screen.getByTestId("wave-h1")).toBeInTheDocument();
});

it("feeds direct messages to virtualization as one flat list", () => {
  renderWebWaves({
    waves: [
      createMockMinimalWave({ id: "newest", isFollowing: false }),
      createMockMinimalWave({ id: "joined-older", isFollowing: true }),
    ],
    hideHeaders: true,
    hideToggle: true,
    hidePin: true,
    basePath: "/messages",
    isDirectMessage: true,
  });

  const virtualizedItems = mockUseVirtualizedWaves.mock.calls.at(-1)?.[0].items;
  expect(
    screen.getByLabelText("Direct message conversations")
  ).toBeInTheDocument();
  expect(virtualizedItems.map((row: any) => row.wave.id)).toEqual([
    "newest",
    "joined-older",
  ]);
});

it("does not give special placement to official waves", () => {
  renderWebWaves({
    waves: [
      createMockMinimalWave({
        id: "o1",
        isOfficial: true,
        isPinned: true,
      }),
    ],
  });

  expect(screen.getByLabelText("Pinned waves")).toBeInTheDocument();
  expect(screen.getByTestId("wave-o1")).toHaveAttribute("data-pin", "true");
});

it("renders followed waves in the same bottom list instead of a separate section", () => {
  renderWebWaves({
    waves: [
      createMockMinimalWave({ id: "p1", isPinned: true }),
      createMockMinimalWave({ id: "f1", isFollowing: true }),
    ],
  });

  expect(screen.getByText("Pinned")).toBeInTheDocument();
  expect(screen.getByText("All")).toBeInTheDocument();
  expect(screen.queryByText("Following")).toBeNull();
  expect(screen.getByLabelText("All recent waves list")).toBeInTheDocument();
  expect(screen.getByTestId("wave-f1")).toHaveAttribute("data-pin", "true");
});

it("passes pin controls through for pinned announcement waves", () => {
  renderWebWaves({
    waves: [
      createMockMinimalWave({
        id: "a1",
        isPinned: true,
      }),
    ],
  });

  expect(screen.getByTestId("wave-a1")).toHaveAttribute("data-pin", "true");
});

it("expands regular subwaves and keeps child rows unpinned", async () => {
  renderWebWaves({
    waves: [
      createMockMinimalWave({
        id: "parent",
        hasSubwaves: true,
      }),
      createMockMinimalWave({
        id: "child",
        parentWaveId: "parent",
        hasSubwaves: true,
        createdAt: 10,
        unreadDropsCount: 1,
      }),
    ],
  });

  expect(screen.getByTestId("wave-parent")).toHaveAttribute(
    "data-unread-subwaves",
    "true"
  );
  expect(screen.queryByTestId("wave-child")).toBeNull();
  const collapsedVirtualizerOptions =
    mockUseVirtualizedWaves.mock.calls.at(-1)?.[0];
  expect(
    collapsedVirtualizerOptions.rowHeight(collapsedVirtualizerOptions.items[0])
  ).toBe(62);
  expect(
    collapsedVirtualizerOptions.rowHeight(collapsedVirtualizerOptions.items[1])
  ).toBe(42);

  fireEvent.click(
    screen.getByRole("button", {
      name: "View 1 subwave for Mock Wave",
    })
  );
  await flushAnimatedSidebarRows();

  expect(loadSubwavesForParent).toHaveBeenCalledWith("parent");
  expect(
    screen.getByRole("button", {
      name: "Hide Mock Wave subwaves",
    })
  ).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByTestId("wave-parent")).toHaveAttribute(
    "data-unread-subwaves",
    "false"
  );
  expect(screen.getByTestId("wave-child")).toHaveAttribute("data-depth", "1");
  expect(screen.getByTestId("wave-child")).toHaveAttribute(
    "data-can-expand",
    "false"
  );
  expect(screen.getByTestId("wave-child").parentElement).toHaveAttribute(
    "data-sidebar-subwave-row-state",
    "entering"
  );
  const expandedVirtualizerOptions =
    mockUseVirtualizedWaves.mock.calls.at(-1)?.[0];
  const expandedToggleRow = expandedVirtualizerOptions.items.find(
    (row: { readonly key: string }) => row.key === "parent:subwaves-toggle"
  );
  expect(expandedVirtualizerOptions.rowHeight(expandedToggleRow)).toBe(38);
  expect(screen.getByTestId("wave-child")).toHaveAttribute("data-pin", "false");
});

it("hides expanded child rows immediately while the sidebar is collapsed", async () => {
  const waves = [
    createMockMinimalWave({
      id: "parent",
      hasSubwaves: true,
    }),
    createMockMinimalWave({
      id: "child",
      parentWaveId: "parent",
      createdAt: 10,
      unreadDropsCount: 1,
    }),
  ];
  const sentinelRef = React.createRef<HTMLDivElement>();
  const { rerender } = render(
    <WebUnifiedWavesListWaves
      waves={waves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      sentinelRef={sentinelRef}
    />
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "View 1 subwave for Mock Wave",
    })
  );
  await flushAnimatedSidebarRows();

  expect(screen.getByTestId("wave-child")).toBeInTheDocument();

  rerender(
    <WebUnifiedWavesListWaves
      waves={waves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      sentinelRef={sentinelRef}
      isCollapsed
    />
  );

  expect(screen.queryByTestId("wave-child")).toBeNull();
  expect(
    screen.queryByRole("button", {
      name: "Hide Mock Wave subwaves",
    })
  ).toBeNull();
  expect(
    screen.queryByRole("button", {
      name: "View 1 subwave for Mock Wave",
    })
  ).toBeNull();
  expect(screen.getByTestId("wave-parent")).toHaveAttribute(
    "data-can-expand",
    "false"
  );
  expect(screen.getByTestId("wave-parent")).toHaveAttribute(
    "data-unread-subwaves",
    "true"
  );

  rerender(
    <WebUnifiedWavesListWaves
      waves={waves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      sentinelRef={sentinelRef}
    />
  );

  expect(
    screen.getByRole("button", {
      name: "Hide Mock Wave subwaves",
    })
  ).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByTestId("wave-child")).toBeInTheDocument();
});

it("keeps child rows mounted while collapse animation runs", async () => {
  jest.useFakeTimers();

  try {
    render(
      <WebUnifiedWavesListWaves
        waves={[
          createMockMinimalWave({
            id: "parent",
            hasSubwaves: true,
          }),
          createMockMinimalWave({
            id: "child",
            parentWaveId: "parent",
            createdAt: 10,
          }),
        ]}
        onHover={jest.fn()}
        scrollContainerRef={scrollRef}
        sentinelRef={React.createRef<HTMLDivElement>()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "View 1 subwave for Mock Wave",
      })
    );
    await flushAnimatedSidebarRows();
    expect(loadSubwavesForParent).toHaveBeenCalledWith("parent");
    expect(screen.getByTestId("wave-child")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Hide Mock Wave subwaves",
      })
    );
    await flushAnimatedSidebarRows();
    expect(loadSubwavesForParent).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("wave-child").parentElement).toHaveAttribute(
      "data-sidebar-subwave-row-state",
      "exiting"
    );

    act(() => {
      jest.advanceTimersByTime(SIDEBAR_SUBWAVE_ROW_EXIT_CLEANUP_MS);
    });

    expect(screen.queryByTestId("wave-child")).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

it("drops highly rated child rows when their parent leaves the section", async () => {
  jest.useFakeTimers();

  try {
    const highlyRatedParent = createMockMinimalWave({
      id: "highly-rated-parent",
      sidebarSection: "highly-rated",
      hasSubwaves: true,
    });
    const highlyRatedChild = createMockMinimalWave({
      id: "highly-rated-child",
      parentWaveId: "highly-rated-parent",
      sidebarSection: "highly-rated",
      createdAt: 10,
    });
    const sentinelRef = React.createRef<HTMLDivElement>();
    const { rerender } = render(
      <WebUnifiedWavesListWaves
        waves={[highlyRatedParent, highlyRatedChild]}
        onHover={jest.fn()}
        scrollContainerRef={scrollRef}
        sentinelRef={sentinelRef}
        hideHeaders
      />
    );

    const worthCheckingOutWaves = screen.getByLabelText(
      "Worth checking out waves"
    );
    fireEvent.click(
      within(worthCheckingOutWaves).getByRole("button", {
        name: "View 1 subwave for Mock Wave",
      })
    );
    await flushAnimatedSidebarRows();
    expect(loadSubwavesForParent).toHaveBeenCalledWith("highly-rated-parent");
    expect(worthCheckingOutWaves).toBeInTheDocument();
    expect(
      within(worthCheckingOutWaves).getByTestId("wave-highly-rated-child")
    ).toBeInTheDocument();

    rerender(
      <WebUnifiedWavesListWaves
        waves={[highlyRatedChild]}
        onHover={jest.fn()}
        scrollContainerRef={scrollRef}
        sentinelRef={sentinelRef}
        hideHeaders
      />
    );
    await flushAnimatedSidebarRows();

    expect(screen.queryByTestId("wave-highly-rated-parent")).toBeNull();
    expect(screen.queryByTestId("wave-highly-rated-child")).toBeNull();
    expect(screen.queryByLabelText("Worth checking out waves")).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

it("auto-expands the parent for the active subwave", () => {
  mockUseMyStream.mockReturnValue({
    activeWave: { id: "child", set: jest.fn() },
    waves: {
      loadSubwavesForParent,
      prefetchSubwavesForParent,
      loadingSubwaveParentIds: [],
    },
  });

  render(
    <WebUnifiedWavesListWaves
      waves={[
        createMockMinimalWave({
          id: "parent",
          hasSubwaves: true,
        }),
        createMockMinimalWave({
          id: "child",
          parentWaveId: "parent",
          createdAt: 10,
        }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      sentinelRef={React.createRef<HTMLDivElement>()}
    />
  );

  expect(
    screen.getByRole("button", {
      name: "Hide Mock Wave subwaves",
    })
  ).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByTestId("wave-child")).toBeInTheDocument();
});

it("keeps the active parent tree ahead of newly paginated roots", async () => {
  mockUseMyStream.mockReturnValue({
    activeWave: { id: "child", parentWaveId: "parent", set: jest.fn() },
    waves: {
      loadSubwavesForParent,
      prefetchSubwavesForParent,
      loadingSubwaveParentIds: [],
    },
  });
  const parent = createMockMinimalWave({
    id: "parent",
    hasSubwaves: true,
    sidebarActivityTimestamp: 10,
  });
  const child = createMockMinimalWave({
    id: "child",
    parentWaveId: "parent",
    sidebarActivityTimestamp: 20,
  });
  const recent = createMockMinimalWave({
    id: "recent",
    sidebarActivityTimestamp: 300,
  });
  const newlyPaginated = createMockMinimalWave({
    id: "newly-paginated",
    sidebarActivityTimestamp: 200,
  });

  const { rerender } = renderWebWaves({
    waves: [recent, parent, child],
  });

  expect(
    mockUseVirtualizedWaves.mock.calls
      .at(-1)?.[0]
      .items.slice(0, 3)
      .map((row: any) => row.key)
  ).toEqual(["parent", "parent:subwaves-toggle", "parent:child"]);

  rerender(
    <WebUnifiedWavesListWaves
      waves={[recent, newlyPaginated, parent, child]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      sentinelRef={React.createRef<HTMLDivElement>()}
    />
  );
  await flushAnimatedSidebarRows();

  expect(
    mockUseVirtualizedWaves.mock.calls
      .at(-1)?.[0]
      .items.slice(0, 3)
      .map((row: any) => row.key)
  ).toEqual(["parent", "parent:subwaves-toggle", "parent:child"]);
});

it("keeps active root waves in normal activity order", () => {
  mockUseMyStream.mockReturnValue({
    activeWave: { id: "older", parentWaveId: null, set: jest.fn() },
    waves: {
      loadSubwavesForParent,
      prefetchSubwavesForParent,
      loadingSubwaveParentIds: [],
    },
  });

  renderWebWaves({
    waves: [
      createMockMinimalWave({
        id: "older",
        sidebarActivityTimestamp: 10,
      }),
      createMockMinimalWave({
        id: "recent",
        sidebarActivityTimestamp: 300,
      }),
    ],
  });

  expect(
    mockUseVirtualizedWaves.mock.calls
      .at(-1)?.[0]
      .items.map((row: any) => row.key)
  ).toEqual(["recent", "older"]);
});

it("loads a direct active subwave parent before showing it expanded", async () => {
  mockUseMyStream.mockReturnValue({
    activeWave: { id: "child", parentWaveId: "parent", set: jest.fn() },
    waves: {
      loadSubwavesForParent,
      prefetchSubwavesForParent,
      loadingSubwaveParentIds: ["parent"],
    },
  });

  render(
    <WebUnifiedWavesListWaves
      waves={[
        createMockMinimalWave({
          id: "parent",
          hasSubwaves: true,
        }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      sentinelRef={React.createRef<HTMLDivElement>()}
    />
  );

  expect(
    screen.getByRole("button", {
      name: "Loading Mock Wave subwaves",
    })
  ).toHaveAttribute("aria-busy", "true");
  expect(
    screen.getByRole("button", {
      name: "Loading Mock Wave subwaves",
    })
  ).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByTestId("wave-child")).toBeNull();

  await waitFor(() => {
    expect(loadSubwavesForParent).toHaveBeenCalledWith("parent");
  });
});
