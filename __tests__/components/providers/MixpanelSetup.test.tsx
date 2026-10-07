import MixpanelSetup from "@/components/providers/MixpanelSetup";
import { subscribeWaveFeatureVisitReset } from "@/services/analytics/waveFeatureUsage";
import { act, render } from "@testing-library/react";
import React from "react";

const clearIdentityMock = jest.fn();
const disableAnalyticsMock = jest.fn();
const identifyMock = jest.fn();
const initAnalyticsMock = jest.fn();
const isAnalyticsTrackingAllowedMock = jest.fn();
const trackPageViewMock = jest.fn();
const recoveryListeners = new Set<() => void>();

let connectedProfile: {
  id: number;
  normalised_handle?: string | null;
  wallets?: Array<{ wallet: string }>;
} | null = null;
let fetchingProfile = false;
let pathname = "/";
let performanceConsent: boolean | undefined = undefined;
let searchParams = new URLSearchParams();

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile,
    fetchingProfile,
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
  isAnalyticsTrackingAllowed: () => isAnalyticsTrackingAllowedMock(),
  trackPageView: (...args: unknown[]) => trackPageViewMock(...args),
  subscribeAnalyticsRecovery: (listener: () => void) => {
    recoveryListeners.add(listener);
    return () => {
      recoveryListeners.delete(listener);
    };
  },
}));

