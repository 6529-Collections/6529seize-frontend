import { act, render } from "@testing-library/react";
import AndroidBackNavigation from "@/components/navigation/AndroidBackNavigation";

let mockPlatform = "android";
let mockNative = true;
let mockBack: (() => void) | undefined;
const mockRemove = jest.fn();
const mockAddListener = jest.fn((_event: string, callback: () => void) => {
  mockBack = callback;
  return Promise.resolve({ remove: mockRemove });
});
const mockMinimize = jest.fn();
const mockHideKeyboard = jest.fn();
const mockGoBack = jest.fn();
const mockReplace = jest.fn();
const mockExitWave = jest.fn();
const mockDismissLayer = jest.fn();
const mockCloseDrop = jest.fn();
let mockHistory = { canGoBack: false, goBack: mockGoBack };
let mockInformation: { request: { overlay: boolean } } | null = null;
let mockStream: object | null = {};
let mockKeyboard = { isVisible: false, phase: "hidden" };

jest.mock("@capacitor/core", () => ({
  ...jest.requireActual("@capacitor/core"),
  Capacitor: {
    isNativePlatform: () => mockNative,
    getPlatform: () => mockPlatform,
    isPluginAvailable: () => true,
  },
}));
jest.mock("@capacitor/app", () => ({
  App: {
    addListener: (...args: [string, () => void]) => mockAddListener(...args),
    minimizeApp: () => mockMinimize(),
  },
}));
jest.mock("@capacitor/keyboard", () => ({
  Keyboard: { hide: () => mockHideKeyboard() },
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@/contexts/NavigationHistoryContext", () => ({
  useNavigationHistoryContext: () => mockHistory,
}));
jest.mock("@/contexts/WaveInformationContext", () => ({
  useWaveInformation: () => mockInformation,
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => mockStream,
}));
jest.mock("@/components/navigation/useExitActiveWave", () => ({
  useExitActiveWave: () => mockExitWave,
}));
jest.mock("@/hooks/useNativeKeyboard", () => ({
  useNativeKeyboard: () => mockKeyboard,
}));
jest.mock("@/services/capacitor/android-back-layers", () => ({
  dismissAndroidBackLayer: () => mockDismissLayer(),
}));
jest.mock("@/helpers/waves/close-drop.helpers", () => ({
  closeDropInCurrentUrl: () => mockCloseDrop(),
}));

function back() {
  if (!mockBack) throw new Error("Native Back listener was not registered");
  act(() => mockBack?.());
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockNative = true;
  mockPlatform = "android";
  mockBack = undefined;
  mockStream = {};
  mockHistory = { canGoBack: false, goBack: mockGoBack };
  mockInformation = null;
  mockKeyboard = { isVisible: false, phase: "hidden" };
  mockMinimize.mockResolvedValue(undefined);
  mockHideKeyboard.mockResolvedValue(undefined);
  mockDismissLayer.mockReturnValue(false);
  globalThis.history.replaceState(null, "", "/");
});

afterEach(() => {
  jest.useRealTimers();
});

it.each(["web", "ios"])("does not intercept %s Back", (platform) => {
  mockPlatform = platform;
  mockNative = platform !== "web";
  render(<AndroidBackNavigation />);
  expect(mockAddListener).not.toHaveBeenCalled();
});

it("subscribes once and reads current state after rerender", () => {
  const view = render(<AndroidBackNavigation />);
  mockHistory.canGoBack = true;
  view.rerender(<AndroidBackNavigation />);
  back();
  expect(mockGoBack).toHaveBeenCalledTimes(1);
  expect(mockAddListener).toHaveBeenCalledTimes(1);
});

it("dismisses the keyboard before a sheet or navigation", () => {
  mockKeyboard = { isVisible: true, phase: "visible" };
  const input = document.createElement("input");
  document.body.append(input);
  input.focus();
  render(<AndroidBackNavigation />);
  back();
  expect(mockHideKeyboard).toHaveBeenCalledTimes(1);
  expect(document.activeElement).not.toBe(input);
  expect(mockDismissLayer).not.toHaveBeenCalled();
  expect(mockMinimize).not.toHaveBeenCalled();
  input.remove();
});

it("waits for a hiding keyboard without closing the sheet", () => {
  mockKeyboard = { isVisible: false, phase: "hiding" };
  render(<AndroidBackNavigation />);
  back();
  expect(mockHideKeyboard).not.toHaveBeenCalled();
  expect(mockDismissLayer).not.toHaveBeenCalled();
});

it("closes a top layer before a single drop or wave", () => {
  globalThis.history.replaceState(null, "", "/waves/wave-a?drop=drop-a");
  mockDismissLayer.mockReturnValue(true);
  render(<AndroidBackNavigation />);
  back();
  expect(mockCloseDrop).not.toHaveBeenCalled();
  expect(mockExitWave).not.toHaveBeenCalled();
});

