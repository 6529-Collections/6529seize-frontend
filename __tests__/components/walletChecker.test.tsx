import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import WalletChecker from "@/components/delegation/walletChecker/WalletChecker";
import { fetchUrl } from "@/services/6529api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

jest.mock(
  "@/components/utils/input/ens-address/EnsAddressInput",
  () =>
    function MockEnsAddressInput(props: {
      id?: string;
      value?: string;
      placeholder?: string;
      onAddressChange: (address: string) => void;
      onValueChange?: (value: string) => void;
      disabled?: boolean;
      autoFocus?: boolean;
      className?: string;
      ariaDescribedBy?: string;
    }) {
      return (
        <input
          id={props.id}
          data-testid="ens-address-input"
          placeholder={props.placeholder}
          value={props.value ?? ""}
          disabled={props.disabled}
          autoFocus={props.autoFocus}
          className={props.className}
          aria-describedby={props.ariaDescribedBy}
          onChange={(e) => {
            const value = e.target.value;
            props.onValueChange?.(value);
            props.onAddressChange(
              value.toLowerCase().endsWith(".eth")
                ? RESOLVED_ENS_ADDRESS
                : value
            );
          }}
        />
      );
    }
);

jest.mock("@/services/6529api");

const mockFetchUrl = fetchUrl as jest.Mock;
const RESOLVED_ENS_ADDRESS = "0x2222222222222222222222222222222222222222";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("WalletChecker", () => {
  it("does not fetch when address invalid", () => {
    const setAddressQuery = jest.fn();
    render(
      <TestWrapper>
        <WalletChecker address_query="" setAddressQuery={setAddressQuery} />
      </TestWrapper>
    );
    fireEvent.change(screen.getByPlaceholderText("0x... or ENS"), {
      target: { value: "bad" },
    });
    fireEvent.click(screen.getByText("Check Wallet"));
    expect(setAddressQuery).not.toHaveBeenCalled();
    expect(mockFetchUrl).not.toHaveBeenCalled();
    expect(
      screen.getByText("Enter a valid Ethereum address or ENS name.")
    ).toBeInTheDocument();
  });

  it("fetches data for valid address", async () => {
    mockFetchUrl.mockResolvedValue({ data: [] });
    const setAddressQuery = jest.fn();
    render(
      <TestWrapper>
        <WalletChecker address_query="" setAddressQuery={setAddressQuery} />
      </TestWrapper>
    );
    fireEvent.change(screen.getByPlaceholderText("0x... or ENS"), {
      target: { value: "0x1111111111111111111111111111111111111111" },
    });
    fireEvent.click(screen.getByText("Check Wallet"));
    expect(setAddressQuery).toHaveBeenCalledWith(
      "0x1111111111111111111111111111111111111111"
    );
    expect(mockFetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/delegations/0x1111111111111111111111111111111111111111"
    );
    expect(mockFetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/consolidations/0x1111111111111111111111111111111111111111?show_incomplete=true"
    );
  });

  it("fetches data when loaded with an address query", async () => {
    mockFetchUrl.mockResolvedValue({ data: [] });
    const setAddressQuery = jest.fn();
    const address = "0x1111111111111111111111111111111111111111";

    render(
      <TestWrapper>
        <WalletChecker
          address_query={address}
          setAddressQuery={setAddressQuery}
        />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText("0x... or ENS")).toHaveValue(address);
    await waitFor(() => {
      expect(setAddressQuery).toHaveBeenCalledWith(address);
    });
    expect(mockFetchUrl).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/delegations/${address}`
    );
    expect(mockFetchUrl).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/consolidations/${address}?show_incomplete=true`
    );
    expect(
      screen.queryByText("Enter a valid Ethereum address or ENS name.")
    ).not.toBeInTheDocument();
  });

  it("accepts uppercase ENS suffixes after resolution", async () => {
    mockFetchUrl.mockResolvedValue({ data: [] });
    const setAddressQuery = jest.fn();
    render(
      <TestWrapper>
        <WalletChecker address_query="" setAddressQuery={setAddressQuery} />
      </TestWrapper>
    );
    fireEvent.change(screen.getByPlaceholderText("0x... or ENS"), {
      target: { value: "seize.ETH" },
    });
    fireEvent.click(screen.getByText("Check Wallet"));
    expect(setAddressQuery).toHaveBeenCalledWith(RESOLVED_ENS_ADDRESS);
    expect(mockFetchUrl).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/delegations/${RESOLVED_ENS_ADDRESS}`
    );
    expect(
      screen.queryByText("Enter a valid Ethereum address or ENS name.")
    ).not.toBeInTheDocument();
  });
});

describe("WalletChecker extras", () => {
  it("clears input after clicking clear", async () => {
    const setAddressQuery = jest.fn();
    render(
      <TestWrapper>
        <WalletChecker address_query="" setAddressQuery={setAddressQuery} />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText("0x... or ENS");
    fireEvent.change(input, { target: { value: "bad" } });
    fireEvent.click(screen.getByText("Check Wallet"));
    fireEvent.change(input, {
      target: { value: "0x1234567890123456789012345678901234567890" },
    });
    fireEvent.click(screen.getByText("Clear"));
    expect(input).toHaveValue("");
    expect(setAddressQuery).toHaveBeenLastCalledWith("");
  });
});
