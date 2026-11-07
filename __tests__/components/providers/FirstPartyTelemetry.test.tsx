import FirstPartyTelemetry from "@/components/providers/FirstPartyTelemetry";
import { publicEnv } from "@/config/env";
import * as telemetry from "@/services/analytics/telemetry/collector";
import { act, render } from "@testing-library/react";

const mockPathname = jest.fn(
  () => "/waves/3fa85f64-5717-4562-b3fc-2c963f66afa6"
);
const mockParams = jest.fn<Record<string, string | string[]>, []>(() => ({
  wave: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
}));
const mockConsent = jest.fn(() => ({ country: "US", isCountryPending: false }));

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useParams: () => mockParams(),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: "profile-1", handle: "punk6529" },
  }),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useOptionalCookieConsent: () => mockConsent(),
}));

const sendBeacon = jest.fn<boolean, [string, string]>(() => true);

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return { ...actual, publicEnv: { ...actual.publicEnv } };
});

const renderTelemetry = (flag: string | undefined, consentEnabled = true) => {
  (publicEnv as Record<string, unknown>)[
    "NEXT_PUBLIC_FEATURE_FIRST_PARTY_TELEMETRY"
  ] = flag;
  render(<FirstPartyTelemetry consentEnabled={consentEnabled} />);
  return telemetry;
};

const sentPageView = () => {
  const body = sendBeacon.mock.calls.at(-1)?.[1];
  return body
    ? (JSON.parse(body) as { events: Record<string, unknown>[] }).events.find(
        (e) => e["t"] === "pv"
      )
    : undefined;
};

let collector: typeof telemetry | undefined;

beforeEach(() => {
  jest.useFakeTimers();
  sendBeacon.mockClear();
  Object.defineProperty(navigator, "sendBeacon", {
    configurable: true,
    value: sendBeacon,
  });
});

afterEach(() => {
  collector?.resetTelemetryForTests();
  collector = undefined;
  jest.useRealTimers();
});

describe("FirstPartyTelemetry", () => {
  it("renders nothing and sends nothing with the flag off", () => {
    collector = renderTelemetry(undefined);
    act(() => jest.advanceTimersByTime(5000));
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("sends the route template, signed-in state and fp outside the EU/EEA/UK", () => {
    collector = renderTelemetry("true");
    act(() => jest.advanceTimersByTime(1500));
    const pv = sentPageView();
    expect(pv).toMatchObject({
      route: "/waves/[wave]",
      page_group: "waves",
      signed_in: true,
    });
    expect(pv?.["fp"]).toMatch(/^[A-Za-z0-9_-]{8,32}$/);
    expect(sendBeacon.mock.calls[0]?.[1]).not.toContain("3fa85f64");
    expect(sendBeacon.mock.calls[0]?.[1]).not.toContain("punk6529");
  });

  it.each([
    [{ country: "DE", isCountryPending: false }],
    [{ country: "GB", isCountryPending: false }],
    [{ country: "", isCountryPending: false }],
  ])("sends no fp for %p", (consent) => {
    mockConsent.mockReturnValue(consent);
    collector = renderTelemetry("true");
    act(() => jest.advanceTimersByTime(1500));
    expect(sentPageView()).toBeDefined();
    expect(sentPageView()).not.toHaveProperty("fp");
  });

  it("treats a disabled consent provider's fixed country as unknown", () => {
    mockConsent.mockReturnValue({ country: "US", isCountryPending: false });
    collector = renderTelemetry("true", false);
    act(() => jest.advanceTimersByTime(1500));
    expect(sentPageView()).not.toHaveProperty("fp");
  });
});
