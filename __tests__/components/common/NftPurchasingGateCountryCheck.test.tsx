import NftPurchasingGate from "@/components/common/NftPurchasingGate";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";
import { commonApiFetch } from "@/services/api/common-api";
import { act, render, screen, waitFor } from "@testing-library/react";

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
  it("keeps a US iOS cold deep link until the check returns US", async () => {
    const resolveCountry = deferCountryCheck();
    renderDeepLink();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "policies/country-check" })
    );
    expect(mockMount).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    resolveCountry("US");

    expect(
      await screen.findByRole("button", { name: "Mint" })
    ).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects iOS once the check returns a non-US country", async () => {
    const resolveCountry = deferCountryCheck();
    renderDeepLink();
    expect(mockReplace).not.toHaveBeenCalled();

    resolveCountry("FR");

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/the-memes"));
    expect(mockMount).not.toHaveBeenCalled();
  });

  it("redirects iOS when the country check fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    fetchMock.mockRejectedValue(new Error("network down"));

    renderDeepLink();

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/the-memes"));
    expect(mockMount).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("redirects iOS when the country check stalls past its timeout", async () => {
    jest.useFakeTimers();
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    try {
      fetchMock.mockReturnValue(new Promise(() => {}));
      renderDeepLink();

      await act(async () => {
        jest.advanceTimersByTime(4_999);
      });
      expect(mockReplace).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      expect(mockReplace).toHaveBeenCalledWith("/the-memes");
      expect(mockMount).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
      jest.useRealTimers();
    }
  });

  it("does not make web wait for the country check", () => {
    mockIsIos = false;
    deferCountryCheck();

    renderDeepLink();

    expect(screen.getByRole("button", { name: "Mint" })).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
