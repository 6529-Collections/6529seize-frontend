import React from "react";
import { render } from "@testing-library/react";
import AppSidebar from "@/components/header/AppSidebar";
import { DEFAULT_DROP_FORGE_PERMISSIONS } from "../../helpers/dropForgePermissions";

let headerProps: any = null;
let menuProps: any = null;
let connectProps: any = null;

jest.mock("@/components/header/AppSidebarHeader", () => (props: any) => {
  headerProps = props;
  return <div data-testid="header" />;
});
jest.mock("@/components/header/AppSidebarMenuItems", () => (props: any) => {
  menuProps = props;
  return <div data-testid="menu" />;
});
jest.mock("@/components/header/AppUserConnect", () => (props: any) => {
  connectProps = props;
  return <div data-testid="connect" />;
});

jest.mock("@/components/app-wallets/AppWalletsContext");
jest.mock("@/hooks/useDropForgePermissions", () => ({
  useDropForgePermissions: () => ({ ...DEFAULT_DROP_FORGE_PERMISSIONS }),
}));

((describe) => {
  const {
    useAppWallets,
  } = require("@/components/app-wallets/AppWalletsContext");

  describe("AppSidebar", () => {
    beforeEach(() => {
      headerProps = menuProps = connectProps = null;
    });

    it("includes App Wallets when supported and handles close", () => {
      const onClose = jest.fn();
      (useAppWallets as jest.Mock).mockReturnValue({
        appWalletsSupported: true,
      });
      render(<AppSidebar open={true} onClose={onClose} />);
      const networkChildren = menuProps.menu.find(
        (m: any) => m.label === "Network"
      ).children;
      expect(menuProps.menu).toEqual(
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
        (child: any) => child.label === "xTDH"
      );
      const waveScoreIndex = networkChildren.findIndex(
        (child: any) => child.label === "Wave Score"
      );
      expect(waveScoreIndex).toBe(xtdhIndex + 1);
      expect(
        menuProps.menu.find((m: any) => m.label === "Tools").children[0]
      ).toEqual({ label: "App Wallets", path: "/tools/app-wallets" });
      const aboutChildren = menuProps.menu.find(
        (m: any) => m.label === "About"
      ).children;
      expect(
        aboutChildren.some((child: any) => child.label === "Release Notes")
      ).toBe(false);
      expect(aboutChildren).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Network", section: true }),
          expect.objectContaining({ label: "TDH", path: "/network/tdh" }),
          expect.objectContaining({ label: "xTDH", path: "/network/xtdh" }),
          expect.objectContaining({
            label: "Definitions",
            path: "/network/definitions",
          }),
          expect.objectContaining({ label: "Levels", path: "/network/levels" }),
        ])
      );
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
      expect(
        menuProps.menu.find((m: any) => m.label === "Tools").children[0].label
      ).not.toBe("App Wallets");
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
  });
})(describe);
