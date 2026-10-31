import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import NftPurchasingGate from "@/components/common/NftPurchasingGate";
import { NftPurchasingServerRenderProvider } from "@/components/common/NftPurchasingServerRender";

let mockIsIos = false;
let mockCountry: string | undefined = "US";
let mockIsCountryPending = false;
const mockReplace = jest.fn();
const mockMount = jest.fn();

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: mockIsIos }),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({
    country: mockCountry,
    isCountryPending: mockIsCountryPending,
  }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

function PurchasingContent() {
  mockMount();
  return <button>Mint</button>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsIos = false;
  mockCountry = "US";
  mockIsCountryPending = false;
});

it.each(["CY", "CA", "", undefined])(
  "does not mount purchasing content for iOS country %s",
  (country) => {
    mockIsIos = true;
    mockCountry = country;
    const { container } = render(
      <NftPurchasingGate redirectTo="/about">
        <PurchasingContent />
      </NftPurchasingGate>
    );
    expect(mockMount).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
    expect(mockReplace).toHaveBeenCalledWith("/about");
  }
);

it.each([
  ["US iOS", true, "US"],
  ["normalized US iOS", true, " us "],
  ["web", false, "CY"],
  ["Android", false, "CA"],
] as const)("preserves purchasing content on %s", (_label, isIos, country) => {
  mockIsIos = isIos;
  mockCountry = country;
  render(
    <NftPurchasingGate redirectTo="/about">
      <PurchasingContent />
    </NftPurchasingGate>
  );
  expect(screen.getByRole("button", { name: "Mint" })).toBeInTheDocument();
  expect(mockReplace).not.toHaveBeenCalled();
});

it("omits purchasing children from server HTML before the platform is known", () => {
  expect(
    renderToString(
      <NftPurchasingGate redirectTo="/about">
        <PurchasingContent />
      </NftPurchasingGate>
    )
  ).toBe("");
  expect(mockMount).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});

it("includes purchasing children in server HTML when the request is clearly not the iOS app", () => {
  expect(
    renderToString(
      <NftPurchasingServerRenderProvider enabled>
        <NftPurchasingGate redirectTo="/about">
          <PurchasingContent />
        </NftPurchasingGate>
      </NftPurchasingServerRenderProvider>
    )
  ).toBe("<button>Mint</button>");
  expect(mockReplace).not.toHaveBeenCalled();
});

it("can leave an existing layout in charge of the profile redirect", () => {
  mockIsIos = true;
  mockCountry = "CY";
  render(
    <NftPurchasingGate>
      <PurchasingContent />
    </NftPurchasingGate>
  );
  expect(mockMount).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});

describe("while the iOS country check is pending", () => {
  function renderGate() {
    return render(
      <NftPurchasingGate redirectTo="/about">
        <PurchasingContent />
      </NftPurchasingGate>
    );
  }

  beforeEach(() => {
    mockIsIos = true;
    mockCountry = "";
    mockIsCountryPending = true;
  });

  it("keeps a US cold deep link in place and renders once US resolves", () => {
    const { container, rerender } = renderGate();
    expect(container).toBeEmptyDOMElement();
    expect(mockMount).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    mockCountry = "US";
    mockIsCountryPending = false;
    rerender(
      <NftPurchasingGate redirectTo="/about">
        <PurchasingContent />
      </NftPurchasingGate>
    );

    expect(screen.getByRole("button", { name: "Mint" })).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it.each([
    ["a non-US country", "FR"],
    ["a failed or empty lookup", ""],
  ])("redirects once the check resolves to %s", (_label, country) => {
    const { container, rerender } = renderGate();
    expect(mockReplace).not.toHaveBeenCalled();

    mockCountry = country;
    mockIsCountryPending = false;
    rerender(
      <NftPurchasingGate redirectTo="/about">
        <PurchasingContent />
      </NftPurchasingGate>
    );

    expect(container).toBeEmptyDOMElement();
    expect(mockMount).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/about");
  });

  it("does not make Android or web wait for the country", () => {
    mockIsIos = false;

    renderGate();

    expect(screen.getByRole("button", { name: "Mint" })).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
