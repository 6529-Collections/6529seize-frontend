import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { CompactMenu } from "@/components/compact-menu";
import { dismissAndroidBackLayer } from "@/services/capacitor/android-back-layers";

jest.mock("@capacitor/core", () => ({
  ...jest.requireActual("@capacitor/core"),
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => "android",
  },
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: true, isIos: false }),
}));
jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: () => true,
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => true,
}));

it("returns within a sheet before closing it", () => {
  const onBack = jest.fn();
  const onClose = jest.fn();
  render(
    <MobileWrapperDialog
      isOpen
      title="Reactions"
      onClose={onClose}
      onBack={onBack}
    >
      <button type="button">Reaction</button>
    </MobileWrapperDialog>
  );
  act(() => dismissAndroidBackLayer());
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
});

it("keeps a non-dismissable sheet open and consumes Back", () => {
  const onClose = jest.fn();
  render(
    <MobileWrapperDialog
      isOpen
      title="Signing"
      onClose={onClose}
      dismissible={false}
    >
      <button type="button">Signing transaction</button>
    </MobileWrapperDialog>
  );
  act(() => expect(dismissAndroidBackLayer()).toBe(true));
  expect(onClose).not.toHaveBeenCalled();
});

it("closes the registered CompactMenu before its surrounding sheet", async () => {
  const onClose = jest.fn();
  render(
    <MobileWrapperDialog isOpen title="Actions" onClose={onClose}>
      <CompactMenu
        trigger="More"
        aria-label="More"
        items={[{ id: "copy", label: "Copy" }]}
      />
    </MobileWrapperDialog>
  );
  await userEvent.click(screen.getByRole("button", { name: "More" }));
  expect(screen.getByRole("menu")).toBeInTheDocument();
  act(() => dismissAndroidBackLayer());
  await waitFor(() =>
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  );
  expect(onClose).not.toHaveBeenCalled();
  act(() => dismissAndroidBackLayer());
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("adapts an unregistered Headless menu locally without a window Escape", async () => {
  const onClose = jest.fn();
  const globalEscape = jest.fn();
  render(
    <MobileWrapperDialog isOpen title="Actions" onClose={onClose}>
      <Menu>
        <MenuButton>Other menu</MenuButton>
        <MenuItems>
          <MenuItem>
            <button type="button">Copy</button>
          </MenuItem>
        </MenuItems>
      </Menu>
    </MobileWrapperDialog>
  );
  await userEvent.click(screen.getByRole("button", { name: "Other menu" }));
  expect(screen.getByRole("menu")).toBeInTheDocument();
  globalThis.addEventListener("keydown", globalEscape);
  act(() => dismissAndroidBackLayer());
  await waitFor(() =>
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  );
  expect(globalEscape).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
  globalThis.removeEventListener("keydown", globalEscape);
});
