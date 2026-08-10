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
});
