import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import WalletChecker from "@/components/delegation/walletChecker/WalletChecker";
import type { WalletConsolidation } from "@/entities/IDelegation";
import { fetchUrl } from "@/services/6529api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

jest.mock(
  "@/components/address/Address",
  () =>
    function MockAddress(props: {
      wallets: string[];
      display: string | undefined;
    }) {
      return <span>{props.display ?? props.wallets[0]}</span>;
    }
);

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

    expect(screen.getByText("Viewing wallet")).toBeInTheDocument();
    expect(screen.getByText(address)).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("0x... or ENS")
    ).not.toBeInTheDocument();
    expect(setAddressQuery).not.toHaveBeenCalled();
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

const API = "https://api.test.6529.io/api";
const WALLET_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const WALLET_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const WALLET_C = "0xcccccccccccccccccccccccccccccccccccccccc";
const WALLET_D = "0xdddddddddddddddddddddddddddddddddddddddd";
const DISPLAYS: Record<string, string> = {
  [WALLET_A]: "a.eth",
  [WALLET_B]: "b.eth",
  [WALLET_C]: "c.eth",
  [WALLET_D]: "d.eth",
};

function pair(
  wallet1: string,
  wallet2: string,
  confirmed: boolean,
  block = 100
): WalletConsolidation {
  return {
    block,
    wallet1,
    wallet1_display: DISPLAYS[wallet1.toLowerCase()] ?? wallet1,
    wallet2,
    wallet2_display: DISPLAYS[wallet2.toLowerCase()] ?? wallet2,
    confirmed,
  };
}

function involves(row: WalletConsolidation, wallet: string) {
  return (
    row.wallet1.toLowerCase() === wallet.toLowerCase() ||
    row.wallet2.toLowerCase() === wallet.toLowerCase()
  );
}

function showIncompleteUrl(wallet: string) {
  return `${API}/consolidations/${wallet}?show_incomplete=true`;
}

function countShowIncompleteCalls(wallet: string) {
  const expected = showIncompleteUrl(wallet).toLowerCase();
  return mockFetchUrl.mock.calls.filter(
    ([url]) => String(url).toLowerCase() === expected
  ).length;
}

function mockConsolidationApi(options: {
  rowsFor(wallet: string): WalletConsolidation[];
  resolved?: string[];
  failing?: string[];
}) {
  mockFetchUrl.mockImplementation(async (url: string) => {
    const match =
      /\/consolidations\/(0x[0-9a-fA-F]{40})(\?show_incomplete=true)?$/.exec(
        url
      );
    if (!match) {
      return { data: [] };
    }
    const wallet = match[1] ?? "";
    if (!match[2]) {
      return { data: options.resolved ?? [] };
    }
    if (options.failing?.includes(wallet.toLowerCase())) {
      throw new Error(`failed ${wallet}`);
    }
    return { data: options.rowsFor(wallet) };
  });
}

function renderCheckedWallet(address: string) {
  return render(
    <TestWrapper>
      <WalletChecker address_query={address} setAddressQuery={jest.fn()} />
    </TestWrapper>
  );
}

describe("WalletChecker consolidation groups", () => {
  beforeEach(() => {
    mockFetchUrl.mockReset();
  });

  it("loads every linked wallet and flags an incomplete pair between other members", async () => {
    // Four-wallet group checked from A: every pair is confirmed except C<->D,
    // where only C has registered.
    const rows = [
      pair(WALLET_A, WALLET_B, true),
      pair(WALLET_A, WALLET_C, true),
      pair(WALLET_A, WALLET_D, true),
      pair(WALLET_B, WALLET_C, true),
      pair(WALLET_B, WALLET_D, true),
      pair(WALLET_C, WALLET_D, false),
    ];
    mockConsolidationApi({
      rowsFor: (wallet) => rows.filter((row) => involves(row, wallet)),
      resolved: [WALLET_A, WALLET_B, WALLET_C],
    });

    renderCheckedWallet(WALLET_A);

    expect(
      await screen.findByText("Incomplete Consolidation")
    ).toBeInTheDocument();
    for (const wallet of [WALLET_A, WALLET_B, WALLET_C, WALLET_D]) {
      expect(countShowIncompleteCalls(wallet)).toBe(1);
    }
    // 5 confirmed pairs in both directions plus the one registered C->D.
    expect(screen.getByText("Consolidations (11)")).toBeInTheDocument();
    const actions = screen.getAllByRole("listitem");
    expect(actions).toHaveLength(1);
    expect(actions[0]).toHaveTextContent(
      "Register Consolidation from d.eth to c.eth"
    );
  });

  it("keeps one row per wallet pair and fetches each linked wallet once", async () => {
    const checksummedB = `0x${WALLET_B.slice(2).toUpperCase()}`;
    mockConsolidationApi({
      rowsFor: (wallet) => {
        if (wallet.toLowerCase() === WALLET_A) {
          // The same pair twice, in both directions and mixed case.
          return [
            pair(WALLET_A, WALLET_B, true, 100),
            pair(checksummedB, WALLET_A, true, 100),
          ];
        }
        // B's newer copy of the pair: A has since revoked, so only B->A
        // remains registered.
        return [pair(WALLET_B, WALLET_A, false, 200)];
      },
    });

    renderCheckedWallet(WALLET_A);

    expect(
      await screen.findByText("Incomplete Consolidation")
    ).toBeInTheDocument();
    expect(countShowIncompleteCalls(WALLET_B)).toBe(1);
    expect(screen.getByText("Consolidations (1)")).toBeInTheDocument();
    const actions = screen.getAllByRole("listitem");
    expect(actions).toHaveLength(1);
    expect(actions[0]).toHaveTextContent(
      "Register Consolidation from a.eth to b.eth"
    );
  });

  it("keeps loaded rows when a linked wallet request fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const rows = [
      pair(WALLET_A, WALLET_B, true),
      pair(WALLET_A, WALLET_C, true),
      pair(WALLET_B, WALLET_C, true),
    ];
    mockConsolidationApi({
      rowsFor: (wallet) => rows.filter((row) => involves(row, wallet)),
      failing: [WALLET_C],
    });

    try {
      renderCheckedWallet(WALLET_A);

      expect(await screen.findByText("Consolidations (6)")).toBeInTheDocument();
      expect(countShowIncompleteCalls(WALLET_B)).toBe(1);
      expect(countShowIncompleteCalls(WALLET_C)).toBe(1);
      expect(
        screen.queryByText("Incomplete Consolidation")
      ).not.toBeInTheDocument();
      expect(consoleError).toHaveBeenCalledWith(
        `Failed to fetch consolidations for related wallet: ${WALLET_C}`,
        expect.any(Error)
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("caps linked wallet requests and fetches confirmed links first", async () => {
    const strays = Array.from(
      { length: 7 },
      (_, index) => `0x${String(index + 1).repeat(40)}`
    );
    const firstRows = [
      ...strays.map((stray) => pair(WALLET_A, stray, false)),
      pair(WALLET_A, WALLET_B, true),
    ];
    mockConsolidationApi({
      rowsFor: (wallet) => (wallet.toLowerCase() === WALLET_A ? firstRows : []),
    });

    renderCheckedWallet(WALLET_A);

    expect(
      await screen.findByText("Incomplete Consolidation")
    ).toBeInTheDocument();
    const linkedRequests = mockFetchUrl.mock.calls.filter(
      ([url]) =>
        String(url).endsWith("?show_incomplete=true") &&
        !String(url).includes(WALLET_A)
    );
    expect(linkedRequests).toHaveLength(6);
    expect(countShowIncompleteCalls(WALLET_B)).toBe(1);
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
