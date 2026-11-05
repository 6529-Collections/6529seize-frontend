import { act, renderHook, waitFor } from "@testing-library/react";
import { useDismissMobileComposer } from "@/hooks/useDismissMobileComposer";

const mockHide = jest.fn(async () => undefined);
let mockPlatform = "web";
let mockDevice = { isApp: false, isMobileDevice: false, hasTouchScreen: false };

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => mockDevice,
}));
jest.mock("@capacitor/core", () => {
  const actual =
    jest.requireActual<typeof import("@capacitor/core")>("@capacitor/core");
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, getPlatform: () => mockPlatform },
  };
});
jest.mock("@capacitor/keyboard", () => ({
  Keyboard: { hide: () => mockHide() },
}));

beforeEach(() => {
  mockHide.mockReset().mockResolvedValue(undefined);
  mockPlatform = "web";
  mockDevice = { isApp: false, isMobileDevice: false, hasTouchScreen: false };
});

it.each([
  {
    platform: "desktop",
    app: false,
    mobile: false,
    touch: false,
    blurs: 0,
    hides: 0,
  },
  {
    platform: "mobile browser",
    app: false,
    mobile: true,
    touch: false,
    blurs: 1,
    hides: 0,
  },
  {
    platform: "touch-first tablet",
    app: false,
    mobile: false,
    touch: true,
    blurs: 1,
    hides: 0,
  },
  {
    platform: "ios",
    app: true,
    mobile: false,
    touch: true,
    blurs: 1,
    hides: 0,
  },
  {
    platform: "android",
    app: true,
    mobile: true,
    touch: true,
    blurs: 1,
    hides: 1,
  },
])(
  "dismisses the mobile input on $platform",
  async ({ platform, app, mobile, touch, blurs, hides }) => {
    mockPlatform = platform;
    mockDevice = { isApp: app, isMobileDevice: mobile, hasTouchScreen: touch };
    const input = { blur: jest.fn() };
    const { result } = renderHook(useDismissMobileComposer);
    await act(async () => result.current(input));
    expect(input.blur).toHaveBeenCalledTimes(blurs);
    expect(mockHide).toHaveBeenCalledTimes(hides);
  }
);

it("does not dismiss another keyboard after its composer unmounts", async () => {
  mockPlatform = "android";
  mockDevice = { isApp: true, isMobileDevice: true, hasTouchScreen: true };
  const { result } = renderHook(useDismissMobileComposer);
  await act(async () => result.current(null));
  expect(mockHide).not.toHaveBeenCalled();
});

it("keeps native keyboard failures separate from accepted sends", async () => {
  mockPlatform = "android";
  mockDevice = { isApp: true, isMobileDevice: true, hasTouchScreen: true };
  mockHide.mockRejectedValueOnce(new Error("Keyboard unavailable"));
  const input = { blur: jest.fn() };
  const { result } = renderHook(useDismissMobileComposer);
  await act(async () => result.current(input));
  await waitFor(() => expect(mockHide).toHaveBeenCalledTimes(1));
  expect(input.blur).toHaveBeenCalledTimes(1);
});
