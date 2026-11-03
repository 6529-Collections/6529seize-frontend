import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Settings from "@/components/user/subscriptions/UserPageSubscriptionsSettings";
import { renderWithAuth } from "@/__tests__/utils/testContexts";

const id = "profile-subscriptions-settings";
function Fixture() {
  return (
    <>
      <a href={`#${id}`}>Open settings</a>
      <Settings
        profileKey="p1"
        details={undefined}
        readonly
        refresh={jest.fn()}
        airdrop={undefined}
        fetchingAirdrop={false}
      />
    </>
  );
}

describe("Separate Minting settings section", () => {
  beforeEach(() =>
    window.history.replaceState(null, "", "/test/subscriptions")
  );
  afterEach(() => window.history.replaceState(null, "", "/test/subscriptions"));
  it("is visible without expanding the coverage card", () => {
    renderWithAuth(<Fixture />);
    expect(
      screen.getByRole("heading", { name: "Minting settings" })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Airdrop Address" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Minting settings", exact: true })
    ).not.toBeInTheDocument();
  });
  it("focuses its heading for a direct settings hash", async () => {
    window.history.replaceState(null, "", `/test/subscriptions#${id}`);
    renderWithAuth(<Fixture />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Minting settings" })
      ).toHaveFocus()
    );
  });
  it("focuses its heading when a settings link is followed", async () => {
    renderWithAuth(<Fixture />);
    await userEvent
      .setup()
      .click(screen.getByRole("link", { name: "Open settings" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Minting settings" })
      ).toHaveFocus()
    );
  });
  it("responds to hash navigation after mounting", async () => {
    renderWithAuth(<Fixture />);
    act(() => {
      window.history.replaceState(null, "", `/test/subscriptions#${id}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Minting settings" })
      ).toHaveFocus()
    );
  });
});
