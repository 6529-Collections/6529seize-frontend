import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import { renderHook } from "@testing-library/react";

let mockPlatform: "ios" | "android" | "web" = "web";
let mockCountry: string | undefined = "US";
let mockIsCountryPending = false;

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({
    isIos: mockPlatform === "ios",
    isAndroid: mockPlatform === "android",
  }),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({
    country: mockCountry,
    isCountryPending: mockIsCountryPending,
  }),
}));

const visible = { hideNftPurchasing: false, shouldRedirect: false };
const hiddenWithoutRedirect = { hideNftPurchasing: true, shouldRedirect: false };
const redirect = { hideNftPurchasing: true, shouldRedirect: true };

function visibilityFor(
  platform: typeof mockPlatform,
  country: string | undefined,
  isCountryPending: boolean
) {
  mockPlatform = platform;
  mockCountry = country;
  mockIsCountryPending = isCountryPending;
  return renderHook(() => useNftPurchasingVisibility()).result.current;
}

it.each([
  ["US iOS", "ios", "US", false, visible],
  ["normalized US iOS", "ios", " us ", false, visible],
  ["iOS while the country check is pending", "ios", "", true, hiddenWithoutRedirect],
  ["non-US iOS", "ios", "FR", false, redirect],
  ["iOS after a failed or empty check", "ios", "", false, redirect],
  ["iOS with an unknown country", "ios", undefined, false, redirect],
  ["Android outside the US", "android", "FR", false, visible],
  ["Android while the country check is pending", "android", "", true, visible],
  ["web outside the US", "web", "FR", false, visible],
  ["web while the country check is pending", "web", "", true, visible],
] as const)(
  "resolves %s",
  (_label, platform, country, isCountryPending, expected) => {
    expect(visibilityFor(platform, country, isCountryPending)).toEqual(
      expected
    );
  }
);
