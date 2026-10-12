import {
  CookieConsentProvider,
  useCookieConsent,
} from "@/components/cookies/CookieConsentContext";
import {
  CONSENT_ESSENTIAL_COOKIE,
  CONSENT_PERFORMANCE_COOKIE,
} from "@/constants/constants";
import * as api from "@/services/api/common-api";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Cookies from "js-cookie";
import React from "react";

// Mock APIs and Cookies
jest.mock("js-cookie", () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

// Mock AuthContext
jest.mock("@/components/auth/Auth", () => {
  const React = require("react");
  const authValue = {
    setToast: jest.fn(),
  };
  return {
    AuthContext: React.createContext(authValue),
    useAuth: () => authValue,
  };
});

// Dummy component using the context
const DummyConsumer = () => {
  const { consent, reject, showCookieConsent, country } = useCookieConsent();
  return (
    <div>
      <p>Show: {String(showCookieConsent)}</p>
      <p>Country: {country}</p>
      <button onClick={consent}>Consent</button>
      <button onClick={reject}>Reject</button>
    </div>
  );
};

const CountryConsumer = () => {
  const { country, isCountryPending } = useCookieConsent();
  return (
    <p>
      Country: {country || "unknown"} / pending: {String(isCountryPending)}
    </p>
  );
};

describe("CookieConsentProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders and loads cookie consent banner for EU users", async () => {
    (Cookies.get as jest.Mock).mockImplementation((name) => undefined);
    (api.commonApiFetch as jest.Mock).mockResolvedValue({
      is_eu: true,
      is_consent: false,
      country: "DE",
    });

    render(
      <CookieConsentProvider>
        <DummyConsumer />
      </CookieConsentProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Show: true")).toBeInTheDocument();
      expect(screen.getByText("Country: DE")).toBeInTheDocument();
    });
  });

  it("auto-consents for non-EU users", async () => {
    (Cookies.get as jest.Mock).mockImplementation(() => undefined);
    (api.commonApiFetch as jest.Mock).mockResolvedValue({
      is_eu: false,
      is_consent: false,
      country: "US",
    });

    render(
      <CookieConsentProvider>
        <DummyConsumer />
      </CookieConsentProvider>
    );

    await waitFor(() => {
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
    });
  });

  it("calls API and sets cookies on consent", async () => {
    render(
      <CookieConsentProvider>
        <DummyConsumer />
      </CookieConsentProvider>
    );

    fireEvent.click(screen.getByText("Consent"));

    await waitFor(() => {
      expect(api.commonApiPost).toHaveBeenCalledWith({
        endpoint: "policies/cookies-consent",
        body: {},
      });
      expect(Cookies.set).toHaveBeenCalledWith(
        CONSENT_ESSENTIAL_COOKIE,
        "true",
        { expires: 365 }
      );
      expect(Cookies.set).toHaveBeenCalledWith(
        CONSENT_PERFORMANCE_COOKIE,
        "true",
        { expires: 365 }
      );
    });
  });

  it("calls API and sets cookies on reject", async () => {
    render(
      <CookieConsentProvider>
        <DummyConsumer />
      </CookieConsentProvider>
    );

    fireEvent.click(screen.getByText("Reject"));

    await waitFor(() => {
      expect(api.commonApiDelete).toHaveBeenCalledWith({
        endpoint: "policies/cookies-consent",
      });
      expect(Cookies.set).toHaveBeenCalledWith(
        CONSENT_ESSENTIAL_COOKIE,
        "true",
        { expires: 365 }
      );
      expect(Cookies.set).toHaveBeenCalledWith(
        CONSENT_PERFORMANCE_COOKIE,
        "false",
        { expires: 365 }
      );
    });
  });

  it("throws error when useCookieConsent is used outside provider", () => {
    const ErrorComponent = () => {
      useCookieConsent(); // this should throw inside the component
      return <div />;
    };

    // Silence React's console error
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<ErrorComponent />)).toThrow(
      "useCookieConsent must be used within a CookieConsentProvider"
    );

    consoleError.mockRestore();
  });
});

