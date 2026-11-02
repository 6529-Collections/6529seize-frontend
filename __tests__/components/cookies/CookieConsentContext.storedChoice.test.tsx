import {
  CookieConsentProvider,
  useCookieConsent,
} from "@/components/cookies/CookieConsentContext";
import MixpanelSetup from "@/components/providers/MixpanelSetup";
import {
  CONSENT_ESSENTIAL_COOKIE,
  CONSENT_PERFORMANCE_COOKIE,
} from "@/constants/constants";
import * as api from "@/services/api/common-api";
import {
  act,
  configure,
  fireEvent,
  render,
  type RenderResult,
  screen,
  waitFor,
} from "@testing-library/react";
import Cookies from "js-cookie";

// Leave room for a busy CI runner; every wait still ends as soon as it passes.
configure({ asyncUtilTimeout: 5_000 });

// A stateful cookie jar, so a "reload" (unmount and render again) sees what
// the previous page load stored.
const mockCookieJar = new Map<string, string>();

jest.mock("js-cookie", () => ({
  get: jest.fn((name: string) => mockCookieJar.get(name)),
  set: jest.fn((name: string, value: string) => {
    mockCookieJar.set(name, value);
  }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

jest.mock("@/components/auth/Auth", () => {
  const React = require("react");
  const authValue = {
    setToast: jest.fn(),
    connectedProfile: null,
    fetchingProfile: false,
  };
  return {
    AuthContext: React.createContext(authValue),
    useAuth: () => authValue,
  };
});

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const mockInitAnalytics = jest.fn();
const mockDisableAnalytics = jest.fn();

jest.mock("@/services/analytics/mixpanel", () => ({
  clearIdentity: jest.fn(),
  disableAnalytics: (...args: unknown[]) => mockDisableAnalytics(...args),
  identify: jest.fn(() => true),
  initAnalytics: (...args: unknown[]) => mockInitAnalytics(...args),
  isAnalyticsTrackingAllowed: jest.fn(() => true),
  trackPageView: jest.fn(() => true),
  subscribeAnalyticsRecovery: jest.fn(() => () => undefined),
}));

const ConsentProbe = () => {
  const {
    consent,
    reject,
    showCookieConsent,
    performanceConsent,
    isCountryPending,
  } = useCookieConsent();
  return (
    <div>
      <p>Performance consent: {String(performanceConsent)}</p>
      <p>Banner: {String(showCookieConsent)}</p>
      <p>Country pending: {String(isCountryPending)}</p>
      <button type="button" onClick={consent}>
        Probe accept
      </button>
      <button type="button" onClick={reject}>
        Probe reject
      </button>
    </div>
  );
};

const renderPageLoad = () =>
  render(
    <CookieConsentProvider>
      <MixpanelSetup />
      <ConsentProbe />
    </CookieConsentProvider>
  );

const mockCountry = (isEu: boolean, country: string) => {
  (api.commonApiFetch as jest.Mock).mockResolvedValue({
    is_eu: isEu,
    is_consent: false,
    country,
  });
};

const waitForCountryCheck = async () => {
  expect(await screen.findByText("Country pending: false")).toBeInTheDocument();
};

const googleTagScripts = () =>
  document.head.querySelectorAll('script[src*="googletagmanager.com"]');

const storeChoice = (performance: "true" | "false") => {
  mockCookieJar.set(CONSENT_ESSENTIAL_COOKIE, "true");
  mockCookieJar.set(CONSENT_PERFORMANCE_COOKIE, performance);
};

const removeHeadScripts = () => {
  document.head.querySelectorAll("script").forEach((script) => script.remove());
};

// A reload keeps the cookie jar but starts with a fresh document head and a
// fresh call history.
const reload = (previousPageLoad: RenderResult) => {
  previousPageLoad.unmount();
  removeHeadScripts();
  jest.clearAllMocks();
  return renderPageLoad();
};

const expectAnalyticsNeverStarted = () => {
  expect(screen.getByText("Performance consent: false")).toBeInTheDocument();
  expect(mockInitAnalytics).not.toHaveBeenCalled();
  expect(mockDisableAnalytics).toHaveBeenCalled();
  expect(googleTagScripts()).toHaveLength(0);
};

describe("CookieConsentProvider stored consent choice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookieJar.clear();
    removeHeadScripts();
  });

  describe("outside the EU", () => {
    beforeEach(() => {
      mockCountry(false, "US");
    });

    it("stores the 7-day default and starts analytics on a first visit", async () => {
      const lookup: { resolve?: (value: unknown) => void } = {};
      (api.commonApiFetch as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          lookup.resolve = resolve;
        })
      );
      renderPageLoad();

      // Nothing starts before the country is known.
      expect(
        screen.getByText("Performance consent: undefined")
      ).toBeInTheDocument();
      expect(mockInitAnalytics).not.toHaveBeenCalled();
      expect(Cookies.set).not.toHaveBeenCalled();

      await act(async () => {
        lookup.resolve?.({ is_eu: false, is_consent: false, country: "US" });
      });

      expect(
        await screen.findByText("Performance consent: true")
      ).toBeInTheDocument();
      expect(Cookies.set).toHaveBeenCalledTimes(2);
      expect(Cookies.set).toHaveBeenCalledWith(
        CONSENT_ESSENTIAL_COOKIE,
        "true",
        { expires: 7 }
      );
      expect(Cookies.set).toHaveBeenCalledWith(
        CONSENT_PERFORMANCE_COOKIE,
        "true",
        { expires: 7 }
      );
      expect(mockInitAnalytics).toHaveBeenCalled();
      expect(screen.getByText("Banner: false")).toBeInTheDocument();
    });

    it("keeps a stored rejection across reloads and never starts analytics", async () => {
      storeChoice("false");

      let pageLoad = renderPageLoad();
      for (let loadCount = 1; loadCount <= 2; loadCount += 1) {
        if (loadCount > 1) {
          pageLoad = reload(pageLoad);
        }
        await waitForCountryCheck();

        expect(api.commonApiFetch).toHaveBeenCalledTimes(1);
        expect(Cookies.set).not.toHaveBeenCalled();
        expect(mockCookieJar.get(CONSENT_PERFORMANCE_COOKIE)).toBe("false");
        expect(screen.getByText("Banner: false")).toBeInTheDocument();
        expectAnalyticsNeverStarted();
      }
    });

    it("keeps a stored acceptance without shortening it to the default", async () => {
      storeChoice("true");
      renderPageLoad();

      // A stored acceptance applies immediately, before the country check.
      expect(screen.getByText("Performance consent: true")).toBeInTheDocument();
      await waitForCountryCheck();

      expect(Cookies.set).not.toHaveBeenCalled();
      expect(mockCookieJar.get(CONSENT_PERFORMANCE_COOKIE)).toBe("true");
      expect(screen.getByText("Performance consent: true")).toBeInTheDocument();
      expect(mockInitAnalytics).toHaveBeenCalled();
    });

    it("keeps a rejection made after the default and an acceptance made after that", async () => {
      (api.commonApiDelete as jest.Mock).mockResolvedValue(undefined);
      (api.commonApiPost as jest.Mock).mockResolvedValue(undefined);

      const firstVisit = renderPageLoad();
      await waitForCountryCheck();
      expect(screen.getByText("Performance consent: true")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Probe reject" }));
      expect(
        await screen.findByText("Performance consent: false")
      ).toBeInTheDocument();
      expect(Cookies.set).toHaveBeenLastCalledWith(
        CONSENT_PERFORMANCE_COOKIE,
        "false",
        { expires: 365 }
      );

      const afterReject = reload(firstVisit);
      await waitForCountryCheck();
      expect(Cookies.set).not.toHaveBeenCalled();
      expect(mockCookieJar.get(CONSENT_PERFORMANCE_COOKIE)).toBe("false");
      expectAnalyticsNeverStarted();

      fireEvent.click(screen.getByRole("button", { name: "Probe accept" }));
      expect(
        await screen.findByText("Performance consent: true")
      ).toBeInTheDocument();
      expect(Cookies.set).toHaveBeenLastCalledWith(
        CONSENT_PERFORMANCE_COOKIE,
        "true",
        { expires: 365 }
      );
      await waitFor(() => expect(mockInitAnalytics).toHaveBeenCalled());

      reload(afterReject);
      await waitForCountryCheck();
      expect(Cookies.set).not.toHaveBeenCalled();
      expect(mockCookieJar.get(CONSENT_PERFORMANCE_COOKIE)).toBe("true");
      expect(screen.getByText("Performance consent: true")).toBeInTheDocument();
    });
  });

  describe("inside the EU", () => {
    beforeEach(() => {
      mockCountry(true, "DE");
    });

    it("shows the banner and starts nothing before a choice", async () => {
      renderPageLoad();
      await waitForCountryCheck();

      expect(screen.getByText("Banner: true")).toBeInTheDocument();
      expect(
        screen.getByText("Performance consent: undefined")
      ).toBeInTheDocument();
      expect(Cookies.set).not.toHaveBeenCalled();
      expect(mockInitAnalytics).not.toHaveBeenCalled();
      expect(googleTagScripts()).toHaveLength(0);
    });

    it("keeps a stored rejection without showing the banner", async () => {
      storeChoice("false");
      renderPageLoad();
      await waitForCountryCheck();

      expect(screen.getByText("Banner: false")).toBeInTheDocument();
      expect(Cookies.set).not.toHaveBeenCalled();
      expectAnalyticsNeverStarted();
    });
  });
});
