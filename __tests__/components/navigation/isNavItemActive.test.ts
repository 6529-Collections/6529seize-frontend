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
      isNavItemActive(
        item,
        "/network",
        new URLSearchParams(),
        null,
        false,
        "latest"
      )
    ).toBe(true);
  });

  it("marks Home active for latest tab", () => {
    const item: NavItem = {
      kind: "route",
      name: "Home",
      href: "/",
      icon: "",
    } as any;
    expect(
      isNavItemActive(
        item,
        "/",
        new URLSearchParams(),
        null,
        false,
        "latest"
      )
    ).toBe(true);
    expect(
      isNavItemActive(
        item,
        "/",
        new URLSearchParams(),
        null,
        false,
        "feed"
      )
    ).toBe(false);
  });

  it("returns true for Discover item when on discover routes with no active view", () => {
    const item: NavItem = {
      kind: "route",
      name: "Discover",
      href: "/discover",
      icon: "",
    } as any;
    expect(
      isNavItemActive(
        item,
        "/discover",
        new URLSearchParams(),
        null,
        false,
        "latest"
      )
    ).toBe(true);
    expect(
      isNavItemActive(
        item,
        "/discover/something",
        new URLSearchParams(),
        null,
        false,
        "latest"
      )
    ).toBe(true);
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
        '/waves',
        new URLSearchParams({ wave: 'x1' }),
        null,
        false,
        "latest"
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
        '/messages',
        new URLSearchParams({ wave: 'dm1' }),
        null,
        true,
        "latest"
      )
    ).toBe(true);
  });
});
