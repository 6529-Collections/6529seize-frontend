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

    it("includes App Wallets when supported and handles close", () => {
      const onClose = jest.fn();
      (useAppWallets as jest.Mock).mockReturnValue({
        appWalletsSupported: true,
      });
      render(<AppSidebar open={true} onClose={onClose} />);
      const networkChildren = getMenuChildren("Network");
      expect(getMenu()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Profile", path: "/profile" }),
          expect.objectContaining({ label: "Discovery", path: "/discover" }),
        ])
      );
      expect(networkChildren).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "xTDH", path: "/xtdh" }),
          expect.objectContaining({
            label: "Wave Score",
            path: "/network/wave-score",
          }),
        ])
      );
      const xtdhIndex = networkChildren.findIndex(
        (child) => child.label === "xTDH"
      );
      const waveScoreIndex = networkChildren.findIndex(
        (child) => child.label === "Wave Score"
      );
      expect(waveScoreIndex).toBe(xtdhIndex + 1);
      expect(getMenuChildren("Tools")).toEqual(
        expect.arrayContaining([
          { label: "Tools", path: "/tools" },
          { label: "Builder Tools", section: true },
          { label: "App Wallets", path: "/tools/app-wallets" },
          { label: "API", path: "/tools/api" },
          { label: "EMMA", path: "/emma" },
          { label: "Block Finder", path: "/tools/block-finder" },
        ])
      );
      const aboutChildren = getMenuChildren("About");
      expect(aboutChildren).toEqual([
        { label: "About", path: "/about" },
        { label: "Collections", section: true },
        { label: "The Memes", path: "/about/the-memes" },
        { label: "Subscriptions", path: "/about/subscriptions" },
        { label: "Meme Lab", path: "/about/meme-lab" },
        { label: "Gradient", path: "/about/6529-gradient" },
        { label: "Digital Rights", section: true },
        { label: "GDRC", path: "/about/gdrc1" },
        { label: "Delegation", section: true },
        { label: "NFT Delegation", path: "/about/nft-delegation" },
        { label: "Primary Address", path: "/about/primary-address" },
        { label: "Network", section: true },
        { label: "TDH", path: "/network/tdh" },
        { label: "xTDH", path: "/network/xtdh" },
        { label: "Health", path: "/network/health" },
        { label: "Definitions", path: "/network/definitions" },
        { label: "Levels", path: "/network/levels" },
        { label: "Network Stats", path: "/network/health/network-tdh" },
        { label: "Resources", section: true },
        { label: "FAQ", path: "/about/faq" },
        { label: "ENS", path: "/about/ens" },
        { label: "Minting", path: "/about/minting" },
        { label: "Nakamoto Threshold", path: "/about/nakamoto-threshold" },
        { label: "License", path: "/about/license" },
        { label: "Community", section: true },
        { label: "Apply", path: "/about/apply" },
        { label: "Contact Us", path: "/about/contact-us" },
        { label: "Tech", path: "/about/tech" },
        {
          label: "Data Decentralization",
          path: "/about/data-decentralization",
        },
        { label: "Legal", section: true },
        { label: "Terms of Service", path: "/about/terms-of-service" },
        { label: "Privacy Policy", path: "/about/privacy-policy" },
        { label: "Cookie Policy", path: "/about/cookie-policy" },
        { label: "Copyright", path: "/about/copyright" },
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
      expect(aboutChildren).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({ label: "Subscriptions" }),
        ])
      );
      expect(aboutChildren).toEqual(
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
    });
  });
})(describe);
