import { useWaveFeatureUsage } from "@/hooks/useWaveFeatureUsage";
import { render, screen } from "@testing-library/react";

const mockObserve = jest.fn();
const mockCleanup = jest.fn();
let mockConsent = true;

jest.mock("@/components/auth/authContext", () => {
  const { createContext } = jest.requireActual<typeof import("react")>("react");
  return {
    AuthContext: createContext({
      connectedProfile: null,
      activeProfileProxy: null,
    }),
  };
});
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useOptionalCookieConsent: () => ({ performanceConsent: mockConsent }),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/services/analytics/mixpanel", () => ({
  isAnalyticsTrackingAllowed: () => true,
}));
jest.mock("@/services/analytics/waveFeatureVisibility", () => ({
  observeWaveFeatures: (...args: unknown[]) => mockObserve(...args),
}));

function Root({
  visible,
  version = 0,
}: {
  readonly visible: boolean;
  readonly version?: number;
}) {
  const { ref } = useWaveFeatureUsage("wave_tabs", "wave");
  return visible ? (
    <div key={version} ref={ref} role="tablist" aria-label="Fixture tabs" />
  ) : null;
}

const originalIntersection = Object.getOwnPropertyDescriptor(
  globalThis,
  "IntersectionObserver"
);
beforeEach(() => {
  mockConsent = true;
  mockCleanup.mockReset();
  mockObserve.mockReset().mockReturnValue(mockCleanup);
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: jest.fn(),
  });
});
afterEach(() => {
  if (originalIntersection)
    Object.defineProperty(
      globalThis,
      "IntersectionObserver",
      originalIntersection
    );
  else Reflect.deleteProperty(globalThis, "IntersectionObserver");
});

it("observes a root that appears after an initial null render and cleans up replacement/unmount", () => {
  const { rerender, unmount } = render(<Root visible={false} />);
  expect(mockObserve).not.toHaveBeenCalled();
  rerender(<Root visible />);
  const first = screen.getByRole("tablist");
  expect(mockObserve).toHaveBeenCalledWith({
    root: first,
    placement: "wave_tabs",
    getContext: expect.any(Function),
  });
  rerender(<Root visible version={1} />);
  expect(mockCleanup).toHaveBeenCalledTimes(1);
  expect(mockObserve).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("tablist")).not.toBe(first);
  unmount();
  expect(mockCleanup).toHaveBeenCalledTimes(2);
});

it("attaches an already mounted root after consent is granted", () => {
  mockConsent = false;
  const { rerender } = render(<Root visible />);
  expect(mockObserve).not.toHaveBeenCalled();
  mockConsent = true;
  rerender(<Root visible />);
  expect(mockObserve).toHaveBeenCalledTimes(1);
});
