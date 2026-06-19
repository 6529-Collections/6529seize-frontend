import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import WebUnifiedWavesListWaves from "@/components/brain/left-sidebar/web/WebUnifiedWavesListWaves";
import { SIDEBAR_SUBWAVE_ROW_TRANSITION_MS } from "@/hooks/useAnimatedSidebarWaveRows";
import { useVirtualizedWaves } from "@/hooks/useVirtualizedWaves";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";

jest.mock("@/components/utils/button/PrimaryButton", () => (props: any) => (
  <button onClick={props.onClicked}>{props.children}</button>
));
jest.mock("@/hooks/useCreateModalState", () => ({
  __esModule: true,
  default: () => ({ openWave: jest.fn(), isApp: false }),
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { handle: "alice" },
    activeProfileProxy: null,
  }),
}));
jest.mock(
  "@/components/brain/left-sidebar/waves/SectionHeader",
  () => (props: any) => (
    <div
      data-testid={`header-${props.label}`}
      data-padding={props.paddingClassName}
    >
      {props.label}
    </div>
  )
);
jest.mock(
  "@/components/brain/left-sidebar/waves/WavesFilterToggle",
  () => () => <div data-testid="waves-filter-toggle" />
);
jest.mock("react-tooltip", () => ({
  Tooltip: () => null,
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
  createMockMinimalWave({ id: "h1", sidebarSection: "highly-rated" }),
  createMockMinimalWave({ id: "p1", isPinned: true }),
  createMockMinimalWave({ id: "f1", isFollowing: true }),
  createMockMinimalWave({ id: "r1", isPinned: false }),
];

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  mockUseShowFollowingWaves.mockReturnValue([false, jest.fn()]);
  mockUseMyStream.mockReturnValue({
    activeWave: { id: null, set: jest.fn() },
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
  });
});

jest.mock(
  "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWave",
  () => (props: any) => (
    <div
      data-testid={`wave-${props.wave.id}`}
      data-pin={String(props.showPin)}
      data-depth={String(props.depth)}
      data-can-expand={String(props.canExpand)}
      data-expanded={String(props.isExpanded)}
      data-loading-subwaves={String(props.isLoadingSubwaves)}
      data-unread-subwaves={String(props.hasUnreadSubwaves)}
    >
      {props.canExpand && (
        <button
          type="button"
          data-testid={`toggle-${props.wave.id}`}
          onClick={() => props.onToggleExpand?.(props.wave.id)}
        />
      )}
    </div>
  )
);