it("closes a single-drop query without leaving its wave", () => {
  globalThis.history.replaceState(null, "", "/waves/wave-a?drop=drop-a");
  render(<AndroidBackNavigation />);
  back();
  expect(mockCloseDrop).toHaveBeenCalledTimes(1);
  expect(mockExitWave).not.toHaveBeenCalled();
});

it("removes an unmounted create overlay without leaving the route", () => {
  globalThis.history.replaceState(null, "", "/waves?create=wave&tab=chat");
  render(<AndroidBackNavigation />);
  back();
  expect(globalThis.location.search).toBe("?tab=chat");
  expect(mockReplace).not.toHaveBeenCalled();
});

it("unwinds information navigation before leaving the wave", () => {
  globalThis.history.replaceState(null, "", "/waves/wave-a");
  mockInformation = { request: { overlay: true } };
  render(<AndroidBackNavigation />);
  back();
  expect(mockGoBack).toHaveBeenCalledTimes(1);
  expect(mockExitWave).not.toHaveBeenCalled();
});

it.each([
  ["/waves/wave-a", false],
  ["/messages/wave-a", true],
] as const)("returns %s to its corresponding list", (path, isDm) => {
  globalThis.history.replaceState(null, "", path);
  render(<AndroidBackNavigation />);
  back();
  expect(mockExitWave).toHaveBeenCalledWith(isDm);
  expect(mockMinimize).not.toHaveBeenCalled();
});

it("returns an encrypted deep link to the encrypted chat list", () => {
  globalThis.history.replaceState(null, "", "/messages/encrypted/group-a");
  render(<AndroidBackNavigation />);
  back();
  expect(mockReplace).toHaveBeenCalledWith("/messages/encrypted");
  expect(mockExitWave).not.toHaveBeenCalled();
});

it("returns the encrypted chat list to Messages", () => {
  globalThis.history.replaceState(null, "", "/messages/encrypted");
  render(<AndroidBackNavigation />);
  back();
  expect(mockReplace).toHaveBeenCalledWith("/messages");
  expect(mockMinimize).not.toHaveBeenCalled();
});

it.each([
  ["/waves/create", "/waves"],
  ["/messages/create", "/messages"],
  ["/messages/new", "/messages"],
])("returns %s to its list", (pathname, parent) => {
  globalThis.history.replaceState(null, "", pathname);
  render(<AndroidBackNavigation />);
  back();
  expect(mockReplace).toHaveBeenCalledWith(parent);
  expect(mockMinimize).not.toHaveBeenCalled();
});

it("returns to the wave list even without the optional stream provider", () => {
  mockStream = null;
  globalThis.history.replaceState(null, "", "/waves/wave-a");
  render(<AndroidBackNavigation />);
  back();
  expect(mockReplace).toHaveBeenCalledWith("/waves");
  expect(mockExitWave).not.toHaveBeenCalled();
});

it("provides an in-app fallback for a direct profile link without app history", () => {
  globalThis.history.replaceState(null, "", "/profile-a");
  render(<AndroidBackNavigation />);
  back();
  expect(mockReplace).toHaveBeenCalledWith("/");
  expect(mockMinimize).not.toHaveBeenCalled();
});

it("minimizes only at a root with no app history", () => {
  globalThis.history.replaceState(null, "", "/waves");
  render(<AndroidBackNavigation />);
  back();
  expect(mockMinimize).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();
});

it("ignores native key repeats while a layer closes", () => {
  mockDismissLayer.mockReturnValue(true);
  render(<AndroidBackNavigation />);
  back();
  mockDismissLayer.mockReturnValue(false);
  back();
  expect(mockDismissLayer).toHaveBeenCalledTimes(1);
  expect(mockMinimize).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(251));
  back();
  expect(mockMinimize).toHaveBeenCalledTimes(1);
});

it("removes a late subscription and ignores callbacks after unmount", async () => {
  let resolveHandle:
    | ((handle: { remove: typeof mockRemove }) => void)
    | undefined;
  mockAddListener.mockImplementationOnce((_event, callback) => {
    mockBack = callback;
    return new Promise((resolve) => {
      resolveHandle = resolve;
    });
  });
  const view = render(<AndroidBackNavigation />);
  view.unmount();
  back();
  if (!resolveHandle) throw new Error("Expected a pending native subscription");
  await act(async () => resolveHandle?.({ remove: mockRemove }));
  expect(mockRemove).toHaveBeenCalledTimes(1);
  expect(mockMinimize).not.toHaveBeenCalled();
});
