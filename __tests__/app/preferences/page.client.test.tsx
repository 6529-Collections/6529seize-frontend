import PreferencesPageClient from "@/app/preferences/page.client";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock(
  "@/components/user/utils/set-up-profile/UserSetUpProfileCta",
  () => () => <a href="/0x123">Create profile</a>
);
jest.mock("@/components/header/ProfilePreferencesSettings", () => () => (
  <div>Notification settings panel</div>
));
jest.mock("@/components/preferences/ContentPreferencesSettings", () => () => (
  <div>Content settings panel</div>
));
jest.mock("@/components/preferences/ReportsPreferencesSettings", () => () => (
  <div>Reports settings panel</div>
));
describe("PreferencesPageClient", () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: {
        id: "profile-1",
        handle: "alice",
      },
      fetchingProfile: false,
    });
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      connectionState: "connected",
      hasValidWalletAuth: true,
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("renders the full-height default notifications view", () => {
    const { container } = render(
      <PreferencesPageClient activeTab="notifications" />
    );

    expect(screen.getByRole("heading", { name: "Preferences" })).toBeVisible();
    expect(screen.queryByText("@alice")).not.toBeInTheDocument();
    const notificationsTab = screen.getByRole("link", {
      name: "Notifications & messages",
    });
    expect(notificationsTab).toHaveAttribute("aria-current", "page");
    expect(notificationsTab).toHaveClass(
      "tw-border-b-2",
      "tw-border-primary-400",
      "tw-px-1",
      "tw-py-4"
    );
    expect(
      screen.getByRole("navigation", { name: "Preference sections" })
    ).toHaveClass("tw-gap-x-3", "lg:tw-gap-x-4");
    expect(screen.getByText("Notification settings panel")).toBeVisible();
    expect(container.querySelector("main")).toHaveClass(
      "tw-min-h-dvh",
      "tw-w-full",
      "tw-border-y-0",
      "tw-border-l-0",
      "tw-border-r",
      "tw-border-iron-800"
    );
  });

  it("renders the blocked profiles tab and preserves its deep link", () => {
    render(<PreferencesPageClient activeTab="blocked-profiles" />);

    expect(
      screen.getByRole("link", { name: "Blocked Profiles" })
    ).toHaveAttribute("href", "/preferences?tab=blocked-profiles");
    expect(
      screen.getByRole("link", { name: "Blocked Profiles" })
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Content settings panel")).toBeVisible();
  });

  it("renders the reports tab", () => {
    render(<PreferencesPageClient activeTab="reports" />);

    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByText("Reports settings panel")).toBeVisible();
  });

  it("offers profile creation when an authenticated wallet has no profile", () => {
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: null,
      fetchingProfile: false,
    });

    render(<PreferencesPageClient activeTab="notifications" />);

    expect(
      screen.getByText("Create a profile to manage preferences.")
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Create profile" })
    ).toHaveAttribute("href", "/0x123");
    expect(
      screen.queryByText("Notification settings panel")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Connect an authenticated profile to manage preferences."
      )
    ).not.toBeInTheDocument();
  });

  it("retains the connection prompt when wallet authentication is absent", () => {
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: null,
      fetchingProfile: false,
    });
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      connectionState: "disconnected",
      hasValidWalletAuth: false,
    });

    render(<PreferencesPageClient activeTab="blocked-profiles" />);

    expect(
      screen.getByText(
        "Connect an authenticated profile to manage preferences."
      )
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Create profile" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Content settings panel")
    ).not.toBeInTheDocument();
  });
});
