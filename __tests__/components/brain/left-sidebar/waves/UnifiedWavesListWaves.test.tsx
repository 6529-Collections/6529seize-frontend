import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { UnifiedWavesListWavesHandle } from "@/components/brain/left-sidebar/waves/UnifiedWavesListWaves";
import UnifiedWavesListWaves from "@/components/brain/left-sidebar/waves/UnifiedWavesListWaves";
import { SIDEBAR_SUBWAVE_ROW_TRANSITION_MS } from "@/hooks/useAnimatedSidebarWaveRows";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";
import { useAuth } from "@/components/auth/Auth";
import { useVirtualizedWaves } from "@/hooks/useVirtualizedWaves";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";

jest.mock("@/components/utils/switch/CommonSwitch", () => (props: any) => (
  <div data-testid="switch">
    {props.label}-{String(props.isOn)}
  </div>
));
jest.mock(
  "@/components/brain/left-sidebar/waves/BrainLeftSidebarWave",
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
jest.mock(
  "@/components/brain/left-sidebar/waves/SectionHeader",
  () => (props: any) => (
    <div
      data-testid={`header-${props.label}`}
      data-padding={props.paddingClassName}
    >
      {props.label}
      {props.rightContent}
    </div>
  )
);

jest.mock("@/hooks/useShowFollowingWaves");
jest.mock("@/components/auth/Auth");
jest.mock("@/hooks/useVirtualizedWaves");
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettingsOptional: jest.fn(),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(),
}));

const mockUseShowFollowingWaves = useShowFollowingWaves as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;
const mockUseVirtualizedWaves = useVirtualizedWaves as jest.Mock;
const mockUseSeizeSettingsOptional = useSeizeSettingsOptional as jest.Mock;
const mockUseMyStream = useMyStream as jest.Mock;
const loadSubwavesForParent = jest.fn();
const prefetchSubwavesForParent = jest.fn();

const scrollRef = {
  current: document.createElement("div"),
} as React.RefObject<HTMLDivElement>;
const container = document.createElement("div");
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
  mockUseAuth.mockReturnValue({
    connectedProfile: { handle: "alice" },
    activeProfileProxy: null,
  });
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
    containerRef: { current: container },
    sentinelRef: { current: sentinel },
    virtualItems: [
      { index: 0, start: 0, size: 62 },
      { index: 1, start: 62, size: 40 },
    ],
    totalHeight: 102,
  });
});

