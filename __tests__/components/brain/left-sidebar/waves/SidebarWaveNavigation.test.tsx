import { fireEvent, render, screen } from "@testing-library/react";
import {
  SidebarWaveNavigationControls,
  SidebarWaveSearchResults,
} from "@/components/brain/left-sidebar/waves/SidebarWaveNavigation";
import type { SidebarWaveNavigation } from "@/hooks/useSidebarWaveNavigation";
import { mapApiWaveOverviewToSidebarWave } from "@/services/api/waves-v2-api";
import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";

const mockSet = jest.fn();
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({ activeWave: { set: mockSet } }),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/components/waves/WavePicture", () => ({
  __esModule: true,
  default: ({ picture }: { picture: string }) => (
    <span data-testid="wave-picture">{picture}</span>
  ),
}));
const wave = mapApiWaveOverviewToSidebarWave({
  id: "rare",
  name: "Rare Pepe acquisition",
  created_at: 123,
  creator: { handle: "DarrenSRS" },
  pfp: "https://example.com/pepe.png",
  has_competition: true,
  is_dm_wave: false,
  has_subwaves: false,
  description_drop: { contents: null, media: [] },
  total_drops_count: 4,
  is_private: false,
  last_drop_time: 456,
  context_profile_context: { pinned: true, subscribed: true, muted: false },
} as ApiWaveOverview);
function navigation(
  overrides: Partial<SidebarWaveNavigation> = {}
): SidebarWaveNavigation {
  return {
    collection: "pinned",
    setCollection: jest.fn(),
    canUseCollections: true,
    queryText: "rare pepe",
    queryEnabled: true,
    searching: true,
    setQueryText: jest.fn(),
    resultWaves: [wave],
    results: {
      isPending: false,
      isError: false,
      hasNextPage: false,
      refetch: jest.fn(),
    },
    ...overrides,
  } as SidebarWaveNavigation;
}
it("renders the SEARCH response's creator, picture and pin/follow metadata", () => {
  render(<SidebarWaveSearchResults navigation={navigation()} />);
  expect(screen.getByText("by DarrenSRS")).toBeVisible();
  expect(screen.getByText("Pinned")).toBeVisible();
  expect(screen.getByText("Joined")).toBeVisible();
  expect(screen.getByTestId("wave-picture")).toHaveTextContent(
    "https://example.com/pepe.png"
  );
  fireEvent.click(screen.getByRole("link", { name: /Rare Pepe acquisition/ }));
  expect(mockSet).toHaveBeenCalledWith("rare", { isDirectMessage: false });
});
it("keeps one live status node through debounce, results, empty and failure", () => {
  const state = navigation();
  const { rerender } = render(
    <SidebarWaveSearchResults navigation={{ ...state, queryEnabled: false }} />
  );
  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("aria-live", "polite");
  rerender(<SidebarWaveSearchResults navigation={state} />);
  expect(screen.getByRole("status")).toBe(status);
  expect(status).toHaveTextContent("Waves shown: 1");
  rerender(
    <SidebarWaveSearchResults navigation={{ ...state, resultWaves: [] }} />
  );
  expect(screen.getByRole("status")).toBe(status);
  expect(status).toHaveTextContent(/No waves/);
  rerender(
    <SidebarWaveSearchResults
      navigation={{ ...state, results: { ...state.results, isError: true } }}
    />
  );
  expect(screen.getByRole("status")).toBe(status);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(state.results.refetch).toHaveBeenCalled();
});
it("exposes the selected collection through both semantics and an underline", () => {
  render(
    <SidebarWaveNavigationControls
      navigation={navigation({ queryText: "", searching: false })}
    />
  );
  expect(screen.getByRole("button", { name: "Pinned" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  expect(screen.getByRole("button", { name: "Pinned" })).toHaveClass(
    "tw-underline"
  );
});
