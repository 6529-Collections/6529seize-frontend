import { act, render, screen } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import NftPurchasingGate from "@/components/common/NftPurchasingGate";

let mockIsIos = false;
let mockCountry: string | undefined = "US";
let mockIsCountryPending = false;
let mockUsCountryHint = false;
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
jest.mock("@/components/cookies/usCountryHint", () => ({
  readUsCountryHint: () => mockUsCountryHint,
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

function PurchasingContent() {
  mockMount();
  return <button>Mint</button>;
}

const SPACE = <div data-testid="purchasing-space" />;

beforeEach(() => {
  jest.clearAllMocks();
  mockIsIos = false;
  mockCountry = "US";
  mockIsCountryPending = false;
  mockUsCountryHint = false;
});

it.each(["CY", "CA", "", undefined])(
  "does not mount purchasing content for iOS country %s",
  (country) => {
    mockIsIos = true;
    mockCountry = country;
    const { container } = render(
      <NftPurchasingGate redirectTo="/about" placeholder={SPACE}>
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
    <NftPurchasingGate redirectTo="/about" placeholder={SPACE}>
      <PurchasingContent />
    </NftPurchasingGate>
  );
  expect(screen.getByRole("button", { name: "Mint" })).toBeInTheDocument();
  expect(screen.queryByTestId("purchasing-space")).toBeNull();
  expect(mockReplace).not.toHaveBeenCalled();
});

it("omits purchasing children from server HTML for every request", () => {
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

it("puts only the reserved space in server HTML", () => {
  expect(
    renderToString(
      <NftPurchasingGate redirectTo="/about" placeholder={SPACE}>
        <PurchasingContent />
      </NftPurchasingGate>
    )
  ).toBe('<div data-testid="purchasing-space"></div>');
  expect(mockMount).not.toHaveBeenCalled();
});

describe("after hydration on web and Android", () => {
  let container: HTMLDivElement;
  let root: Root | undefined;

  afterEach(() => {
    act(() => root?.unmount());
    root = undefined;
    container.remove();
  });

  it("replaces the reserved space with the content without waiting for the country", async () => {
    mockIsIos = false;
    mockCountry = undefined;
    mockIsCountryPending = true;
    const ui = (
      <NftPurchasingGate redirectTo="/about" placeholder={SPACE}>
        <PurchasingContent />
      </NftPurchasingGate>
    );
    container = document.createElement("div");
    container.innerHTML = renderToString(ui);
    document.body.appendChild(container);
    const errors: unknown[] = [];

    await act(async () => {
      root = hydrateRoot(container, ui, {
        onRecoverableError: (error) => errors.push(error),
      });
    });

    expect(errors).toEqual([]);
    expect(container.querySelector('[data-testid="purchasing-space"]')).toBeNull();
    expect(container.querySelector("button")?.textContent).toBe("Mint");
    expect(mockReplace).not.toHaveBeenCalled();
  });
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
  function gate() {
    return (
      <NftPurchasingGate redirectTo="/about" placeholder={SPACE}>
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
    const { container, rerender } = render(gate());
    expect(container).toBeEmptyDOMElement();
    expect(mockMount).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    mockCountry = "US";
    mockIsCountryPending = false;
    rerender(gate());

    expect(screen.getByRole("button", { name: "Mint" })).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("keeps the reserved space on a device whose last check was US", () => {
    mockUsCountryHint = true;
    const { rerender } = render(gate());
    expect(screen.getByTestId("purchasing-space")).toBeInTheDocument();
    expect(mockMount).not.toHaveBeenCalled();

    mockCountry = "FR";
    mockIsCountryPending = false;
    rerender(gate());

    expect(screen.queryByTestId("purchasing-space")).toBeNull();
    expect(mockMount).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/about");
  });

  it.each([
    ["a non-US country", "FR"],
    ["a failed or empty lookup", ""],
  ])("redirects once the check resolves to %s", (_label, country) => {
    const { container, rerender } = render(gate());
    expect(mockReplace).not.toHaveBeenCalled();

    mockCountry = country;
    mockIsCountryPending = false;
    rerender(gate());

    expect(container).toBeEmptyDOMElement();
    expect(mockMount).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/about");
  });

  it("does not make Android or web wait for the country", () => {
    mockIsIos = false;

    render(gate());

    expect(screen.getByRole("button", { name: "Mint" })).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
