import { fireEvent, render, screen } from "@testing-library/react";
import WalletChecker from "@/components/delegation/walletChecker/WalletChecker";
import { fetchUrl } from "@/services/6529api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

jest.mock("react-bootstrap", () => ({
  __esModule: true,
  Container: (p: any) => <div>{p.children}</div>,
  Row: (p: any) => <div>{p.children}</div>,
  Col: (p: any) => <div>{p.children}</div>,
  Form: Object.assign(
    (p: any) => <form onSubmit={p.onSubmit}>{p.children}</form>,
    {
      Group: (p: any) => <div>{p.children}</div>,
      Label: (p: any) => <label>{p.children}</label>,
      Control: (p: any) => <input {...p} />,
      Text: (p: any) => <span>{p.children}</span>,
    }
  ),
  Button: (p: any) => (
    <button onClick={p.onClick} disabled={p.disabled}>
      {p.children}
    </button>
  ),
  Table: (p: any) => <table>{p.children}</table>,
}));

jest.mock("wagmi", () => ({
  useEnsName: () => ({ data: undefined, isLoading: false }),
  useEnsAddress: () => ({ data: undefined, isLoading: false }),
}));

jest.mock("@/services/6529api");

const mockFetchUrl = fetchUrl as jest.Mock;

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
    fireEvent.click(screen.getByText("Check"));
    expect(setAddressQuery).not.toHaveBeenCalled();
    expect(mockFetchUrl).not.toHaveBeenCalled();
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
    fireEvent.click(screen.getByText("Check"));
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
    fireEvent.click(screen.getByText("Check"));
    fireEvent.change(input, {
      target: { value: "0x1234567890123456789012345678901234567890" },
    });
    fireEvent.click(screen.getByText("Clear"));
    expect(input).toHaveValue("");
    expect(setAddressQuery).toHaveBeenLastCalledWith("");
  });
});
