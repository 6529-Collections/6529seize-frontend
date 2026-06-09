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
  useAuth: () => ({ connectedProfile: { handle: "alice" } }),
}));
jest.mock(
  "@/components/brain/left-sidebar/waves/SectionHeader",
  () => (props: any) => (
    <div data-testid={`header-${props.label}`}>{props.label}</div>
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
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettingsOptional: jest.fn(),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(),
}));

const mockUseVirtualizedWaves = useVirtualizedWaves as jest.Mock;
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
  createMockMinimalWave({ id: "o1", isOfficial: true }),
  createMockMinimalWave({ id: "p1", isPinned: true }),
  createMockMinimalWave({ id: "r1", isPinned: false }),
];

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockUseMyStream.mockReturnValue({
    activeWave: { id: null, set: jest.fn() },
    waves: {
      loadSubwavesForParent,
      prefetchSubwavesForParent,
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
    ],
    totalHeight: 102,
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

it("renders announcement, official, pinned, and regular sections without double rendering", () => {
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
  expect(screen.getByTestId("waves-filter-toggle")).toBeInTheDocument();
  expect(screen.getByLabelText("Announcement waves")).toBeInTheDocument();
  expect(screen.getByLabelText("Official waves")).toBeInTheDocument();
  expect(screen.getByLabelText("Pinned waves")).toBeInTheDocument();
  expect(screen.getByTestId("wave-a1")).toHaveAttribute("data-pin", "false");
  expect(screen.getByTestId("wave-o1")).toHaveAttribute("data-pin", "false");
  expect(screen.getByTestId("wave-p1")).toHaveAttribute("data-pin", "true");
  expect(screen.getByTestId("wave-r1")).toHaveAttribute("data-pin", "true");
  expect(
    screen.getAllByTestId(/^wave-/).map((item) => item.dataset.testid)
  ).toEqual(["wave-a1", "wave-o1", "wave-p1", "wave-r1"]);
  expect(sentinelRef.current).toBeInstanceOf(HTMLDivElement);
});

it("hides pin controls for pinned official waves", () => {
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

  expect(screen.getByTestId("wave-o1")).toHaveAttribute("data-pin", "false");
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

it("auto-expands the parent for the active subwave", () => {
  mockUseMyStream.mockReturnValue({
    activeWave: { id: "child", set: jest.fn() },
    waves: {
      loadSubwavesForParent,
      prefetchSubwavesForParent,
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

it("loads and expands a direct active subwave parent before the child row is available", async () => {
  mockUseMyStream.mockReturnValue({
    activeWave: { id: "child", parentWaveId: "parent", set: jest.fn() },
    waves: {
      loadSubwavesForParent,
      prefetchSubwavesForParent,
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
    "true"
  );
  expect(screen.queryByTestId("wave-child")).toBeNull();

  await waitFor(() => {
    expect(loadSubwavesForParent).toHaveBeenCalledWith("parent");
  });
});
