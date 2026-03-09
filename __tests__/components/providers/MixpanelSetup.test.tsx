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
let searchParams = new URLSearchParams();

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
  useSearchParams: () => searchParams,
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
    searchParams = new URLSearchParams();
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
      logical_page: "waves_index",
      page_group: "waves",
      route_pattern: "/waves",
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
      logical_page: "waves_index",
      page_group: "waves",
      route_pattern: "/waves",
    });

    rerender(<MixpanelSetup />);
    expect(trackPageViewMock).toHaveBeenCalledTimes(1);

    pathname = "/notifications";
    rerender(<MixpanelSetup />);
    expect(trackPageViewMock).toHaveBeenCalledTimes(2);
    expect(trackPageViewMock).toHaveBeenLastCalledWith("/notifications", {
      has_connected_profile: false,
      logical_page: "notifications",
      page_group: "notifications",
      route_pattern: "/notifications",
    });
  });

  it("tracks drop detail views separately when the drop query changes", () => {
    performanceConsent = true;
    pathname = "/waves/wave-1";
    searchParams = new URLSearchParams("drop=drop-1");

    const { rerender } = render(<MixpanelSetup />);

    expect(trackPageViewMock).toHaveBeenCalledWith("/waves/wave-1", {
      has_connected_profile: false,
      logical_page: "wave_drop_detail",
      page_group: "waves",
      route_pattern: "/waves/:waveId?drop=:dropId",
    });

    searchParams = new URLSearchParams("drop=drop-2");
    rerender(<MixpanelSetup />);

    expect(trackPageViewMock).toHaveBeenCalledTimes(2);
    expect(trackPageViewMock).toHaveBeenLastCalledWith("/waves/wave-1", {
      has_connected_profile: false,
      logical_page: "wave_drop_detail",
      page_group: "waves",
      route_pattern: "/waves/:waveId?drop=:dropId",
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