it("renders announcement, highly rated, pinned, and one filterable bottom list without double rendering", () => {
  const sentinelRef = React.createRef<HTMLDivElement>();

  render(
    <WebUnifiedWavesListWaves
      waves={baseWaves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      sentinelRef={sentinelRef}
    />
  );

  expect(screen.getByTestId("header-Waves")).toBeInTheDocument();
  expect(screen.getByTestId("header-Waves")).toHaveAttribute(
    "data-padding",
    "tw-px-4"
  );
  expect(screen.getByTestId("waves-filter-toggle")).toBeInTheDocument();
  expect(screen.getByLabelText("Announcement waves")).toBeInTheDocument();
  expect(screen.getByLabelText("Highly rated waves")).toBeInTheDocument();
  expect(screen.getByLabelText("Pinned waves")).toBeInTheDocument();
  expect(screen.getByLabelText("All recent waves list")).toBeInTheDocument();
  expect(screen.queryByLabelText("Following waves")).toBeNull();
  expect(screen.getByTestId("wave-a1")).toHaveAttribute("data-pin", "false");
  expect(screen.getByTestId("wave-h1")).toHaveAttribute("data-pin", "false");
  expect(screen.getByTestId("wave-p1")).toHaveAttribute("data-pin", "true");
  expect(screen.getByTestId("wave-f1")).toHaveAttribute("data-pin", "true");
  expect(screen.getByTestId("wave-r1")).toHaveAttribute("data-pin", "true");
  expect(
    screen.getAllByTestId(/^wave-/).map((item) => item.dataset.testid)
  ).toEqual(["wave-a1", "wave-h1", "wave-p1", "wave-f1", "wave-r1"]);
  expect(sentinelRef.current).toBeInstanceOf(HTMLDivElement);
});

it("does not give special placement to official waves", () => {
  render(
    <WebUnifiedWavesListWaves
      waves={[
        createMockMinimalWave({
          id: "o1",
          isOfficial: true,
          isPinned: true,
        }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      sentinelRef={React.createRef<HTMLDivElement>()}
    />
  );

  expect(screen.getByLabelText("Pinned waves")).toBeInTheDocument();
  expect(screen.getByTestId("wave-o1")).toHaveAttribute("data-pin", "true");
});

it("renders followed waves in the same bottom list instead of a separate section", () => {
  render(
    <WebUnifiedWavesListWaves
      waves={[
        createMockMinimalWave({ id: "p1", isPinned: true }),
        createMockMinimalWave({ id: "f1", isFollowing: true }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      sentinelRef={React.createRef<HTMLDivElement>()}
    />
  );

  expect(screen.getByText("Pinned")).toBeInTheDocument();
  expect(screen.getByText("All")).toBeInTheDocument();
  expect(screen.queryByText("Following")).toBeNull();
  expect(screen.getByLabelText("All recent waves list")).toBeInTheDocument();
  expect(screen.getByTestId("wave-f1")).toHaveAttribute("data-pin", "true");
});

it("passes pin controls through for pinned announcement waves", () => {
  render(
    <WebUnifiedWavesListWaves
      waves={[
        createMockMinimalWave({
          id: "a1",
          isPinned: true,
        }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      sentinelRef={React.createRef<HTMLDivElement>()}
    />
  );

  expect(screen.getByTestId("wave-a1")).toHaveAttribute("data-pin", "true");
});

it("expands regular subwaves and keeps child rows unpinned", () => {
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
          hasSubwaves: true,
          createdAt: 10,
          unreadDropsCount: 1,
        }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      sentinelRef={React.createRef<HTMLDivElement>()}
    />
  );

  expect(screen.getByTestId("wave-parent")).toHaveAttribute(
    "data-unread-subwaves",
    "true"
  );
  expect(screen.queryByTestId("wave-child")).toBeNull();

  fireEvent.click(screen.getByTestId("toggle-parent"));

  expect(loadSubwavesForParent).toHaveBeenCalledWith("parent");
  expect(screen.getByTestId("wave-parent")).toHaveAttribute(
    "data-expanded",
    "true"
  );
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
  expect(screen.getByTestId("wave-child")).toHaveAttribute("data-pin", "false");
});

it("hides expanded child rows immediately while the sidebar is collapsed", () => {
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

  fireEvent.click(screen.getByTestId("toggle-parent"));

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
  expect(screen.getByTestId("wave-parent")).toHaveAttribute(
    "data-expanded",
    "false"
  );
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

  expect(screen.getByTestId("wave-parent")).toHaveAttribute(
    "data-expanded",
    "true"
  );
  expect(screen.getByTestId("wave-child")).toBeInTheDocument();
});

it("keeps child rows mounted while collapse animation runs", () => {
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

    fireEvent.click(screen.getByTestId("toggle-parent"));
    expect(loadSubwavesForParent).toHaveBeenCalledWith("parent");
    expect(screen.getByTestId("wave-child")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("toggle-parent"));
    expect(loadSubwavesForParent).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("wave-child").parentElement).toHaveAttribute(
      "data-sidebar-subwave-row-state",
      "exiting"
    );

    act(() => {
      jest.advanceTimersByTime(SIDEBAR_SUBWAVE_ROW_TRANSITION_MS);
    });

    expect(screen.queryByTestId("wave-child")).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

it("keeps highly rated child rows mounted while the section exit animation runs", () => {
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
      />
    );

    fireEvent.click(screen.getByTestId("toggle-highly-rated-parent"));
    expect(loadSubwavesForParent).toHaveBeenCalledWith("highly-rated-parent");
    expect(screen.getByLabelText("Highly rated waves")).toBeInTheDocument();
    expect(screen.getByTestId("wave-highly-rated-child")).toBeInTheDocument();

    rerender(
      <WebUnifiedWavesListWaves
        waves={[highlyRatedChild]}
        onHover={jest.fn()}
        scrollContainerRef={scrollRef}
        sentinelRef={sentinelRef}
      />
    );

    expect(screen.queryByTestId("wave-highly-rated-parent")).toBeNull();
    expect(screen.getByLabelText("Highly rated waves")).toBeInTheDocument();
    expect(
      screen.getByTestId("wave-highly-rated-child").parentElement
    ).toHaveAttribute("data-sidebar-subwave-row-state", "exiting");

    act(() => {
      jest.advanceTimersByTime(SIDEBAR_SUBWAVE_ROW_TRANSITION_MS);
    });

    expect(screen.queryByTestId("wave-highly-rated-child")).toBeNull();
    expect(screen.queryByLabelText("Highly rated waves")).toBeNull();
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

  expect(screen.getByTestId("wave-parent")).toHaveAttribute(
    "data-expanded",
    "true"
  );
  expect(screen.getByTestId("wave-child")).toBeInTheDocument();
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

  expect(screen.getByTestId("wave-parent")).toHaveAttribute(
    "data-expanded",
    "false"
  );
  expect(screen.getByTestId("wave-parent")).toHaveAttribute(
    "data-loading-subwaves",
    "true"
  );
  expect(screen.queryByTestId("wave-child")).toBeNull();

  await waitFor(() => {
    expect(loadSubwavesForParent).toHaveBeenCalledWith("parent");
  });
});
