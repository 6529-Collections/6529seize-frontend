import MixpanelSetup from "@/components/providers/MixpanelSetup";
import { render } from "@testing-library/react";
import React from "react";

const clearIdentityMock = jest.fn();
const disableAnalyticsMock = jest.fn();
const identifyMock = jest.fn();
const initAnalyticsMock = jest.fn();
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
  clearIdentity: (...args: unknown[]) => clearIdentityMock(...args),
  disableAnalytics: (...args: unknown[]) => disableAnalyticsMock(...args),
  identify: (...args: unknown[]) => identifyMock(...args),
  initAnalytics: (...args: unknown[]) => initAnalyticsMock(...args),
  trackPageView: (...args: unknown[]) => trackPageViewMock(...args),
}));

describe("MixpanelSetup", () => {
  beforeEach(() => {
    connectedProfile = null;
    pathname = "/";
    performanceConsent = undefined;
    clearIdentityMock.mockReset();
    disableAnalyticsMock.mockReset();
    identifyMock.mockReset();
    initAnalyticsMock.mockReset();
    trackPageViewMock.mockReset();
  });

  it("does not initialize or track without consent", () => {
    render(<MixpanelSetup />);

    expect(disableAnalyticsMock).toHaveBeenCalledTimes(1);
    expect(initAnalyticsMock).not.toHaveBeenCalled();
    expect(trackPageViewMock).not.toHaveBeenCalled();
    expect(identifyMock).not.toHaveBeenCalled();
  });

  it("identifies before the first tracked page view", () => {
    performanceConsent = true;
    pathname = "/waves";
    connectedProfile = { id: 42 };

    render(<MixpanelSetup />);

    expect(initAnalyticsMock).toHaveBeenCalledTimes(1);
    expect(identifyMock).toHaveBeenCalledWith("42");
    expect(trackPageViewMock).toHaveBeenCalledWith("/waves", {
      has_connected_profile: true,
    });
    expect(identifyMock.mock.invocationCallOrder[0]).toBeLessThan(
      trackPageViewMock.mock.invocationCallOrder[0]
    );
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

    expect(disableAnalyticsMock).toHaveBeenCalledTimes(1);
  });

  it("resets when an identified profile is cleared", () => {
    performanceConsent = true;
    pathname = "/waves";
    connectedProfile = { id: 42 };

    const { rerender } = render(<MixpanelSetup />);

    expect(identifyMock).toHaveBeenCalledWith("42");

    connectedProfile = null;
    rerender(<MixpanelSetup />);

    expect(clearIdentityMock).toHaveBeenCalledTimes(1);
  });
});
