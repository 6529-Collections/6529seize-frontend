import { disconnect } from "@wagmi/core";
import {
  disconnectWithoutAppKit,
  hasWalletChunkLoadFailed,
  isChunkLoadError,
  noteWalletChunkFailure,
  reloadToRetryWalletChunks,
  resetWalletChunkRecoveryForTests,
  setWalletStackWagmiConfig,
} from "@/components/providers/walletChunkRecovery";

jest.mock("@wagmi/core", () => ({ disconnect: jest.fn() }));

const chunkError = () =>
  Object.assign(new Error("Failed to load chunk /a.js"), {
    name: "ChunkLoadError",
  });

describe("walletChunkRecovery", () => {
  const reload = jest.fn();

  beforeEach(() => {
    resetWalletChunkRecoveryForTests();
    sessionStorage.clear();
    reload.mockReset();
    jest.mocked(disconnect).mockReset().mockResolvedValue(undefined);
    localStorage.setItem("wagmi.store", "{}");
  });

  it("recognises only chunk load errors", () => {
    expect(isChunkLoadError(chunkError())).toBe(true);
    expect(isChunkLoadError(new Error("network down"))).toBe(false);
    expect(isChunkLoadError("ChunkLoadError")).toBe(false);
  });

  it("remembers a failed chunk but not other errors", () => {
    noteWalletChunkFailure(new Error("init failed"));
    expect(hasWalletChunkLoadFailed()).toBe(false);
    noteWalletChunkFailure(chunkError());
    expect(hasWalletChunkLoadFailed()).toBe(true);
  });

  it("reloads at most once a minute", () => {
    const now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    expect(reloadToRetryWalletChunks(reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);

    now.mockReturnValue(1_000_000 + 30_000);
    expect(reloadToRetryWalletChunks(reload)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);

    now.mockReturnValue(1_000_000 + 61_000);
    expect(reloadToRetryWalletChunks(reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
    now.mockRestore();
  });

  it("disconnects through the wallet stack's Wagmi config and forgets the stored connection", async () => {
    const config = { id: "wallet-stack" } as never;
    setWalletStackWagmiConfig(config);

    await disconnectWithoutAppKit();

    expect(disconnect).toHaveBeenCalledWith(config);
    expect(localStorage.getItem("wagmi.store")).toBeNull();
  });

  it("only forgets the stored connection when the wallet stack never loaded", async () => {
    await disconnectWithoutAppKit();

    expect(disconnect).not.toHaveBeenCalled();
    expect(localStorage.getItem("wagmi.store")).toBeNull();
  });

  it("still forgets the stored connection when Wagmi fails to disconnect", async () => {
    setWalletStackWagmiConfig({ id: "wallet-stack" } as never);
    jest.mocked(disconnect).mockRejectedValueOnce(new Error("busy"));

    await expect(disconnectWithoutAppKit()).rejects.toThrow("busy");
    expect(localStorage.getItem("wagmi.store")).toBeNull();
  });
});
