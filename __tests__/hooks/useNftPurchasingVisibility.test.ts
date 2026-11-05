import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let mockPlatform: "ios" | "android" | "web" = "web";
let mockCountry: string | undefined = "US";
let mockIsCountryPending = false;
let mockUsCountryHint = false;

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({
    isIos: mockPlatform === "ios",
    isAndroid: mockPlatform === "android",
  }),
}));
jest.mock("@/components/cookies/usCountryHint", () => ({
  readUsCountryHint: () => mockUsCountryHint,
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({
    country: mockCountry,
    isCountryPending: mockIsCountryPending,
  }),
}));

const visible = {
  hideNftPurchasing: false,
  shouldRedirect: false,
  reservesNftPurchasingSpace: false,
};
const hiddenWithoutRedirect = {
  hideNftPurchasing: true,
  shouldRedirect: false,
  reservesNftPurchasingSpace: false,
};
const redirect = {
  hideNftPurchasing: true,
  shouldRedirect: true,
  reservesNftPurchasingSpace: false,
};

beforeEach(() => {
  mockUsCountryHint = false;
});

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

it("keeps the slot's space on iOS while a check expected to be US is pending", () => {
  mockUsCountryHint = true;
  expect(visibilityFor("ios", "", true)).toEqual({
    ...hiddenWithoutRedirect,
    reservesNftPurchasingSpace: true,
  });
  // A settled restriction collapses it whatever the hint says.
  expect(visibilityFor("ios", "FR", false)).toEqual(redirect);
});

// useCapacitor reports web on the server, so iOS cannot reach this render.
it.each(["android", "web"] as const)(
  "hides purchasing and reserves its space in the server render (%s)",
  (platform) => {
    mockPlatform = platform;
    mockCountry = "US";
    mockIsCountryPending = false;
    let serverResult: ReturnType<typeof useNftPurchasingVisibility> | undefined;
    function Probe() {
      serverResult = useNftPurchasingVisibility();
      return null;
    }
    renderToString(createElement(Probe));
    expect(serverResult).toEqual({
      hideNftPurchasing: true,
      shouldRedirect: false,
      reservesNftPurchasingSpace: true,
    });
  }
);
