import MixpanelSetup from "@/components/providers/MixpanelSetup";
import { render } from "@testing-library/react";
import React from "react";

const identifyMock = jest.fn();
const initAnalyticsMock = jest.fn();
const resetMock = jest.fn();
const trackPageViewMock = jest.fn();

let connectedProfile: { id: number } | null = null;
let pathname = "/";
let performanceConsent: boolean | undefined = undefined;

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile,
  }),
}));

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({
    performanceConsent,
  }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

jest.mock("@/services/analytics/mixpanel", () => ({
  identify: (...args: unknown[]) => identifyMock(...args),
  initAnalytics: (...args: unknown[]) => initAnalyticsMock(...args),
  reset: (...args: unknown[]) => resetMock(...args),
  trackPageView: (...args: unknown[]) => trackPageViewMock(...args),
}));

describe("MixpanelSetup", () => {
  beforeEach(() => {
    connectedProfile = null;
    pathname = "/";
    performanceConsent = undefined;
    identifyMock.mockReset();
    initAnalyticsMock.mockReset();
    resetMock.mockReset();
    trackPageViewMock.mockReset();
  });

  it("does not initialize or track without consent", () => {
    render(<MixpanelSetup />);

    expect(initAnalyticsMock).not.toHaveBeenCalled();
    expect(trackPageViewMock).not.toHaveBeenCalled();
    expect(identifyMock).not.toHaveBeenCalled();
  });

  it("initializes once and tracks page views when consent is granted", () => {
    performanceConsent = true;
    pathname = "/waves";

    const { rerender } = render(<MixpanelSetup />);

    expect(initAnalyticsMock).toHaveBeenCalledTimes(1);
    expect(trackPageViewMock).toHaveBeenCalledWith("/waves", {
      has_connected_profile: false,
    });

    rerender(<MixpanelSetup />);
    expect(trackPageViewMock).toHaveBeenCalledTimes(1);

    pathname = "/notifications";
    rerender(<MixpanelSetup />);
    expect(trackPageViewMock).toHaveBeenCalledTimes(2);
    expect(trackPageViewMock).toHaveBeenLastCalledWith("/notifications", {
      has_connected_profile: false,
    });
  });

  it("identifies connected profiles and resets when consent is revoked", () => {
    performanceConsent = true;
    pathname = "/waves";
    connectedProfile = { id: 42 };

    const { rerender } = render(<MixpanelSetup />);

    expect(identifyMock).toHaveBeenCalledWith("42");

    performanceConsent = false;
    rerender(<MixpanelSetup />);

    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  it("resets when an identified profile is cleared", () => {
    performanceConsent = true;
    pathname = "/waves";
    connectedProfile = { id: 42 };

    const { rerender } = render(<MixpanelSetup />);

    expect(identifyMock).toHaveBeenCalledWith("42");

    connectedProfile = null;
    rerender(<MixpanelSetup />);

    expect(resetMock).toHaveBeenCalledTimes(1);
  });
});
