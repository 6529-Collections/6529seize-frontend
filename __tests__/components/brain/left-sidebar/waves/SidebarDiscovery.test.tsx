import React from "react";
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
  expect(
    screen.getByRole("button", { name: "Active Votes 3" })
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText("Rare Pepe acquisition")).toBeVisible();
  expect(
    screen.getByText(
      "Ongoing votes that use TDH. Each wave sets its own voting rules."
    )
  ).toBeVisible();
  expect(
    screen.getByRole("link", { name: "View all active votes" })
  ).toHaveAttribute("href", "/discover?view=active-votes");
  fireEvent.click(
    screen.getByRole("button", { name: "Collapse wave discovery" })
  );
  expect(screen.getByText("Rare Pepe acquisition")).not.toBeVisible();
  expect(
    screen.getByText(
      "Ongoing votes that use TDH. Each wave sets its own voting rules."
    )
  ).not.toBeVisible();
  expect(screen.getByRole("button", { name: "Active Votes 3" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Worth Checking Out" }));
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
  expect(
    screen.getByRole("button", { name: "Worth Checking Out" })
  ).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Active Votes 0" }));
  expect(screen.getByText("No active TDH votes right now.")).toBeVisible();
  expect(
    screen.queryByRole("link", { name: "View all active votes" })
  ).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Browse Worth Checking Out" })
  );
  expect(
    screen.getByRole("button", { name: "Worth Checking Out" })
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("button", { name: "Worth Checking Out" })
  ).toHaveFocus();
  expect(
    screen.getByText("Highly rated waves you don’t follow yet.")
  ).toBeVisible();
});
it("remembers the selected tab and collapse state after navigation", () => {
  const first = renderDiscovery();
  fireEvent.click(screen.getByRole("button", { name: "Worth Checking Out" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Collapse wave discovery" })
  );
  first.unmount();
  renderDiscovery();
  expect(
    screen.getByRole("button", { name: "Worth Checking Out" })
  ).toHaveAttribute("aria-pressed", "true");
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
  expect(screen.queryByRole("button", { name: "Active Votes 0" })).toBeNull();
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
  fireEvent.click(screen.getByRole("button", { name: "Active Votes 3" }));
  mockVotes.data.pages[0] = { count: 0, data: [] };
  rerender(<SidebarDiscovery previewItems={[]} isTouchPreview={false} />);
  expect(
    screen.getByRole("button", { name: "Active Votes 0" })
  ).toHaveAttribute("aria-pressed", "true");
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
      screen.queryByRole("button", { name: "Browse Worth Checking Out" })
    ).toBeNull();
    expect(
      screen.getByRole(state === "error" ? "alert" : "status")
    ).toBeVisible();
  }
);
