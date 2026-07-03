import React from "react";
import userEvent from "@testing-library/user-event";
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
import { SIDEBAR_SUBWAVE_ROW_EXIT_CLEANUP_MS } from "@/hooks/useAnimatedSidebarWaveRows";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";
import { useAuth } from "@/components/auth/Auth";
import { useVirtualizedWaves } from "@/hooks/useVirtualizedWaves";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

let mockDeviceInfo = { isApp: false, hasTouchScreen: false };

jest.mock(
  "@/components/brain/left-sidebar/waves/WavesFilterToggle",
  () => () => <div data-testid="waves-filter-toggle" />
);
jest.mock(
  "@/components/brain/left-sidebar/waves/BrainLeftSidebarWave",
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
jest.mock(
  "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWave/subcomponents/WaveAvatar",
  () => ({
    WaveAvatar: (props: any) => (
      <div
        data-testid={`preview-avatar-${props.wave.id}`}
        data-drop-badge-placement={props.dropBadgePlacement}
        data-is-drop-wave={String(props.isDropWave)}
        data-show-new-drops-badge={String(props.showNewDropsBadge)}
        data-show-unread-drops-badge={String(props.showUnreadDropsBadge)}
        data-size={props.size ?? "default"}
      />
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
  default: () => mockDeviceInfo,
}));
jest.mock("react-tooltip", () => ({
  Tooltip: (props: any) => (
    <div
      data-testid={`tooltip-${props.id}`}
      data-open-on-click={String(props.openOnClick)}
    />
  ),
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

const flushAnimatedSidebarRows = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

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
  mockDeviceInfo = { isApp: false, hasTouchScreen: false };
  mockUseShowFollowingWaves.mockReturnValue([false, jest.fn()]);
  mockUseAuth.mockReturnValue({
    connectedProfile: { handle: "alice" },
    activeProfileProxy: null,
  });
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
    containerRef: { current: container },
    sentinelRef: { current: sentinel },
    virtualItems: [
      { index: 0, start: 0, size: 62 },
      { index: 1, start: 62, size: 40 },
      { index: 2, start: 102, size: 1 },
    ],
    totalHeight: 103,
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
  expect(screen.getByTestId("waves-filter-toggle")).toBeInTheDocument();
});

it("calculates how many highly rated preview avatars fit", () => {
  expect(getFittingPreviewCount({ itemCount: 0, width: 220 })).toBe(0);
  expect(getFittingPreviewCount({ itemCount: 10, width: 0 })).toBe(10);
  expect(getFittingPreviewCount({ itemCount: 10, width: 32 })).toBe(1);
  expect(getFittingPreviewCount({ itemCount: 10, width: 70 })).toBe(2);
  expect(getFittingPreviewCount({ itemCount: 12, width: 1000 })).toBe(10);
  expect(
    getFittingPreviewCount({
      isTouchPreview: true,
      itemCount: 10,
      width: 220,
    })
  ).toBe(4);
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
      activeWaveLookupWaves: [activeWave],
      activeParentWaveId: null,
      activeWaveId: activeWave.id,
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

it("does not recover known active waves into the highly rated preview source", () => {
  const highlyRatedWaves = [
    createMockMinimalWave({
      id: "h1",
      sidebarSection: "highly-rated",
    }),
  ];
  const activePinnedWave = createMockMinimalWave({
    id: "active-pinned",
    isPinned: true,
  });
  const activeFollowingWave = createMockMinimalWave({
    id: "active-following",
    isFollowing: true,
  });
  const activeFollowedSubwaveContainer = createMockMinimalWave({
    id: "active-followed-subwave-container",
    isFollowedSubwaveContainer: true,
  });

  expect(
    getHighlyRatedPreviewWaves({
      activeWaveLookupWaves: [activePinnedWave],
      activeParentWaveId: null,
      activeWaveId: activePinnedWave.id,
      highlyRatedWaves,
    }).map((wave) => wave.id)
  ).toEqual(["h1"]);
  expect(
    getHighlyRatedPreviewWaves({
      activeWaveLookupWaves: [activeFollowingWave],
      activeParentWaveId: null,
      activeWaveId: activeFollowingWave.id,
      highlyRatedWaves,
    }).map((wave) => wave.id)
  ).toEqual(["h1"]);
  expect(
    getHighlyRatedPreviewWaves({
      activeWaveLookupWaves: [activeFollowedSubwaveContainer],
      activeParentWaveId: null,
      activeWaveId: activeFollowedSubwaveContainer.id,
      highlyRatedWaves,
    }).map((wave) => wave.id)
  ).toEqual(["h1"]);
});

it("prefers the active wave over its parent in the preview recovery pool", () => {
  const highlyRatedWaves = Array.from({ length: 10 }, (_, index) =>
    createMockMinimalWave({
      id: `h${index + 1}`,
      sidebarSection: "highly-rated",
    })
  );
  const parentWave = createMockMinimalWave({ id: "parent" });
  const activeWave = createMockMinimalWave({ id: "child" });

  expect(
    getHighlyRatedPreviewWaves({
      activeWaveLookupWaves: [parentWave, activeWave],
      activeParentWaveId: parentWave.id,
      activeWaveId: activeWave.id,
      highlyRatedWaves,
    }).at(-1)?.id
  ).toBe(activeWave.id);
});

it("renders announcement, highly rated preview, pinned, and one filterable bottom list", () => {
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
  expect(screen.getByTestId("waves-filter-toggle")).toBeInTheDocument();
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

it("uses highly rated preview score semantics instead of unread badges", () => {
  const latestDropTimestamp = Date.now() - 60 * 60 * 1000;

  render(
    <UnifiedWavesListWaves
      waves={[
        createMockMinimalWave({
          id: "h-score",
          name: "Scored Discovery",
          type: ApiWaveType.Rank,
          sidebarSection: "highly-rated",
          unreadDropsCount: 24,
          newDropsCount: {
            count: 99,
            latestDropTimestamp,
            firstUnreadSerialNo: 42,
          },
          waveScore: {
            visibility_score: 93,
            quality_score: 91,
            hotness_score: 97,
            rep_sort_score: 73,
          } as any,
        }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
    />
  );

  expect(
    screen.getByRole("link", { name: "Open Scored Discovery, score 93" })
  ).toBeInTheDocument();
  const scoreDetailsButton = screen.getByRole("button", {
    name: "Open Scored Discovery score details, score 93",
  });
  const scoreBadgeText = screen.getByText("93", { selector: "text" });
  expect(scoreBadgeText).toBeInTheDocument();
  expect(scoreBadgeText.closest("button")).toBe(scoreDetailsButton);
  expect(scoreDetailsButton).toHaveClass("-tw-bottom-1");
  expect(scoreDetailsButton).toHaveClass("-tw-right-1.5");
  expect(scoreDetailsButton).toHaveClass("tw-h-6");
  expect(scoreDetailsButton).toHaveClass("tw-w-7");
  expect(scoreBadgeText.closest("svg")).toHaveClass("tw-h-5");
  expect(scoreBadgeText.closest("svg")).toHaveClass("tw-w-6");
  fireEvent.click(
    screen.getByRole("link", { name: "Open Scored Discovery, score 93" })
  );
  expect(
    screen.queryByRole("dialog", { name: "Wave score details" })
  ).not.toBeInTheDocument();
  fireEvent.click(scoreDetailsButton);
  expect(
    screen.getByRole("dialog", { name: "Wave score details" })
  ).toBeInTheDocument();
  expect(screen.getByText("Scored Discovery")).toBeInTheDocument();
  expect(screen.getByText("Last message")).toBeInTheDocument();
  expect(screen.getByText("1h")).toBeInTheDocument();
  expect(screen.getByText("Quality")).toBeInTheDocument();
  expect(screen.getByText("Hotness")).toBeInTheDocument();
  expect(screen.getByText("Wave REP")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /new messages/ })).toBeNull();
  expect(screen.getByTestId("preview-avatar-h-score")).toHaveAttribute(
    "data-drop-badge-placement",
    "bottom-left"
  );
  expect(screen.getByTestId("preview-avatar-h-score")).toHaveAttribute(
    "data-show-new-drops-badge",
    "false"
  );
  expect(screen.getByTestId("preview-avatar-h-score")).toHaveAttribute(
    "data-show-unread-drops-badge",
    "false"
  );
  expect(screen.getByTestId("preview-avatar-h-score")).toHaveAttribute(
    "data-is-drop-wave",
    "true"
  );
});

it("uses no-message copy in the combined highly rated score card", () => {
  render(
    <UnifiedWavesListWaves
      waves={[
        createMockMinimalWave({
          id: "h-score-empty",
          name: "Quiet Discovery",
          type: ApiWaveType.Rank,
          sidebarSection: "highly-rated",
          waveScore: {
            visibility_score: 88,
            quality_score: 90,
            hotness_score: 70,
            rep_sort_score: 64,
          } as any,
        }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
    />
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "Open Quiet Discovery score details, score 88",
    })
  );
  expect(
    screen.getByRole("dialog", { name: "Wave score details" })
  ).toBeInTheDocument();
  expect(screen.getByText("Quiet Discovery")).toBeInTheDocument();
  expect(screen.getByText("No messages yet")).toBeInTheDocument();
});

it("opens the combined highly rated score card from keyboard score activation", async () => {
  const user = userEvent.setup();
  render(
    <UnifiedWavesListWaves
      waves={[
        createMockMinimalWave({
          id: "h-score-keyboard",
          name: "Keyboard Discovery",
          type: ApiWaveType.Rank,
          sidebarSection: "highly-rated",
          waveScore: {
            visibility_score: 86,
            quality_score: 90,
            hotness_score: 70,
            rep_sort_score: 64,
          } as any,
        }),
      ]}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
    />
  );

  screen
    .getByRole("button", {
      name: "Open Keyboard Discovery score details, score 86",
    })
    .focus();
  await user.keyboard("{Enter}");

  expect(
    await screen.findByRole("dialog", { name: "Wave score details" })
  ).toBeInTheDocument();
  expect(screen.getByText("Keyboard Discovery")).toBeInTheDocument();
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
  expect(screen.queryByLabelText("Worth checking out waves")).toBeNull();
  expect(screen.queryByTestId("wave-h1")).toBeNull();
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

it("renders followed waves in the same bottom list instead of a separate section", () => {
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
  expect(screen.getByText("All")).toBeInTheDocument();
  expect(screen.queryByText("Following")).toBeNull();
  expect(screen.getByLabelText("All recent waves list")).toBeInTheDocument();
  expect(screen.getByTestId("wave-f1")).toHaveAttribute("data-pin", "true");
});

it("keeps the worth checking out info tooltip available on touch devices", () => {
  mockDeviceInfo = { isApp: false, hasTouchScreen: true };

  render(
    <UnifiedWavesListWaves
      waves={baseWaves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
    />
  );

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

it("hides the worth checking out info tooltip when no profile is connected", () => {
  mockUseAuth.mockReturnValue({
    connectedProfile: null,
    activeProfileProxy: null,
  });

  render(
    <UnifiedWavesListWaves
      waves={baseWaves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
    />
  );

  expect(screen.getByText("Worth Checking Out")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", {
      name: "Highly rated waves you don’t follow yet.",
    })
  ).not.toBeInTheDocument();
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
  expect(screen.queryByTestId("waves-filter-toggle")).toBeNull();
  expect(screen.getByTestId("wave-a1")).toHaveAttribute("data-pin", "false");
  expect(screen.getByTestId("wave-h1")).toHaveAttribute("data-pin", "false");
  expect(screen.queryByTestId("wave-p1")).toBeNull();
  expect(screen.getByTestId("wave-r1")).toHaveAttribute("data-pin", "false");
});

it("expands regular subwaves and keeps child rows unpinned", async () => {
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

it("keeps child rows mounted while collapse animation runs", async () => {
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

  expect(
    screen.getByRole("button", {
      name: "Hide Mock Wave subwaves",
    })
  ).toHaveAttribute("aria-expanded", "true");
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
