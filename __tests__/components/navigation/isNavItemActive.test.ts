import { isNavItemActive } from "@/components/navigation/isNavItemActive";
import type { NavItem } from "@/components/navigation/navTypes";

describe("isNavItemActive", () => {
  it("returns true for About item when on network routes with no active view", () => {
    const item: NavItem = {
      kind: "route",
      name: "About",
      href: "/about",
      icon: "",
    } as any;
    expect(
      isNavItemActive(item, "/network", new URLSearchParams(), null, false)
    ).toBe(true);
  });

  it("returns true for About item when on /xtdh with no active view", () => {
    const item: NavItem = {
      kind: "route",
      name: "About",
      href: "/about",
      icon: "",
    } as any;
    expect(
      isNavItemActive(item, "/xtdh", new URLSearchParams(), null, false)
    ).toBe(true);
  });

  it("returns false for NFTs item when on /xtdh", () => {
    const item: NavItem = {
      kind: "route",
      name: "NFTs",
      href: "/the-memes",
      icon: "",
    } as any;
    expect(
      isNavItemActive(item, "/xtdh", new URLSearchParams(), null, false)
    ).toBe(false);
  });

  it("marks NFTs active on NFT routes with no active view", () => {
    const item: NavItem = {
      kind: "route",
      name: "NFTs",
      href: "/the-memes",
      icon: "",
    } as any;
    expect(
      isNavItemActive(
        item,
        "/meme-calendar",
        new URLSearchParams(),
        null,
        false
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
        "/waves",
        new URLSearchParams({ wave: "x1" }),
        null,
        false
      )
    ).toBe(true);
  });

  it("returns true for waves view on the discover route", () => {
    const item: NavItem = {
      kind: "view",
      name: "Waves",
      viewKey: "waves",
      icon: "",
    } as any;
    expect(
      isNavItemActive(item, "/discover", new URLSearchParams(), null, false)
    ).toBe(true);
  });

  it("returns true for DMs view when current wave is DM", () => {
    const item: NavItem = {
      kind: "view",
      name: "DMs",
      viewKey: "messages",
      icon: "",
    } as any;
    expect(
      isNavItemActive(
        item,
        "/messages",
        new URLSearchParams({ wave: "dm1" }),
        null,
        true
      )
    ).toBe(true);
  });
});
