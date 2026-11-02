import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProxyListFilters from "@/components/user/proxy/list/filters/ProxyListFilters";
import { ProfileProxyListType } from "@/components/user/proxy/list/ProxyList";

describe("ProxyListFilters", () => {
  it("renders accessible tabs and preserves proxy filter selection", async () => {
    const user = userEvent.setup();
    const setSelected = jest.fn();
    const { rerender } = render(
      <ProxyListFilters
        selected={ProfileProxyListType.ALL}
        setSelected={setSelected}
      />
    );

    expect(screen.getByRole("tablist", { name: "Proxy Type" })).toBeVisible();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "All",
      "Received",
      "Granted",
    ]);
    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await user.click(screen.getByRole("tab", { name: "Granted" }));
    expect(setSelected).toHaveBeenCalledWith(ProfileProxyListType.GRANTED);
    rerender(
      <ProxyListFilters
        selected={ProfileProxyListType.GRANTED}
        setSelected={setSelected}
      />
    );
    expect(screen.getByRole("tab", { name: "Granted" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute(
      "tabindex",
      "-1"
    );
  });

  it("supports keyboard navigation between filters", async () => {
    const user = userEvent.setup();
    const setSelected = jest.fn();
    render(
      <ProxyListFilters
        selected={ProfileProxyListType.ALL}
        setSelected={setSelected}
      />
    );
    await user.tab();
    expect(screen.getByRole("tab", { name: "All" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Received" })).toHaveFocus();
    expect(setSelected).toHaveBeenCalledWith(ProfileProxyListType.RECEIVED);
  });
});
