import PreferencesPageClient from "@/app/preferences/page.client";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: {
      id: "profile-1",
      handle: "alice",
      pfp: null,
    },
  }),
}));
jest.mock("@/components/header/ProfilePreferencesSettings", () => () => (
  <div>Notification settings panel</div>
));
jest.mock("@/components/preferences/ContentPreferencesSettings", () => () => (
  <div>Content settings panel</div>
));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (value: string) => value,
}));

describe("PreferencesPageClient", () => {
  it("renders the full-height default notifications view", () => {
    const { container } = render(
      <PreferencesPageClient activeTab="notifications" />
    );

    expect(screen.getByRole("heading", { name: "Preferences" })).toBeVisible();
    expect(screen.getByLabelText("Preferences for @alice")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Notifications & messages" })
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Notification settings panel")).toBeVisible();
    expect(container.querySelector("main")).toHaveClass("tw-min-h-dvh");
  });

  it("renders the content tab and preserves its deep link", () => {
    render(<PreferencesPageClient activeTab="content" />);

    expect(screen.getByRole("link", { name: "Content" })).toHaveAttribute(
      "href",
      "/preferences?tab=content"
    );
    expect(screen.getByRole("link", { name: "Content" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByText("Content settings panel")).toBeVisible();
  });
});
