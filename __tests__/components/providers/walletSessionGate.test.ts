import {
  hasPersistedWalletSession,
  subscribeToWalletSessionChanges,
} from "@/components/providers/walletSessionGate";
import { getWalletAddress } from "@/services/auth/auth.utils";

jest.mock("@/services/auth/auth.utils", () => ({
  AUTH_STORAGE_KEYS: {
    accounts: "6529-wallet-accounts",
    legacyAddress: "6529-wallet-address",
  },
  getWalletAddress: jest.fn(() => null),
  WALLET_ACCOUNTS_UPDATED_EVENT: "6529-wallet-accounts-updated",
}));

const WAGMI_STORE_KEY = "wagmi.store";
const walletAddress = "0x0000000000000000000000000000000000000529";

const storeWagmiConnections = (connections: unknown[]): void => {
  localStorage.setItem(
    WAGMI_STORE_KEY,
    JSON.stringify({
      state: {
        chainId: 1,
        connections: { __type: "Map", value: connections },
        current: connections.length > 0 ? "connector-uid" : null,
      },
      version: 2,
    })
  );
};

describe("walletSessionGate", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.mocked(getWalletAddress).mockReturnValue(null);
  });

  it("treats a visitor without a session or wallet connection as anonymous", () => {
    expect(hasPersistedWalletSession()).toBe(false);
  });

  it("recognizes a stored 6529 wallet session", () => {
    jest.mocked(getWalletAddress).mockReturnValue(walletAddress);

    expect(hasPersistedWalletSession()).toBe(true);
  });

  it("recognizes a wallet connection that Wagmi would restore", () => {
    storeWagmiConnections([
      [
        "connector-uid",
        {
          accounts: [walletAddress],
          chainId: 1,
          connector: { id: "injected", name: "Injected", type: "injected" },
        },
      ],
    ]);

    expect(hasPersistedWalletSession()).toBe(true);
  });

  it("ignores Wagmi state without live connections", () => {
    storeWagmiConnections([]);
    localStorage.setItem("wagmi.recentConnectorId", '"injected"');

    expect(hasPersistedWalletSession()).toBe(false);
  });

  it("treats unreadable session storage as anonymous", () => {
    localStorage.setItem(WAGMI_STORE_KEY, "{not json");
    expect(hasPersistedWalletSession()).toBe(false);

    jest.mocked(getWalletAddress).mockImplementation(() => {
      throw new Error("Storage is unavailable");
    });
    expect(hasPersistedWalletSession()).toBe(false);
  });

  it("notifies on same-tab account updates and cross-tab session writes", () => {
    const onChange = jest.fn();
    const unsubscribe = subscribeToWalletSessionChanges(onChange);

    globalThis.dispatchEvent(new CustomEvent("6529-wallet-accounts-updated"));
    for (const key of [
      WAGMI_STORE_KEY,
      "6529-wallet-accounts",
      "6529-wallet-address",
      null,
    ]) {
      globalThis.dispatchEvent(new StorageEvent("storage", { key }));
    }
    expect(onChange).toHaveBeenCalledTimes(5);

    unsubscribe();
    globalThis.dispatchEvent(new CustomEvent("6529-wallet-accounts-updated"));
    globalThis.dispatchEvent(
      new StorageEvent("storage", { key: WAGMI_STORE_KEY })
    );
    expect(onChange).toHaveBeenCalledTimes(5);
  });

  it("ignores cross-tab writes to unrelated storage keys", () => {
    const onChange = jest.fn();
    const unsubscribe = subscribeToWalletSessionChanges(onChange);

    globalThis.dispatchEvent(
      new StorageEvent("storage", { key: "react-query-cache" })
    );
    globalThis.dispatchEvent(
      new StorageEvent("storage", { key: "wagmi.recentConnectorId" })
    );
    expect(onChange).not.toHaveBeenCalled();

    unsubscribe();
  });
});
