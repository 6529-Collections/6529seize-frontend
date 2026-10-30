import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Disclosure from "@/components/user/subscriptions/UserPageSubscriptionsDisclosure";

const id = "profile-subscriptions-settings";
function Fixture() {
  return (
    <>
      <a href={`#${id}`}>Open settings</a>
      <Disclosure id={id} title="Minting Settings">
        <p>Full settings</p>
      </Disclosure>
    </>
  );
}

describe("Subscription disclosures", () => {
  beforeEach(() =>
    window.history.replaceState(null, "", "/test/subscriptions")
  );
  afterEach(() => window.history.replaceState(null, "", "/test/subscriptions"));
  it("starts closed and opens a direct hash with heading focus", async () => {
    const { unmount } = render(<Fixture />);
    expect(
      screen.getByRole("button", { name: "Minting Settings" })
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Full settings")).not.toBeVisible();
    unmount();
    window.history.replaceState(null, "", `/test/subscriptions#${id}`);
    render(<Fixture />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Minting Settings" })
      ).toHaveFocus()
    );
    expect(screen.getByText("Full settings")).toBeVisible();
  });
  it("reopens a collapsed panel when the same hash link is clicked", async () => {
    window.history.replaceState(null, "", `/test/subscriptions#${id}`);
    render(<Fixture />);
    await waitFor(() =>
      expect(screen.getByText("Full settings")).toBeVisible()
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Minting Settings" }));
    await user.click(screen.getByRole("link", { name: "Open settings" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Minting Settings" })
      ).toHaveFocus()
    );
    expect(screen.getByText("Full settings")).toBeVisible();
  });
  it("responds to hash navigation after mounting", async () => {
    render(<Fixture />);
    act(() => {
      window.history.replaceState(null, "", `/test/subscriptions#${id}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Minting Settings" })
      ).toHaveFocus()
    );
  });
});
