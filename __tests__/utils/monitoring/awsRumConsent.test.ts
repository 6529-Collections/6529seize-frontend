import {
  clearAwsRumCookies,
  hasAwsRumPerformanceConsent,
} from "@/utils/monitoring/awsRumConsent";

let mockStoredPerformanceConsent: boolean | undefined;

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  getCookieConsentByName: () => mockStoredPerformanceConsent,
}));

const hasCookie = (name: string): boolean =>
  document.cookie.split("; ").some((cookie) => cookie.startsWith(`${name}=`));

const expireCookie = (name: string): void => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

describe("hasAwsRumPerformanceConsent", () => {
  beforeEach(() => {
    mockStoredPerformanceConsent = undefined;
  });

  it.each([
    [true, true],
    [false, false],
  ])(
    "follows a reported performance choice of %s",
    (performanceConsent, expected) => {
      mockStoredPerformanceConsent = !performanceConsent;
      expect(hasAwsRumPerformanceConsent({ performanceConsent })).toBe(
        expected
      );
    }
  );

  it.each([
    [true, true],
    [false, false],
    [undefined, false],
  ])(
    "uses the stored choice (%s) until the provider reports one",
    (stored, expected) => {
      mockStoredPerformanceConsent = stored;
      expect(
        hasAwsRumPerformanceConsent({ performanceConsent: undefined })
      ).toBe(expected);
    }
  );

  it("fails closed without a cookie consent provider", () => {
    mockStoredPerformanceConsent = true;
    expect(hasAwsRumPerformanceConsent(undefined)).toBe(false);
  });
});

describe("clearAwsRumCookies", () => {
  afterEach(() => {
    expireCookie("cwr_u");
    expireCookie("cwr_s");
    expireCookie("performance-cookies-consent");
  });

  it("deletes host-only AWS RUM cookies and keeps other cookies", () => {
    document.cookie = "cwr_u=user; path=/";
    document.cookie = "cwr_s=c2Vzc2lvbg==; path=/";
    document.cookie = "performance-cookies-consent=false; path=/";

    clearAwsRumCookies();

    expect(hasCookie("cwr_u")).toBe(false);
    expect(hasCookie("cwr_s")).toBe(false);
    expect(hasCookie("performance-cookies-consent")).toBe(true);
  });

  it("deletes the domain cookies aws-rum-web writes", () => {
    const domain = window.location.hostname;
    document.cookie = `cwr_u=user; domain=${domain}; path=/`;
    document.cookie = `cwr_s=c2Vzc2lvbg==; domain=${domain}; path=/`;
    expect(hasCookie("cwr_u")).toBe(true);

    clearAwsRumCookies();

    expect(hasCookie("cwr_u")).toBe(false);
    expect(hasCookie("cwr_s")).toBe(false);
  });
});