describe("CookieConsentProvider country check state", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Cookies.get as jest.Mock).mockImplementation(() => undefined);
  });

  it("stays pending until the lookup returns a country", async () => {
    const lookup: { resolve?: (value: unknown) => void } = {};
    (api.commonApiFetch as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        lookup.resolve = resolve;
      })
    );

    render(
      <CookieConsentProvider>
        <CountryConsumer />
      </CookieConsentProvider>
    );

    expect(
      screen.getByText("Country: unknown / pending: true")
    ).toBeInTheDocument();

    lookup.resolve?.({ is_eu: true, is_consent: false, country: "US" });

    expect(
      await screen.findByText("Country: US / pending: false")
    ).toBeInTheDocument();
  });

  it("settles as unknown when the lookup fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    (api.commonApiFetch as jest.Mock).mockRejectedValue(new Error("offline"));

    render(
      <CookieConsentProvider>
        <CountryConsumer />
      </CookieConsentProvider>
    );

    expect(
      await screen.findByText("Country: unknown / pending: false")
    ).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("is never pending when the provider is disabled", () => {
    render(
      <CookieConsentProvider disabled>
        <CountryConsumer />
      </CookieConsentProvider>
    );

    expect(
      screen.getByText("Country: US / pending: false")
    ).toBeInTheDocument();
    expect(api.commonApiFetch).not.toHaveBeenCalled();
  });
});

describe("CookieConsentProvider country check timeout", () => {
  const renderProvider = () =>
    render(
      <CookieConsentProvider>
        <CountryConsumer />
      </CookieConsentProvider>
    );

  const lookupSignal = (): AbortSignal => {
    const [request] = (api.commonApiFetch as jest.Mock).mock.calls[0] as [
      { signal: AbortSignal },
    ];
    return request.signal;
  };

  let consoleError: jest.SpyInstance;
  let setTimeoutSpy: jest.SpyInstance;
  let clearTimeoutSpy: jest.SpyInstance;

  const expectCountryTimeoutCleared = () => {
    const timeoutIndex = setTimeoutSpy.mock.calls.findIndex(
      ([, delay]) => delay === 5_000
    );
    expect(timeoutIndex).toBeGreaterThanOrEqual(0);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(
      setTimeoutSpy.mock.results[timeoutIndex]?.value
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    setTimeoutSpy = jest.spyOn(globalThis, "setTimeout");
    clearTimeoutSpy = jest.spyOn(globalThis, "clearTimeout");
    (Cookies.get as jest.Mock).mockImplementation(() => undefined);
    consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
    jest.useRealTimers();
    consoleError.mockRestore();
  });

  it("settles a stalled lookup as unknown after five seconds", async () => {
    (api.commonApiFetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderProvider();

    await act(async () => {
      jest.advanceTimersByTime(4_999);
    });
    expect(
      screen.getByText("Country: unknown / pending: true")
    ).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(
      screen.getByText("Country: unknown / pending: false")
    ).toBeInTheDocument();
    expect(lookupSignal().aborted).toBe(true);
  });

  it("clears the timeout after a fast response so it cannot override it", async () => {
    (api.commonApiFetch as jest.Mock).mockResolvedValue({
      is_eu: true,
      is_consent: false,
      country: "US",
    });
    renderProvider();

    await act(async () => {});
    expect(screen.getByText("Country: US / pending: false")).toBeInTheDocument();
    expectCountryTimeoutCleared();

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(screen.getByText("Country: US / pending: false")).toBeInTheDocument();
    expect(lookupSignal().aborted).toBe(false);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("cancels the lookup and its timeout on unmount", async () => {
    (api.commonApiFetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { unmount } = renderProvider();

    unmount();
    await act(async () => {});

    expect(lookupSignal().aborted).toBe(true);
    expectCountryTimeoutCleared();

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(consoleError).not.toHaveBeenCalled();
  });
});
