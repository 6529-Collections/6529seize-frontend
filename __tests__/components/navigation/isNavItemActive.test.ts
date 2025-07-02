import { isNavItemActive } from "@/components/navigation/isNavItemActive";
import type { NavItem } from "@/components/navigation/navTypes";

describe("isNavItemActive", () => {
  it("returns true for Network item when on network routes with no active view", () => {
    const item: NavItem = {
      kind: "route",
      name: "Network",
      href: "/network",
      icon: "",
    } as any;
    expect(
      isNavItemActive(item, "/network", new URLSearchParams(), null, false)
    ).toBe(true);
  });

  it("handles Stream route based on wave query", () => {
    const item: NavItem = {
      kind: "route",
      name: "Stream",
      href: "/my-stream",
      icon: "",
    } as any;
    expect(
      isNavItemActive(item, "/my-stream", new URLSearchParams(), null, false)
    ).toBe(true);
    expect(
      isNavItemActive(
        item,
        "/my-stream",
        new URLSearchParams({ wave: "w1" }),
        null,
        false
      )
    ).toBe(false);
  });

  it("returns true for waves view when viewing non-DM wave sub route", () => {
    const item: NavItem = {
      kind: "view",
      name: "Waves",
      viewKey: "waves",
      icon: "",
    } as any;
    expect(
      isNavItemActive(
        item,
        "/my-stream",
        new URLSearchParams({ wave: "x1" }),
        null,
        false
      )
    ).toBe(true);
  });

  it("returns true for messages view when current wave is DM", () => {
    const item: NavItem = {
      kind: "view",
      name: "Messages",
      viewKey: "messages",
      icon: "",
    } as any;
    expect(
      isNavItemActive(
        item,
        "/my-stream",
        new URLSearchParams({ wave: "dm1" }),
        null,
        true
      )
    ).toBe(true);
  });
});
