import {
  CookieConsentProvider,
  useCookieConsent,
} from "@/components/cookies/CookieConsentContext";
import { scheduleGoogleAnalytics } from "@/components/cookies/googleAnalytics";
import {
  CONSENT_ESSENTIAL_COOKIE,
  CONSENT_PERFORMANCE_COOKIE,
} from "@/constants/constants";
import * as api from "@/services/api/common-api";
import { act, render, screen, waitFor } from "@testing-library/react";
import Cookies from "js-cookie";

jest.mock("js-cookie", () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

jest.mock("@/components/auth/Auth", () => {
  const authValue = { setToast: jest.fn() };
  return { useAuth: () => authValue };
});

jest.mock("@/components/cookies/googleAnalytics", () => ({
  scheduleGoogleAnalytics: jest.fn(),
}));

const mockSchedule = scheduleGoogleAnalytics as jest.MockedFunction<
  typeof scheduleGoogleAnalytics
>;

// Cookie jar shared by the js-cookie mock, so writes are visible to reads.
let cookieJar: Record<string, string> = {};

const ConsentButtons = () => {
  const { consent, reject, country } = useCookieConsent();
  return (
    <div>
      <p>Country: {country || "unknown"}</p>
      <button onClick={consent}>Test accept</button>
      <button onClick={reject}>Test reject</button>
    </div>
  );
};

const renderProvider = () =>
  render(
    <CookieConsentProvider>
      <ConsentButtons />
    </CookieConsentProvider>
  );

const mockCountry = (isEu: boolean, country = isEu ? "DE" : "US") => {
  (api.commonApiFetch as jest.Mock).mockResolvedValue({
    is_eu: isEu,
    is_consent: false,
    country,
  });
};

describe("CookieConsentProvider Google Analytics consent", () => {
  let cancel: jest.Mock<boolean, []>;

  beforeEach(() => {
    jest.clearAllMocks();
    cookieJar = {};
    (Cookies.get as jest.Mock).mockImplementation(
      (name: string) => cookieJar[name]
    );
    (Cookies.set as jest.Mock).mockImplementation(
      (name: string, value: string) => {
        cookieJar[name] = value;
      }
    );
    (api.commonApiPost as jest.Mock).mockResolvedValue({});
    (api.commonApiDelete as jest.Mock).mockResolvedValue({});
    cancel = jest.fn(() => true);
    mockSchedule.mockImplementation(() => cancel);
  });

  it("schedules nothing for an EU visitor who has not decided", async () => {
    mockCountry(true);
    renderProvider();

    expect(await screen.findByText("Country: DE")).toBeInTheDocument();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("schedules Google Analytics once a non-EU visitor is auto-consented", async () => {
    mockCountry(false);
    renderProvider();

    await waitFor(() => expect(mockSchedule).toHaveBeenCalledTimes(1));
    const hasConsent = mockSchedule.mock.calls[0]?.[0];
    expect(hasConsent?.()).toBe(true);

    cookieJar[CONSENT_PERFORMANCE_COOKIE] = "false";
    expect(hasConsent?.()).toBe(false);
  });

  it("schedules a returning consented visitor before the country check returns", () => {
    cookieJar[CONSENT_ESSENTIAL_COOKIE] = "true";
    cookieJar[CONSENT_PERFORMANCE_COOKIE] = "true";
    (api.commonApiFetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderProvider();

    expect(mockSchedule).toHaveBeenCalledTimes(1);
  });

  it("never schedules for an EU visitor who rejected performance cookies", async () => {
    cookieJar[CONSENT_ESSENTIAL_COOKIE] = "true";
    cookieJar[CONSENT_PERFORMANCE_COOKIE] = "false";
    mockCountry(true);
    renderProvider();

    expect(await screen.findByText("Country: DE")).toBeInTheDocument();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("schedules after an EU visitor accepts and cancels when they reject before it loads", async () => {
    mockCountry(true);
    renderProvider();
    expect(await screen.findByText("Country: DE")).toBeInTheDocument();

    await act(async () => {
      screen.getByText("Test accept").click();
    });
    expect(mockSchedule).toHaveBeenCalledTimes(1);

    await act(async () => {
      screen.getByText("Test reject").click();
    });
    expect(cancel).toHaveBeenCalledTimes(1);

    // A load cancelled before it started can be scheduled by a new consent.
    await act(async () => {
      screen.getByText("Test accept").click();
    });
    expect(mockSchedule).toHaveBeenCalledTimes(2);
  });

  it("does not schedule again after Google Analytics has loaded", async () => {
    cancel.mockReturnValue(false);
    mockCountry(true);
    renderProvider();
    expect(await screen.findByText("Country: DE")).toBeInTheDocument();

    await act(async () => {
      screen.getByText("Test accept").click();
    });
    await act(async () => {
      screen.getByText("Test reject").click();
    });
    await act(async () => {
      screen.getByText("Test accept").click();
    });

    expect(mockSchedule).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending load on unmount", () => {
    cookieJar[CONSENT_ESSENTIAL_COOKIE] = "true";
    cookieJar[CONSENT_PERFORMANCE_COOKIE] = "true";
    (api.commonApiFetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { unmount } = renderProvider();

    unmount();

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("schedules nothing when the provider is disabled", () => {
    cookieJar[CONSENT_PERFORMANCE_COOKIE] = "true";
    render(
      <CookieConsentProvider disabled>
        <ConsentButtons />
      </CookieConsentProvider>
    );

    expect(mockSchedule).not.toHaveBeenCalled();
  });
});
