import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import NftPurchasingGate from "@/components/common/NftPurchasingGate";

let mockIsIos = false;
let mockCountry: string | undefined = "US";
const mockReplace = jest.fn();
const mockMount = jest.fn();

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: mockIsIos }),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country: mockCountry }),
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