describe("MixpanelSetup", () => {
  afterEach(() => {
    jest.useRealTimers();
  });
  beforeEach(() => {
    connectedProfile = null;
    fetchingProfile = false;
    pathname = "/";
    performanceConsent = undefined;
    searchParams = new URLSearchParams();
    clearIdentityMock.mockReset();
    disableAnalyticsMock.mockReset();
    identifyMock.mockReset().mockReturnValue(true);
    initAnalyticsMock.mockReset();
    isAnalyticsTrackingAllowedMock.mockReset().mockReturnValue(true);
    trackPageViewMock.mockReset().mockReturnValue(true);
    recoveryListeners.clear();
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

  it("caches only successful identity setup across profile changes", () => {
    performanceConsent = true;
    connectedProfile = { id: 42 };
    identifyMock.mockReturnValueOnce(false);

    const { rerender } = render(<MixpanelSetup />);

    expect(identifyMock).toHaveBeenCalledTimes(1);
    connectedProfile = null;
    rerender(<MixpanelSetup />);
    expect(clearIdentityMock).not.toHaveBeenCalled();
    connectedProfile = { id: 42 };
    rerender(<MixpanelSetup />);

    expect(identifyMock).toHaveBeenCalledTimes(2);
    expect(identifyMock).toHaveBeenNthCalledWith(1, "42");
    expect(identifyMock).toHaveBeenNthCalledWith(2, "42");
    rerender(<MixpanelSetup />);
    expect(identifyMock).toHaveBeenCalledTimes(2);
    connectedProfile = null;
    rerender(<MixpanelSetup />);
    expect(clearIdentityMock).toHaveBeenCalledTimes(1);
  });

  it("reinitializes and retries a failed switch while the new profile remains selected", () => {
    jest.useFakeTimers();
    performanceConsent = true;
    connectedProfile = { id: 42 };
    const { rerender } = render(<MixpanelSetup />);

    identifyMock.mockReturnValueOnce(false);
    connectedProfile = { id: 43 };
    rerender(<MixpanelSetup />);
    act(() => jest.advanceTimersByTime(999));
    expect(identifyMock).toHaveBeenCalledTimes(2);
    act(() => jest.advanceTimersByTime(1));
    expect(initAnalyticsMock).toHaveBeenCalledTimes(2);
    expect(identifyMock).toHaveBeenNthCalledWith(3, "43");
    act(() => jest.advanceTimersByTime(60000));
    expect(identifyMock).toHaveBeenCalledTimes(3);
  });

  it("retries a dropped page view and notifies visibility observers after identity recovery", () => {
    jest.useFakeTimers();
    performanceConsent = true;
    connectedProfile = { id: 42 };
    identifyMock.mockReturnValueOnce(false);
    trackPageViewMock.mockReturnValueOnce(false);
    const onReset = jest.fn();
    const unsubscribe = subscribeWaveFeatureVisitReset(onReset);
    try {
      const { rerender } = render(<MixpanelSetup />);
      expect(trackPageViewMock).toHaveBeenCalledTimes(1);
      onReset.mockClear();
      act(() => jest.advanceTimersByTime(1000));
      expect(identifyMock).toHaveBeenCalledTimes(2);
      expect(onReset).toHaveBeenCalled();
      expect(trackPageViewMock).toHaveBeenCalledTimes(2);
      rerender(<MixpanelSetup />);
      expect(trackPageViewMock).toHaveBeenCalledTimes(2);
    } finally {
      unsubscribe();
    }
  });

  it("bounds retries when identity setup keeps failing", () => {
    jest.useFakeTimers();
    performanceConsent = true;
    connectedProfile = { id: 42 };
    identifyMock.mockReturnValue(false);
    render(<MixpanelSetup />);

    act(() => jest.advanceTimersByTime(60000));
    expect(initAnalyticsMock).toHaveBeenCalledTimes(3);
    expect(identifyMock).toHaveBeenCalledTimes(3);
  });

  it("recovers failed guest initialization without a route or consent change", () => {
    jest.useFakeTimers();
    performanceConsent = true;
    pathname = "/waves";
    isAnalyticsTrackingAllowedMock.mockReturnValueOnce(false);
    trackPageViewMock.mockReturnValueOnce(false);
    const onReset = jest.fn();
    const unsubscribe = subscribeWaveFeatureVisitReset(onReset);
    try {
      const { rerender } = render(<MixpanelSetup />);
      expect(initAnalyticsMock).toHaveBeenCalledTimes(1);
      expect(trackPageViewMock).toHaveBeenCalledTimes(1);
      onReset.mockClear();
      act(() => jest.advanceTimersByTime(999));
      expect(initAnalyticsMock).toHaveBeenCalledTimes(1);
      act(() => jest.advanceTimersByTime(1));
      expect(initAnalyticsMock).toHaveBeenCalledTimes(2);
      expect(identifyMock).not.toHaveBeenCalled();
      expect(onReset).toHaveBeenCalled();
      expect(trackPageViewMock).toHaveBeenCalledTimes(2);
      expect(trackPageViewMock).toHaveBeenLastCalledWith("/waves", {
        has_connected_profile: false,
        logical_page: "waves_index",
        page_group: "waves",
        route_pattern: "/waves",
      });
      rerender(<MixpanelSetup />);
      act(() => jest.advanceTimersByTime(60000));
      expect(initAnalyticsMock).toHaveBeenCalledTimes(2);
      expect(trackPageViewMock).toHaveBeenCalledTimes(2);
    } finally {
      unsubscribe();
    }
  });

  it("bounds guest initialization retries when delivery stays closed", () => {
    jest.useFakeTimers();
    performanceConsent = true;
    isAnalyticsTrackingAllowedMock.mockReturnValue(false);
    trackPageViewMock.mockReturnValue(false);
    render(<MixpanelSetup />);

    act(() => jest.advanceTimersByTime(1000));
    expect(initAnalyticsMock).toHaveBeenCalledTimes(2);
    act(() => jest.advanceTimersByTime(4999));
    expect(initAnalyticsMock).toHaveBeenCalledTimes(2);
    act(() => jest.advanceTimersByTime(1));
    expect(initAnalyticsMock).toHaveBeenCalledTimes(3);
    act(() => jest.advanceTimersByTime(60000));
    expect(initAnalyticsMock).toHaveBeenCalledTimes(3);
    expect(identifyMock).not.toHaveBeenCalled();
    expect(trackPageViewMock).toHaveBeenCalledTimes(1);
  });

  it.each([null, { id: 42 }])(
    "recovers current identity and a dropped page view after slow queue clearing (%p)",
    (profile) => {
      jest.useFakeTimers();
      connectedProfile = profile;
      performanceConsent = true;
      isAnalyticsTrackingAllowedMock.mockReturnValue(false);
      identifyMock.mockReturnValue(false);
      trackPageViewMock.mockReturnValueOnce(false);
      render(<MixpanelSetup />);
      act(() => jest.advanceTimersByTime(60000));
      expect(initAnalyticsMock).toHaveBeenCalledTimes(3);
      isAnalyticsTrackingAllowedMock.mockReturnValue(true);
      identifyMock.mockReturnValue(true);
      act(() => recoveryListeners.forEach((listener) => listener()));
      expect(initAnalyticsMock).toHaveBeenCalledTimes(4);
      if (profile) expect(identifyMock).toHaveBeenLastCalledWith("42");
      else expect(identifyMock).not.toHaveBeenCalled();
      expect(trackPageViewMock).toHaveBeenCalledTimes(2);
      act(() => recoveryListeners.forEach((listener) => listener()));
      expect(initAnalyticsMock).toHaveBeenCalledTimes(4);
    }
  );

  it.each(["consent", "profile", "unmount"] as const)(
    "cancels deferred queue recovery after %s changes",
    (change) => {
      performanceConsent = true;
      connectedProfile = { id: 42 };
      identifyMock.mockReturnValue(false);
      const { rerender, unmount } = render(<MixpanelSetup />);
      const previousListeners = [...recoveryListeners];
      if (change === "unmount") unmount();
      else {
        if (change === "consent") performanceConsent = false;
        else connectedProfile = { id: 43 };
        rerender(<MixpanelSetup />);
      }
      expect(
        previousListeners.every((listener) => !recoveryListeners.has(listener))
      ).toBe(true);
      const previousCalls = initAnalyticsMock.mock.calls.length;
      identifyMock.mockReturnValue(true);
      act(() => recoveryListeners.forEach((listener) => listener()));
      expect(initAnalyticsMock).toHaveBeenCalledTimes(
        previousCalls + (change === "profile" ? 1 : 0)
      );
      if (change === "profile")
        expect(identifyMock).toHaveBeenLastCalledWith("43");
    }
  );

  it.each(["consent", "profile", "unmount"] as const)(
    "cancels guest initialization retry after %s changes",
    (change) => {
      jest.useFakeTimers();
      performanceConsent = true;
      isAnalyticsTrackingAllowedMock.mockReturnValue(false);
      const { rerender, unmount } = render(<MixpanelSetup />);

      if (change === "unmount") {
        unmount();
      } else {
        if (change === "consent") performanceConsent = false;
        else connectedProfile = { id: 42 };
        rerender(<MixpanelSetup />);
      }
      act(() => jest.advanceTimersByTime(60000));
      expect(initAnalyticsMock).toHaveBeenCalledTimes(1);
      if (change === "profile") expect(identifyMock).toHaveBeenCalledWith("42");
      else expect(identifyMock).not.toHaveBeenCalled();
    }
  );

  it.each(["consent", "profile", "unmount"] as const)(
    "cancels failed-profile retry after %s changes",
    (change) => {
      jest.useFakeTimers();
      performanceConsent = true;
      connectedProfile = { id: 42 };
      identifyMock.mockReturnValueOnce(false);
      const { rerender, unmount } = render(<MixpanelSetup />);

      if (change === "unmount") {
        unmount();
      } else {
        if (change === "consent") performanceConsent = false;
        else connectedProfile = { id: 43 };
        rerender(<MixpanelSetup />);
      }
      act(() => jest.advanceTimersByTime(60000));
      expect(
        identifyMock.mock.calls.filter(([id]) => id === "42")
      ).toHaveLength(1);
      expect(initAnalyticsMock).toHaveBeenCalledTimes(1);
      if (change === "profile")
        expect(identifyMock).toHaveBeenLastCalledWith("43");
    }
  );

  it("tracks drop detail views separately when the drop query changes", () => {
    performanceConsent = true;
    pathname = "/waves/wave-1";
    searchParams = new URLSearchParams("drop=drop-1");

    const { rerender } = render(<MixpanelSetup />);

    expect(trackPageViewMock).toHaveBeenCalledWith(
      "/waves/:waveId?drop=:dropId",
      {
        has_connected_profile: false,
        logical_page: "wave_drop_detail",
        page_group: "waves",
        route_pattern: "/waves/:waveId?drop=:dropId",
      }
    );

    searchParams = new URLSearchParams("drop=drop-2");
    rerender(<MixpanelSetup />);

    expect(trackPageViewMock).toHaveBeenCalledTimes(2);
    expect(trackPageViewMock).toHaveBeenLastCalledWith(
      "/waves/:waveId?drop=:dropId",
      {
        has_connected_profile: false,
        logical_page: "wave_drop_detail",
        page_group: "waves",
        route_pattern: "/waves/:waveId?drop=:dropId",
      }
    );
  });

  it("normalizes dynamic fallback routes while keeping navigation tracking distinct", () => {
    performanceConsent = true;
    pathname = "/nextgen/token/private-token-one";

    const { rerender } = render(<MixpanelSetup />);

    expect(trackPageViewMock).toHaveBeenCalledWith(
      "/nextgen/token/[token]/[[...view]]",
      {
        has_connected_profile: false,
        logical_page: "nextgen_token_token_view",
        page_group: "nextgen",
        route_pattern: "/nextgen/token/[token]/[[...view]]",
      }
    );

    pathname = "/nextgen/token/private-token-two";
    rerender(<MixpanelSetup />);

    expect(trackPageViewMock).toHaveBeenCalledTimes(2);
    expect(trackPageViewMock).toHaveBeenLastCalledWith(
      "/nextgen/token/[token]/[[...view]]",
      {
        has_connected_profile: false,
        logical_page: "nextgen_token_token_view",
        page_group: "nextgen",
        route_pattern: "/nextgen/token/[token]/[[...view]]",
      }
    );
    expect(JSON.stringify(trackPageViewMock.mock.calls)).not.toContain(
      "private-token-one"
    );
    expect(JSON.stringify(trackPageViewMock.mock.calls)).not.toContain(
      "private-token-two"
    );
  });

  it.each([
    ["/about/mission", "about_mission", "about"],
    ["/discover", "discover", "discover"],
    ["/join", "join", "join"],
    ["/join-6529", "join_6529", "join_6529"],
  ])(
    "preserves static fallback route values for %s",
    (staticPath, logicalPage, pageGroup) => {
      performanceConsent = true;
      pathname = staticPath;

      render(<MixpanelSetup />);

      expect(trackPageViewMock).toHaveBeenCalledWith(staticPath, {
        has_connected_profile: false,
        logical_page: logicalPage,
        page_group: pageGroup,
        route_pattern: staticPath,
      });
    }
  );

  it("tracks anonymous profile views separately from signed-in viewers", () => {
    performanceConsent = true;
    pathname = "/alice/collected";

    render(<MixpanelSetup />);

    expect(trackPageViewMock).toHaveBeenCalledWith("/:handle/collected", {
      has_connected_profile: false,
      logical_page: "profile_collected",
      page_group: "profile",
      profile_viewer_context: "anonymous",
      route_pattern: "/:handle/collected",
    });
  });

  it("marks own profile tabs as self views", () => {
    performanceConsent = true;
    pathname = "/alice/collected";
    connectedProfile = {
      id: 42,
      normalised_handle: "alice",
      wallets: [],
    };

    render(<MixpanelSetup />);

    expect(trackPageViewMock).toHaveBeenCalledWith("/:handle/collected", {
      has_connected_profile: true,
      logical_page: "profile_collected",
      page_group: "profile",
      profile_viewer_context: "self",
      route_pattern: "/:handle/collected",
    });
  });

  it("marks other users' profile tabs as other views", () => {
    performanceConsent = true;
    pathname = "/bob/collected";
    connectedProfile = {
      id: 42,
      normalised_handle: "alice",
      wallets: [{ wallet: "0xabc" }],
    };

    render(<MixpanelSetup />);

    expect(trackPageViewMock).toHaveBeenCalledWith("/:handle/collected", {
      has_connected_profile: true,
      logical_page: "profile_collected",
      page_group: "profile",
      profile_viewer_context: "other",
      route_pattern: "/:handle/collected",
    });
  });

  it("waits for profile ownership data before tracking profile page views", () => {
    performanceConsent = true;
    pathname = "/alice/collected";
    fetchingProfile = true;

    const { rerender } = render(<MixpanelSetup />);

    expect(trackPageViewMock).not.toHaveBeenCalled();

    fetchingProfile = false;
    connectedProfile = {
      id: 42,
      normalised_handle: "alice",
      wallets: [],
    };
    rerender(<MixpanelSetup />);

    expect(trackPageViewMock).toHaveBeenCalledTimes(1);
    expect(trackPageViewMock).toHaveBeenCalledWith("/:handle/collected", {
      has_connected_profile: true,
      logical_page: "profile_collected",
      page_group: "profile",
      profile_viewer_context: "self",
      route_pattern: "/:handle/collected",
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
