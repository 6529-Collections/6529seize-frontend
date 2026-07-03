import React from "react";
import { render } from "@testing-library/react";
import AppSidebar from "@/components/header/AppSidebar";
import type AppSidebarMenuItems from "@/components/header/AppSidebarMenuItems";
import { DEFAULT_DROP_FORGE_PERMISSIONS } from "../../helpers/dropForgePermissions";

let headerProps: any = null;
let connectProps: any = null;

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
  useDropForgePermissions: () => ({ ...DEFAULT_DROP_FORGE_PERMISSIONS }),
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

    beforeEach(() => {
      headerProps = menuProps = connectProps = null;
      setCookieCountry("US");
    });

    it("renders the menu IA with Tools and About groups and handles close", () => {
      const onClose = jest.fn();
      (useAppWallets as jest.Mock).mockReturnValue({
        appWalletsSupported: true,
      });
      render(<AppSidebar open={true} onClose={onClose} />);

      expect(getMenu().map((item) => item.label)).toEqual([
        "NFTs",
        "Waves",
        "DMs",
        "Join 6529",
        "Tools",
        "About",
      ]);
      expect(getMenu()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "DMs", path: "/messages" }),
          expect.objectContaining({ label: "Join 6529", path: "/join" }),
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
      expect(getMenuChildren("Tools")).toEqual(
        expect.arrayContaining([
          { label: "Tools", path: "/tools" },
          { label: "Builder Tools", section: true },
          { label: "App Wallets", path: "/tools/app-wallets" },
          { label: "API", path: "/tools/api" },
          { label: "EMMA", path: "/emma" },
          { label: "Block Finder", path: "/tools/block-finder" },
          { label: "Open Data", section: true },
          { label: "Open Data", path: "/open-data" },
        ])
      );

      const aboutChildren = getMenuChildren("About");
      expect(aboutChildren).toEqual(
        expect.arrayContaining([
          { label: "Network & People", section: true },
          { label: "Identities", path: "/network" },
          { label: "Network Data", section: true },
          { label: "xTDH", path: "/xtdh" },
          { label: "Wave Score", path: "/network/wave-score" },
          { label: "Digital Rights", section: true },
          { label: "GDRC", path: "/about/gdrc1" },
          { label: "Delegation", section: true },
          { label: "Delegation Center", path: "/delegation/delegation-center" },
          { label: "NFT & Reporting Tools", section: true },
          { label: "App Wallets", path: "/tools/app-wallets" },
          { label: "Developer & Open Data", section: true },
          { label: "Open Data", path: "/open-data" },
        ])
      );
      expect(aboutChildren.slice(0, 5)).toEqual([
        { label: "About", path: "/about" },
        { label: "Collections", section: true },
        { label: "The Memes", path: "/about/the-memes" },
        { label: "Subscriptions", path: "/about/subscriptions" },
        { label: "Meme Lab", path: "/about/meme-lab" },
      ]);

      headerProps.onClose();
      expect(onClose).toHaveBeenCalled();
      connectProps.onNavigate();
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it("omits App Wallets when unsupported", () => {
      (useAppWallets as jest.Mock).mockReturnValue({
        appWalletsSupported: false,
      });
      render(<AppSidebar open={true} onClose={() => {}} />);

      expect(getMenuChildren("Tools")).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({ label: "App Wallets" }),
        ])
      );
      expect(getMenuChildren("About")).toEqual(
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

    it("hides subscriptions in the About and Tools submenus for restricted iOS users", () => {
      setCookieCountry("DE");
      (useAppWallets as jest.Mock).mockReturnValue({
        appWalletsSupported: false,
      });

      render(<AppSidebar open={true} onClose={() => {}} />);

      expect(getMenuChildren("About")).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({ label: "Subscriptions" }),
          expect.objectContaining({ label: "Subscriptions Report" }),
          expect.objectContaining({ label: "Meme Subscriptions" }),
        ])
      );
      expect(getMenuChildren("Tools")).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({ label: "Subscriptions Report" }),
          expect.objectContaining({ label: "Meme Subscriptions" }),
        ])
      );
      expect(getMenuChildren("About")).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "The Memes" }),
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

      expect(getMenuChildren("About")).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Subscriptions" }),
        ])
      );
      expect(getMenuChildren("Tools")).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Subscriptions Report" }),
          expect.objectContaining({ label: "Meme Subscriptions" }),
        ])
      );
    });
  });
})(describe);
