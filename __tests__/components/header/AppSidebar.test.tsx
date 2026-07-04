import React from "react";
import { render } from "@testing-library/react";
import AppSidebar from "@/components/header/AppSidebar";
import type AppSidebarMenuItems from "@/components/header/AppSidebarMenuItems";
import { DEFAULT_DROP_FORGE_PERMISSIONS } from "../../helpers/dropForgePermissions";

let headerProps: any = null;
let connectProps: any = null;
let mockDropForgePermissions = { ...DEFAULT_DROP_FORGE_PERMISSIONS };

type AppSidebarMenuItemsProps = Parameters<typeof AppSidebarMenuItems>[0];
type SidebarMenu = AppSidebarMenuItemsProps["menu"];
type SidebarMenuItem = SidebarMenu[number];
type SidebarMenuChildren = NonNullable<SidebarMenuItem["children"]>;

let menuProps: AppSidebarMenuItemsProps | null = null;

jest.mock("@/components/header/AppSidebarHeader", () => (props: any) => {
  headerProps = props;
  return <div data-testid="header" />;
});
jest.mock(
  "@/components/header/AppSidebarMenuItems",
  () => (props: AppSidebarMenuItemsProps) => {
    menuProps = props;
    return <div data-testid="menu" />;
  }
);
jest.mock("@/components/header/AppUserConnect", () => (props: any) => {
  connectProps = props;
  return <div data-testid="connect" />;
});

jest.mock("@/components/app-wallets/AppWalletsContext");
jest.mock("@/hooks/useDropForgePermissions", () => ({
  useDropForgePermissions: () => mockDropForgePermissions,
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: true }),
}));

let optionalCookieConsentCountry: string | undefined = "US";
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useOptionalCookieConsent: () =>
    optionalCookieConsentCountry === undefined
      ? undefined
      : { country: optionalCookieConsentCountry },
}));