it("renders structure even when no waves", () => {
  const { container } = render(
    <UnifiedWavesListWaves
      waves={[]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
    />
  );
  expect(container.firstChild).not.toBeNull();
  expect(screen.getByTestId("header-All Waves")).toBeInTheDocument();
  expect(screen.getByTestId("header-All Waves")).toHaveAttribute(
    "data-padding",
    "tw-px-4"
  );
  expect(screen.getByTestId("switch")).toBeInTheDocument();
});

it("renders announcement, highly rated, pinned, following, and all waves with headers and switch", () => {
  const ref = React.createRef<UnifiedWavesListWavesHandle>();
  render(
    <UnifiedWavesListWaves
      waves={baseWaves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      ref={ref}
    />
  );
  expect(screen.getByTestId("header-All Waves")).toBeInTheDocument();
  expect(screen.getByTestId("switch")).toBeInTheDocument();
  expect(screen.getByLabelText("Announcement waves")).toBeInTheDocument();
  expect(screen.getByLabelText("Highly rated waves")).toBeInTheDocument();
  expect(screen.getByLabelText("Pinned waves")).toBeInTheDocument();
  expect(screen.getByLabelText("Following waves")).toBeInTheDocument();
  expect(
    screen.getByLabelText("All quality-ranked waves list")
  ).toBeInTheDocument();
  expect(screen.getByTestId("wave-a1")).toHaveAttribute("data-pin", "false");
  expect(screen.getByTestId("wave-h1")).toHaveAttribute("data-pin", "false");
  expect(screen.getByTestId("wave-p1")).toHaveAttribute("data-pin", "true");
  expect(screen.getByTestId("wave-f1")).toHaveAttribute("data-pin", "true");
  expect(screen.getByTestId("wave-r1")).toHaveAttribute("data-pin", "true");
  expect(
    screen.getAllByTestId(/^wave-/).map((item) => item.dataset.testid)
  ).toEqual(["wave-a1", "wave-h1", "wave-p1", "wave-f1", "wave-r1"]);
  expect(ref.current?.containerRef.current).toBe(container);
  expect(ref.current?.sentinelRef.current).toBeInstanceOf(HTMLElement);
});

it("renders direct messages as one flat latest-first list", () => {
  render(
    <UnifiedWavesListWaves
      waves={[
        createMockMinimalWave({ id: "newest", isFollowing: false }),
        createMockMinimalWave({ id: "joined-older", isFollowing: true }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      hideHeaders
      hideToggle
      hidePin
      isDirectMessage
    />
  );

  expect(
    screen.getByLabelText("Direct message conversations")
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("Following waves")).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText("All quality-ranked waves list")
  ).not.toBeInTheDocument();
  expect(
    screen.getAllByTestId(/^wave-/).map((item) => item.dataset.testid)
  ).toEqual(["wave-newest", "wave-joined-older"]);
});

it("does not give special placement to official waves", () => {
  render(
    <UnifiedWavesListWaves
      waves={[
        createMockMinimalWave({
          id: "o1",
          isOfficial: true,
          isPinned: true,
        }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
    />
  );

  expect(screen.getByLabelText("Pinned waves")).toBeInTheDocument();
  expect(screen.getByTestId("wave-o1")).toHaveAttribute("data-pin", "true");
});

it("labels following waves when they are the virtualized section", () => {
  render(
    <UnifiedWavesListWaves
      waves={[
        createMockMinimalWave({ id: "p1", isPinned: true }),
        createMockMinimalWave({ id: "f1", isFollowing: true }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
    />
  );

  expect(screen.getByText("Pinned")).toBeInTheDocument();
  expect(screen.getByText("Following")).toBeInTheDocument();
  expect(screen.getByLabelText("Following waves list")).toBeInTheDocument();
  expect(screen.getByTestId("wave-f1")).toHaveAttribute("data-pin", "true");
});

it("passes pin controls through for pinned announcement waves", () => {
  render(
    <UnifiedWavesListWaves
      waves={[
        createMockMinimalWave({
          id: "a1",
          isPinned: true,
        }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
    />
  );

  expect(screen.getByTestId("wave-a1")).toHaveAttribute("data-pin", "true");
});

it("respects hide options and does not render toggle when not connected", () => {
  mockUseAuth.mockReturnValue({
    connectedProfile: null,
    activeProfileProxy: null,
  });
  render(
    <UnifiedWavesListWaves
      waves={baseWaves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
      hideHeaders
      hidePin
      hideToggle
    />
  );
  expect(screen.queryByTestId("header-Pinned")).toBeNull();
  expect(screen.queryByTestId("header-All Waves")).toBeNull();
  expect(screen.queryByTestId("switch")).toBeNull();
  expect(screen.getByTestId("wave-a1")).toHaveAttribute("data-pin", "false");
  expect(screen.getByTestId("wave-h1")).toHaveAttribute("data-pin", "false");
  expect(screen.queryByTestId("wave-p1")).toBeNull();
  expect(screen.getByTestId("wave-r1")).toHaveAttribute("data-pin", "false");
});

it("expands regular subwaves and keeps child rows unpinned", () => {
  render(
    <UnifiedWavesListWaves
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

it("keeps child rows mounted while collapse animation runs", () => {
  jest.useFakeTimers();

  try {
    render(
      <UnifiedWavesListWaves
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
    <UnifiedWavesListWaves
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
    <UnifiedWavesListWaves
      waves={[
        createMockMinimalWave({
          id: "parent",
          hasSubwaves: true,
        }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
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
