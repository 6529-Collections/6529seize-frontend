import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("next/dynamic", () => () => {
  const MockQuickDirectMessages = () => <div data-testid="quick-dm-runtime" />;
  MockQuickDirectMessages.displayName = "MockQuickDirectMessages";
  return MockQuickDirectMessages;
});

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useAuthMock = require("@/components/auth/Auth").useAuth as jest.Mock;
const useDeviceInfoMock = require("@/hooks/useDeviceInfo").default as jest.Mock;

const QuickDirectMessagesGate =
  require("@/components/messages/quick-dms/QuickDirectMessagesGate").default;

const setMatchMedia = (matches: boolean): void => {
  Object.defineProperty(globalThis.window, "matchMedia", {
    configurable: true,
    value: jest.fn((query: string) => ({
      addEventListener: jest.fn(),
      addListener: jest.fn(),
      dispatchEvent: jest.fn(),
      matches,
      media: query,
      onchange: null,
      removeEventListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  });
};

const renderGate = () => render(<QuickDirectMessagesGate />);

describe("QuickDirectMessagesGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMatchMedia(true);
    useAuthMock.mockReturnValue({
      connectedProfile: { handle: "alice" },
      showWaves: true,
    });
    useDeviceInfoMock.mockReturnValue({
      isApp: false,
      isMobileDevice: false,
    });
  });

  it("mounts Quick Direct Messages only for eligible desktop sessions", () => {
    renderGate();

    expect(screen.getByTestId("quick-dm-runtime")).toBeInTheDocument();
  });

  it.each([
    ["app sessions", { isApp: true, isMobileDevice: false }, true, true],
    ["mobile devices", { isApp: false, isMobileDevice: true }, true, true],
    ["narrow viewports", { isApp: false, isMobileDevice: false }, false, true],
    [
      "profiles without handles",
      { isApp: false, isMobileDevice: false },
      true,
      false,
    ],
    [
      "hidden waves",
      { isApp: false, isMobileDevice: false },
      true,
      true,
      false,
    ],
  ])(
    "does not mount Quick Direct Messages for %s",
    (_label, deviceInfo, isDesktopViewport, hasHandle, showWaves = true) => {
      setMatchMedia(isDesktopViewport);
      useDeviceInfoMock.mockReturnValue(deviceInfo);
      useAuthMock.mockReturnValue({
        connectedProfile: hasHandle ? { handle: "alice" } : {},
        showWaves,
      });

      renderGate();

      expect(screen.queryByTestId("quick-dm-runtime")).not.toBeInTheDocument();
    }
  );
});
