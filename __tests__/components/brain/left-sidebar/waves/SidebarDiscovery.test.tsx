import { fireEvent, render, screen } from "@testing-library/react";
import { SidebarDiscovery } from "@/components/brain/left-sidebar/waves/SidebarDiscovery";
const mockSetActive = jest.fn();
const mockRefetch = jest.fn();
let mockVotes: any;
jest.mock("@/hooks/useActiveWaveVotes", () => ({
  useActiveWaveVotes: () => mockVotes,
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({ activeWave: { set: mockSetActive } }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null }),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/components/waves/WavePicture", () => ({
  __esModule: true,
  default: () => <span />,
}));
const renderDiscovery = () =>
  render(<SidebarDiscovery previewItems={[]} isTouchPreview={false} />);
beforeEach(() => {
  sessionStorage.clear();
  jest.clearAllMocks();
  mockVotes = {
    data: {
      pages: [
        {
          count: 3,
          data: [
            {
              wave: { id: "rare", name: "Rare Pepe acquisition", pfp: null },
              voting_ends_at: null,
              next_decision_at: null,
            },
          ],
        },
      ],
    },
    isPending: false,
    isError: false,
    refetch: mockRefetch,
  };
});
it("shows active votes by default and retains the count when collapsed or browsing recommendations", () => {
  renderDiscovery();
  expect(screen.getByRole("tab", { name: "Active Votes 3" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(screen.getByText("Rare Pepe acquisition")).toBeVisible();
  expect(screen.getByText("Community decisions powered by TDH.")).toBeVisible();
  expect(
    screen.getByRole("link", { name: "View all active votes" })
  ).toHaveAttribute("href", "/discover?view=active-votes");
  fireEvent.click(
    screen.getByRole("button", { name: "Collapse wave discovery" })
  );
  expect(
    screen.queryByRole("link", { name: /Rare Pepe acquisition/ })
  ).toBeNull();
  expect(screen.queryByRole("tabpanel")).toBeNull();
  expect(screen.getByRole("tab", { name: "Active Votes 3" })).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: "Worth a Look" }));
  expect(
    screen.getByRole("button", { name: "Collapse wave discovery" })
  ).toHaveAttribute("aria-expanded", "true");
  expect(
    screen.getByRole("link", { name: "View all recommendations" })
  ).toHaveAttribute("href", "/discover?view=recommendations&sort=QUALITY");
});
it("uses recommendations at zero and allows inspecting the empty active tab", () => {
  mockVotes.data.pages[0] = { count: 0, data: [] };
  renderDiscovery();
  expect(screen.getByRole("tab", { name: "Worth a Look" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  fireEvent.click(screen.getByRole("tab", { name: "Active Votes 0" }));
  expect(screen.getByText("No active TDH votes right now.")).toBeVisible();
  expect(
    screen.queryByRole("link", { name: "View all active votes" })
  ).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Browse recommendations" })
  );
  expect(screen.getByRole("tab", { name: "Worth a Look" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(screen.getByRole("tab", { name: "Worth a Look" })).toHaveFocus();
  expect(
    screen.getByText("Highly rated waves you don’t follow.")
  ).toBeVisible();
});
it("remembers the selected tab and collapse state after navigation", () => {
  const first = renderDiscovery();
  fireEvent.click(screen.getByRole("tab", { name: "Worth a Look" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Collapse wave discovery" })
  );
  first.unmount();
  renderDiscovery();
  expect(screen.getByRole("tab", { name: "Worth a Look" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(
    screen.getByRole("button", { name: "Expand wave discovery" })
  ).toHaveAttribute("aria-expanded", "false");
});
it("offers a retry instead of treating a failed request as zero votes", () => {
  mockVotes = {
    data: undefined,
    isPending: false,
    isError: true,
    refetch: mockRefetch,
  };
  renderDiscovery();
  expect(screen.getByRole("alert")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(mockRefetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("tab", { name: "Active Votes 0" })).toBeNull();
});
it("opens a vote in the existing wave navigation", () => {
  renderDiscovery();
  fireEvent.click(screen.getByRole("link", { name: /Rare Pepe acquisition/ }));
  expect(mockSetActive).toHaveBeenCalledWith("rare", {
    isDirectMessage: false,
  });
});

it("keeps an explicitly selected Active Votes tab open when its last vote ends", () => {
  const { rerender } = renderDiscovery();
  fireEvent.click(screen.getByRole("tab", { name: "Active Votes 3" }));
  mockVotes.data.pages[0] = { count: 0, data: [] };
  rerender(<SidebarDiscovery previewItems={[]} isTouchPreview={false} />);
  expect(screen.getByRole("tab", { name: "Active Votes 0" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(screen.getByText("No active TDH votes right now.")).toBeVisible();
});

it.each(["loading", "error"])(
  "does not mistake %s for an empty votes result",
  (state) => {
    sessionStorage.setItem("wave-discovery-tab", "active-votes");
    mockVotes = {
      data: state === "error" ? { pages: [{ count: 0, data: [] }] } : undefined,
      isPending: state === "loading",
      isError: state === "error",
      refetch: mockRefetch,
    };
    renderDiscovery();
    expect(screen.queryByText("No active TDH votes right now.")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Browse recommendations" })
    ).toBeNull();
    expect(
      screen.getByRole(state === "error" ? "alert" : "status")
    ).toBeVisible();
  }
);

it("keeps inactive panels mounted for layout but removes their controls from accessibility and focus", () => {
  renderDiscovery();
  const active = screen.getByRole("tab", { name: "Active Votes 3" });
  fireEvent.keyDown(active, { key: "ArrowRight" });
  const recommendations = screen.getByRole("tab", { name: "Worth a Look" });
  expect(recommendations).toHaveFocus();
  expect(recommendations).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveAttribute(
    "aria-labelledby",
    recommendations.id
  );
  expect(
    screen.queryByRole("link", { name: /Rare Pepe acquisition/ })
  ).toBeNull();
  const inactive = document.getElementById(
    active.getAttribute("aria-controls")!
  );
  expect(inactive).toHaveAttribute("inert");
  expect(inactive).toHaveAttribute("tabindex", "-1");
  expect(screen.getByRole("tabpanel")).toHaveAttribute("tabindex", "0");
  expect(inactive).toHaveTextContent("Rare Pepe acquisition");
  fireEvent.keyDown(recommendations, { key: "Home" });
  expect(active).toHaveFocus();
  expect(
    screen.getByRole("link", { name: /Rare Pepe acquisition/ })
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Collapse wave discovery" })
  );
  expect(screen.queryByRole("tabpanel")).toBeNull();
});

it("wraps tab keyboard navigation in both directions and supports End", () => {
  renderDiscovery();
  const active = screen.getByRole("tab", { name: "Active Votes 3" });
  const recommendations = screen.getByRole("tab", { name: "Worth a Look" });
  expect(active).toHaveAttribute("tabindex", "0");
  expect(recommendations).toHaveAttribute("tabindex", "-1");
  fireEvent.keyDown(active, { key: "ArrowLeft" });
  expect(recommendations).toHaveFocus();
  fireEvent.keyDown(recommendations, { key: "ArrowRight" });
  expect(active).toHaveFocus();
  fireEvent.keyDown(active, { key: "End" });
  expect(recommendations).toHaveFocus();
  const panel = screen.getByRole("tabpanel");
  fireEvent.click(
    screen.getByRole("button", { name: "Collapse wave discovery" })
  );
  expect(panel).toHaveAttribute("tabindex", "-1");
});
