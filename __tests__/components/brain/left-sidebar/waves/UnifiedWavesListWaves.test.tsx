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
import {
  getFittingPreviewCount,
  getHighlyRatedPreviewWaves,
  getVisibleHighlyRatedPreviewItems,
  type HighlyRatedWavePreviewItem,
} from "@/components/brain/left-sidebar/waves/HighlyRatedWavesToggle";
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
  "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWave/subcomponents/WaveAvatar",
  () => ({
    WaveAvatar: (props: { readonly wave: { readonly id: string } }) => (
      <div data-testid={`preview-avatar-${props.wave.id}`} />
    ),
  })
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
jest.mock("@/hooks/usePrefetchWaveData", () => ({
  usePrefetchWaveData: () => jest.fn(),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false, hasTouchScreen: false }),
}));
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
  createMockMinimalWave({
    id: "h1",
    name: "Highly Rated One",
    sidebarSection: "highly-rated",
  }),
  createMockMinimalWave({ id: "p1", isPinned: true }),
  createMockMinimalWave({ id: "f1", isFollowing: true }),
  createMockMinimalWave({ id: "r1", isPinned: false }),
];

const createPreviewItem = ({
  id,
  isActive = false,
}: {
  readonly id: string;
  readonly isActive?: boolean;
}): HighlyRatedWavePreviewItem => ({
  wave: createMockMinimalWave({ id, sidebarSection: "highly-rated" }),
  href: `/waves/${id}`,
  isActive,
  onClick: jest.fn(),
});

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

it("calculates how many highly rated preview avatars fit", () => {
  expect(getFittingPreviewCount({ itemCount: 0, width: 220 })).toBe(0);
  expect(getFittingPreviewCount({ itemCount: 10, width: 0 })).toBe(10);
  expect(getFittingPreviewCount({ itemCount: 10, width: 32 })).toBe(1);
  expect(getFittingPreviewCount({ itemCount: 10, width: 70 })).toBe(2);
  expect(getFittingPreviewCount({ itemCount: 12, width: 1000 })).toBe(10);
});

it("keeps the active highly rated preview visible within the capped strip", () => {
  const previewItems = Array.from({ length: 11 }, (_, index) =>
    createPreviewItem({
      id: `h${index + 1}`,
      isActive: index === 10,
    })
  );

  expect(
    getVisibleHighlyRatedPreviewItems({
      previewItems,
      visiblePreviewCount: 10,
    }).map((item) => item.wave.id)
  ).toEqual(["h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8", "h9", "h11"]);
  expect(
    getVisibleHighlyRatedPreviewItems({
      previewItems,
      visiblePreviewCount: 4,
    }).map((item) => item.wave.id)
  ).toEqual(["h1", "h2", "h3", "h11"]);
});

it("preserves promoted active highly rated preview ordering when fewer avatars fit", () => {
  const previewItems = Array.from({ length: 12 }, (_, index) =>
    createPreviewItem({
      id: `h${index + 1}`,
      isActive: index === 11,
    })
  );

  expect(
    getVisibleHighlyRatedPreviewItems({
      previewItems,
      visiblePreviewCount: 4,
    }).map((item) => item.wave.id)
  ).toEqual(["h1", "h2", "h3", "h12"]);
});

it("adds the active loaded all-wave to the highly rated preview source", () => {
  const highlyRatedWaves = Array.from({ length: 10 }, (_, index) =>
    createMockMinimalWave({
      id: `h${index + 1}`,
      sidebarSection: "highly-rated",
    })
  );
  const activeWave = createMockMinimalWave({
    id: "r11",
    name: "Active Ranked Eleven",
  });

  expect(
    getHighlyRatedPreviewWaves({
      activeParentWaveId: null,
      activeWaveId: activeWave.id,
      allWaves: [activeWave],
      highlyRatedWaves,
    }).map((wave) => wave.id)
  ).toEqual([
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "h7",
    "h8",
    "h9",
    "h10",
    "r11",
  ]);
});

it("renders fitting highly rated waves as an unboxed preview strip without an expand control", () => {
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
  expect(screen.getByText("Highly Rated")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", {
      name: "Expand Highly Rated, 1 wave",
    })
  ).toBeNull();
  expect(
    screen.getByRole("link", { name: "Open Highly Rated One" })
  ).toBeInTheDocument();
  expect(screen.getByTestId("preview-avatar-h1")).toBeInTheDocument();
  expect(screen.queryByLabelText("Highly rated waves")).toBeNull();
  expect(screen.getByLabelText("Pinned waves")).toBeInTheDocument();
  expect(screen.getByLabelText("Following waves")).toBeInTheDocument();
  expect(
    screen.getByLabelText("All quality-ranked waves list")
  ).toBeInTheDocument();
  expect(screen.getByTestId("wave-a1")).toHaveAttribute("data-pin", "false");
  expect(screen.queryByTestId("wave-h1")).toBeNull();
  expect(screen.getByTestId("wave-p1")).toHaveAttribute("data-pin", "true");
  expect(screen.getByTestId("wave-f1")).toHaveAttribute("data-pin", "true");
  expect(screen.getByTestId("wave-r1")).toHaveAttribute("data-pin", "true");
  expect(
    screen.getAllByTestId(/^wave-/).map((item) => item.dataset.testid)
  ).toEqual(["wave-a1", "wave-p1", "wave-f1", "wave-r1"]);
  expect(ref.current?.containerRef.current).toBe(container);
  expect(ref.current?.sentinelRef.current).toBeInstanceOf(HTMLElement);
});

it("caps highly rated previews at ten without rendering an overflow control", () => {
  const waves = Array.from({ length: 11 }, (_, index) =>
    createMockMinimalWave({
      id: `h${index + 1}`,
      name: `Highly Rated ${index + 1}`,
      sidebarSection: "highly-rated",
    })
  );

  render(
    <UnifiedWavesListWaves
      waves={waves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
    />
  );

  expect(screen.getByTestId("preview-avatar-h1")).toBeInTheDocument();
  expect(screen.getByTestId("preview-avatar-h10")).toBeInTheDocument();
  expect(screen.queryByTestId("preview-avatar-h11")).toBeNull();
  expect(
    screen.queryByRole("button", {
      name: /more Highly Rated/,
    })
  ).toBeNull();
  expect(screen.queryByLabelText("Highly rated waves")).toBeNull();
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

  render(
    <UnifiedWavesListWaves
      waves={waves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
    />
  );

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

  render(
    <UnifiedWavesListWaves
      waves={baseWaves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
    />
  );

  expect(
    screen.getByRole("link", { name: "Open Highly Rated One" })
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("Highly rated waves")).toBeNull();
  expect(screen.queryByTestId("wave-h1")).toBeNull();
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
