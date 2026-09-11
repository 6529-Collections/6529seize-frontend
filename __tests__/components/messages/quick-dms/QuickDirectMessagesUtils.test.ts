import { isQuickDmLauncherCoveringInteractiveElement } from "@/components/messages/quick-dms/QuickDirectMessagesUtils";

describe("isQuickDmLauncherCoveringInteractiveElement", () => {
  it("detects an interactive element beneath the launcher", () => {
    const launcher = document.createElement("div");
    const launcherButton = document.createElement("button");
    const coveredButton = document.createElement("button");
    launcher.appendChild(launcherButton);
    jest.spyOn(launcher, "getBoundingClientRect").mockReturnValue({
      left: 100,
      right: 156,
      top: 200,
      bottom: 256,
      width: 56,
      height: 56,
      x: 100,
      y: 200,
      toJSON: () => ({}),
    });
    const documentObject = {
      elementsFromPoint: jest
        .fn()
        .mockReturnValue([launcherButton, coveredButton]),
    } as unknown as Document;

    expect(
      isQuickDmLauncherCoveringInteractiveElement(launcher, documentObject)
    ).toBe(true);
  });

  it("ignores the launcher's own controls and non-interactive content", () => {
    const launcher = document.createElement("div");
    const launcherButton = document.createElement("button");
    const content = document.createElement("div");
    launcher.appendChild(launcherButton);
    jest.spyOn(launcher, "getBoundingClientRect").mockReturnValue({
      left: 100,
      right: 156,
      top: 200,
      bottom: 256,
      width: 56,
      height: 56,
      x: 100,
      y: 200,
      toJSON: () => ({}),
    });
    const documentObject = {
      elementsFromPoint: jest.fn().mockReturnValue([launcherButton, content]),
    } as unknown as Document;

    expect(
      isQuickDmLauncherCoveringInteractiveElement(launcher, documentObject)
    ).toBe(false);
  });

  it("ignores a launcher without visible geometry", () => {
    const launcher = document.createElement("div");
    jest.spyOn(launcher, "getBoundingClientRect").mockReturnValue({
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const elementsFromPoint = jest.fn();
    const documentObject = { elementsFromPoint } as unknown as Document;

    expect(
      isQuickDmLauncherCoveringInteractiveElement(launcher, documentObject)
    ).toBe(false);
    expect(elementsFromPoint).not.toHaveBeenCalled();
  });

  it("ignores overlap when elementsFromPoint is unavailable", () => {
    const launcher = document.createElement("div");
    jest.spyOn(launcher, "getBoundingClientRect").mockReturnValue({
      left: 100,
      right: 156,
      top: 200,
      bottom: 256,
      width: 56,
      height: 56,
      x: 100,
      y: 200,
      toJSON: () => ({}),
    });

    expect(
      isQuickDmLauncherCoveringInteractiveElement(
        launcher,
        {} as unknown as Document
      )
    ).toBe(false);
  });
});
