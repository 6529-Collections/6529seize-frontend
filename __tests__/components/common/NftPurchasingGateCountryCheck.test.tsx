import NftPurchasingGate from "@/components/common/NftPurchasingGate";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import { commonApiFetch } from "@/services/api/common-api";
import { act, render, screen } from "@testing-library/react";

let mockIsIos = true;
const mockReplace = jest.fn();
const mockMount = jest.fn();

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: mockIsIos }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("js-cookie", () => ({ get: jest.fn(), set: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: jest.fn() }),
}));
jest.mock("@/components/cookies/CookiesBanner", () => () => null);

const fetchMock = jest.mocked(commonApiFetch);

function PurchasingContent() {
  mockMount();
  return <button>Mint</button>;
}

function renderDeepLink() {
  return render(
    <CookieConsentProvider>
      <NftPurchasingGate redirectTo="/the-memes">
        <PurchasingContent />
      </NftPurchasingGate>
    </CookieConsentProvider>
  );
}

function deferCountryCheck() {
  const lookup: { resolve?: (response: unknown) => void } = {};
  fetchMock.mockReturnValue(
    new Promise((resolve) => {
      lookup.resolve = resolve;
    })
  );
  return (country: string) => lookup.resolve?.({ is_eu: true, country });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsIos = true;
});

describe("NftPurchasingGate with the country check", () => {
  it.each(["US", "FR", ""])(
    "redirects before the country check resolves to %s",
    async (country) => {
      const resolveCountry = deferCountryCheck();
      renderDeepLink();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: "policies/country-check" })
      );
      expect(mockReplace).toHaveBeenCalledWith("/the-memes");
      expect(mockMount).not.toHaveBeenCalled();

      await act(async () => resolveCountry(country));

      expect(screen.queryByRole("button", { name: "Mint" })).toBeNull();
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockMount).not.toHaveBeenCalled();
    }
  );

  it("does not make web wait for the country check", () => {
    mockIsIos = false;
    deferCountryCheck();

    renderDeepLink();

    expect(screen.getByRole("button", { name: "Mint" })).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
