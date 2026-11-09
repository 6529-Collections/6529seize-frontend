import {
  dismissAndroidBackLayer,
  registerAndroidBackLayer,
} from "@/services/capacitor/android-back-layers";

const cleanups: (() => void)[] = [];

function overlay(role = "dialog", zIndex = 1010) {
  const element = document.createElement("div");
  element.setAttribute("role", role);
  element.style.position = "fixed";
  element.style.zIndex = String(zIndex);
  document.body.append(element);
  return element;
}

function register(element: HTMLElement, onBack = jest.fn()) {
  const cleanup = registerAndroidBackLayer({ element: () => element, onBack });
  cleanups.push(cleanup);
  return { onBack, cleanup };
}

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  document.body.replaceChildren();
});

it("lets navigation continue when no surface is open", () => {
  expect(dismissAndroidBackLayer()).toBe(false);
});

it("closes only the lightbox above a sheet and single-drop content", () => {
  const sheet = register(overlay());
  const image = register(overlay("dialog", 1100));
  expect(dismissAndroidBackLayer()).toBe(true);
  expect(image.onBack).toHaveBeenCalledTimes(1);
  expect(sheet.onBack).not.toHaveBeenCalled();
});

it("closes a nested layer before its parent, regardless of registration order", () => {
  const parent = overlay();
  const child = overlay();
  parent.append(child);
  const childLayer = register(child);
  const parentLayer = register(parent);
  expect(dismissAndroidBackLayer()).toBe(true);
  expect(childLayer.onBack).toHaveBeenCalledTimes(1);
  expect(parentLayer.onBack).not.toHaveBeenCalled();
});

it("uses stacking contexts rather than a child's large z-index in a lower layer", () => {
  const low = overlay("dialog", 1000);
  const lowChild = overlay("menu", 5000);
  low.append(lowChild);
  const lowLayer = register(lowChild);
  const highLayer = register(overlay("dialog", 1100));
  expect(dismissAndroidBackLayer()).toBe(true);
  expect(highLayer.onBack).toHaveBeenCalledTimes(1);
  expect(lowLayer.onBack).not.toHaveBeenCalled();
});

it("closes a registered menu inside a sheet without invoking sheet Back", () => {
  const sheet = overlay();
  const menu = overlay("menu", 1020);
  sheet.append(menu);
  const menuLayer = register(menu);
  const sheetLayer = register(sheet);
  dismissAndroidBackLayer();
  expect(menuLayer.onBack).toHaveBeenCalledTimes(1);
  expect(sheetLayer.onBack).not.toHaveBeenCalled();
});

it("honors a native modal's browser top layer above ordinary z-indexes", () => {
  const sheet = register(overlay("dialog", 10000));
  const dialog = document.createElement("dialog");
  dialog.open = true;
  document.body.prepend(dialog);
  jest
    .spyOn(dialog, "matches")
    .mockImplementation((selector) => selector === ":modal");
  const modal = register(dialog);
  expect(dismissAndroidBackLayer()).toBe(true);
  expect(modal.onBack).toHaveBeenCalledTimes(1);
  expect(sheet.onBack).not.toHaveBeenCalled();
});

it("targets an unregistered menu locally without broadcasting Escape", () => {
  const windowKeydown = jest.fn();
  globalThis.addEventListener("keydown", windowKeydown);
  const menu = overlay("menu", 1020);
  menu.id = "headlessui-menu-items-native-test";
  const menuEscape = jest.fn((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
    }
  });
  menu.addEventListener("keydown", menuEscape);
  expect(dismissAndroidBackLayer()).toBe(true);
  expect(menuEscape).toHaveBeenCalledTimes(1);
  expect(windowKeydown).not.toHaveBeenCalled();
  globalThis.removeEventListener("keydown", windowKeydown);
});

it("consumes an unknown or non-dismissable dialog without navigation or Escape", () => {
  const keydown = jest.fn();
  const dialog = overlay();
  dialog.addEventListener("keydown", keydown);
  expect(dismissAndroidBackLayer()).toBe(true);
  expect(keydown).not.toHaveBeenCalled();
});

it("ignores detached and hidden registrations and unregisters idempotently", () => {
  const hidden = overlay();
  hidden.hidden = true;
  const hiddenLayer = register(hidden);
  const detached = overlay();
  const detachedLayer = register(detached);
  detached.remove();
  expect(dismissAndroidBackLayer()).toBe(false);
  expect(hiddenLayer.onBack).not.toHaveBeenCalled();
  expect(detachedLayer.onBack).not.toHaveBeenCalled();
  hiddenLayer.cleanup();
  hiddenLayer.cleanup();
  detachedLayer.cleanup();
});

it("keeps consuming an exiting dialog after its owner unregisters", () => {
  const layer = register(overlay());
  layer.cleanup();
  expect(dismissAndroidBackLayer()).toBe(true);
  expect(layer.onBack).not.toHaveBeenCalled();
});