((describe) => {
  const {
    useAppWallets,
  } = require("@/components/app-wallets/AppWalletsContext");

  describe("AppSidebar", () => {
    const setCookieCountry = (nextCountry: string) => {
      optionalCookieConsentCountry = nextCountry;
    };

    const clearOptionalCookieConsent = () => {
      optionalCookieConsentCountry = undefined;
    };

    const getMenu = (): SidebarMenu => {
      if (menuProps === null) {
        throw new Error("AppSidebarMenuItems was not rendered.");
      }

      return menuProps.menu;
    };

    const getMenuItem = (label: string): SidebarMenuItem => {
      const item = getMenu().find((menuItem) => menuItem.label === label);
      if (item === undefined) {
        throw new Error(`Missing ${label} menu item.`);
      }

      return item;
    };

    const getMenuChildren = (label: string): SidebarMenuChildren => {
      const children = getMenuItem(label).children;
      if (children === undefined) {
        throw new Error(`Missing ${label} menu children.`);
      }

      return children;
    };

    const flattenMenuChildren = (
      children: SidebarMenuChildren
    ): SidebarMenuChildren =>
      children.flatMap((child) => [child, ...(child.children ?? [])]);

    const getChildGroup = (
      children: SidebarMenuChildren,
      label: string
    ): SidebarMenuItem => {
      const group = children.find((child) => child.label === label);
      if (group === undefined) {
        throw new Error(`Missing ${label} child group.`);
      }

      return group;
    };

    beforeEach(() => {
      headerProps = menuProps = connectProps = null;
      mockDropForgePermissions = { ...DEFAULT_DROP_FORGE_PERMISSIONS };
      setCookieCountry("US");
    });

    it("renders the menu IA with App Wallets under About when supported and handles close", () => {
      const onClose = jest.fn();
      (useAppWallets as jest.Mock).mockReturnValue({
        appWalletsSupported: true,
      });
      render(<AppSidebar open={true} onClose={onClose} />);
      expect(getMenu().map((item) => item.label)).toEqual([
        "NFTs",
        "Waves",
        "DMs",
        "About",
      ]);
      expect(getMenu()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "DMs", path: "/messages" }),
        ])
      );
      expect(getMenu()).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({ label: "Join 6529" }),
        ])
      );
      expect(getMenuChildren("NFTs")).toEqual([
        { label: "The Memes", path: "/the-memes" },
        { label: "6529 Gradient", path: "/6529-gradient" },
        { label: "NextGen", path: "/nextgen" },
        { label: "Meme Lab", path: "/meme-lab" },
        { label: "ReMemes", path: "/rememes" },
        { label: "NFT Activity", path: "/nft-activity" },
        { label: "Memes Calendar", path: "/meme-calendar" },
      ]);
      expect(getMenuChildren("Waves")).toEqual([
        { label: "Waves", path: "/waves" },
        { label: "Discover Waves", path: "/discover" },
      ]);
      const aboutChildren = getMenuChildren("About");
      expect(aboutChildren).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "About 6529", section: true }),
          expect.objectContaining({
            label: "Collections & Minting",
            section: true,
          }),
          expect.objectContaining({
            label: "Network & Reputation",
            section: true,
          }),
          expect.objectContaining({
            label: "Delegation & Wallets",
            section: true,
          }),
          expect.objectContaining({
            label: "Data & Developer Tools",
            section: true,
          }),
          expect.objectContaining({ label: "Legal", section: true }),
        ])
      );
      expect(aboutChildren.slice(0, 3)).toEqual([
        { label: "About", path: "/about" },
        expect.objectContaining({ label: "About 6529", section: true }),
        expect.objectContaining({
          label: "Collections & Minting",
          section: true,
        }),
      ]);
      expect(
        getChildGroup(aboutChildren, "Collections & Minting").children
      ).toEqual([
        { label: "About The Memes", path: "/about/the-memes" },
        { label: "Subscription Minting", path: "/about/subscriptions" },
        { label: "Meme Lab", path: "/about/meme-lab" },
        { label: "6529 Gradient", path: "/about/6529-gradient" },
        { label: "Minting", path: "/about/minting" },
      ]);
      expect(
        getChildGroup(aboutChildren, "Network & Reputation").children
      ).toEqual(
        expect.arrayContaining([
          { label: "Identities", path: "/network" },
          { label: "xTDH Overview", path: "/network/xtdh" },
          { label: "xTDH Allocations Dashboard", path: "/xtdh" },
          { label: "Wave Score", path: "/network/wave-score" },
          { label: "Network Nerd", path: "/network/nerd" },
          { label: "Prenodes", path: "/network/prenodes" },
          {
            label: "TDH Historic Boosts",
            path: "/network/tdh/historic-boosts",
          },
        ])
      );
      expect(
        getChildGroup(aboutChildren, "Delegation & Wallets").children
      ).toEqual(
        expect.arrayContaining([
          { label: "Delegation Center", path: "/delegation/delegation-center" },
          { label: "App Wallets", path: "/tools/app-wallets" },
        ])
      );
      expect(
        getChildGroup(aboutChildren, "Data & Developer Tools").children
      ).toEqual(
        expect.arrayContaining([
          { label: "Open Data", path: "/open-data" },
          { label: "ReMemes Data", path: "/open-data/rememes" },
          { label: "Team Data", path: "/open-data/team" },
        ])
      );
      headerProps.onClose();
      expect(onClose).toHaveBeenCalled();
      connectProps.onNavigate();
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it("adds Drop Forge as a gated top-level row after About", () => {
      mockDropForgePermissions = {
        ...DEFAULT_DROP_FORGE_PERMISSIONS,
        canAccessLanding: true,
      };
      (useAppWallets as jest.Mock).mockReturnValue({
        appWalletsSupported: true,
      });

      render(<AppSidebar open={true} onClose={() => {}} />);

      expect(getMenu().map((item) => item.label)).toEqual([
        "NFTs",
        "Waves",
        "DMs",
        "About",
        "Drop Forge",
      ]);
      expect(getMenuItem("Drop Forge")).toEqual(
        expect.objectContaining({
          label: "Drop Forge",
          path: "/drop-forge",
        })
      );
      expect(getMenuChildren("About")).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({ label: "Drop Forge" }),
        ])
      );
    });

    it("omits App Wallets when unsupported", () => {
      (useAppWallets as jest.Mock).mockReturnValue({
        appWalletsSupported: false,
      });
      render(<AppSidebar open={true} onClose={() => {}} />);
      expect(flattenMenuChildren(getMenuChildren("About"))).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({ label: "App Wallets" }),
        ])
      );
    });

    it("renders nothing when closed", () => {
      (useAppWallets as jest.Mock).mockReturnValue({
        appWalletsSupported: false,
      });
      const { queryByTestId } = render(
        <AppSidebar open={false} onClose={() => {}} />
      );
      expect(queryByTestId("menu")).toBeNull();
    });

    it("hides subscriptions in the About submenu for restricted iOS users", () => {
      setCookieCountry("DE");
      (useAppWallets as jest.Mock).mockReturnValue({
        appWalletsSupported: false,
      });

      render(<AppSidebar open={true} onClose={() => {}} />);

      const aboutChildren = getMenuChildren("About");
      expect(flattenMenuChildren(aboutChildren)).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({ label: "Subscription Minting" }),
        ])
      );
      expect(flattenMenuChildren(aboutChildren)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "About The Memes" }),
          expect.objectContaining({ label: "Meme Lab" }),
        ])
      );
    });

    it("keeps subscriptions visible when the optional consent provider is absent", () => {
      clearOptionalCookieConsent();
      (useAppWallets as jest.Mock).mockReturnValue({
        appWalletsSupported: false,
      });

      render(<AppSidebar open={true} onClose={() => {}} />);

      expect(flattenMenuChildren(getMenuChildren("About"))).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Subscription Minting" }),
        ])
      );
    });
  });
})(describe);
