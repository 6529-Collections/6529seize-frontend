import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import {
  CookieConsentProvider,
  useCookieConsent,
} from "../../../components/cookies/CookieConsentContext";
import Cookies from "js-cookie";
import {
  CONSENT_ESSENTIAL_COOKIE,
  CONSENT_PERFORMANCE_COOKIE,
} from "../../../constants";
import * as api from "../../../services/api/common-api";

// Mock APIs and Cookies
jest.mock("js-cookie", () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock("../../../services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

jest.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/",
    push: jest.fn(),
    replace: jest.fn(),
    query: {},
  }),
}));

// Mock AuthContext
jest.mock("../../../components/auth/Auth", () => ({
  AuthContext: React.createContext({
    setToast: jest.fn(),
  }),
}));

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
