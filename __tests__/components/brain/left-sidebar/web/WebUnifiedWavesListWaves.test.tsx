import React from "react";
import { render, screen } from "@testing-library/react";
import type { WebUnifiedWavesListWavesHandle } from "@/components/brain/left-sidebar/web/WebUnifiedWavesListWaves";
import WebUnifiedWavesListWaves from "@/components/brain/left-sidebar/web/WebUnifiedWavesListWaves";
import { useVirtualizedWaves } from "@/hooks/useVirtualizedWaves";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
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
jest.mock(
  "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWave",
  () => (props: any) => (
    <div
      data-testid={`wave-${props.wave.id}`}
      data-pin={String(props.showPin)}
    />
  )
);
jest.mock("react-tooltip", () => ({
  Tooltip: () => null,
}));
jest.mock("@/hooks/useVirtualizedWaves");
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettingsOptional: jest.fn(),
}));

const mockUseVirtualizedWaves = useVirtualizedWaves as jest.Mock;
const mockUseSeizeSettingsOptional = useSeizeSettingsOptional as jest.Mock;

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

it("renders announcement, official, pinned, and regular sections without double rendering", () => {
  const ref = React.createRef<WebUnifiedWavesListWavesHandle>();

  render(
    <WebUnifiedWavesListWaves
      ref={ref}
      waves={baseWaves}
      onHover={jest.fn()}
      scrollContainerRef={scrollRef}
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
  expect(ref.current?.sentinelRef.current).toBe(sentinel);
});

it("passes pin controls through for pinned official waves", () => {
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
    />
  );

  expect(screen.getByTestId("wave-o1")).toHaveAttribute("data-pin", "true");
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
    />
  );

  expect(screen.getByTestId("wave-a1")).toHaveAttribute("data-pin", "true");
});
