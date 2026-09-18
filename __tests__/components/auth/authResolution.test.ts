import {
  isAuthResolving,
  isWalletConnectionResolving,
} from "@/components/auth/authResolution";

describe("auth resolution", () => {
  it.each(["initializing", "connecting"] as const)(
    "does not classify %s as logged out",
    (state) => {
      expect(isAuthResolving(state)).toBe(true);
    }
  );
  it.each(["connected", "disconnected", "error"] as const)(
    "settles in %s and still waits for a pending profile",
    (state) => {
      expect(isAuthResolving(state)).toBe(false);
      expect(isAuthResolving(state, true)).toBe(true);
    }
  );
  it("does not block a site session on signing-wallet reconnection", () => {
    expect(isAuthResolving("connected")).toBe(false);
    expect(
      isWalletConnectionResolving({
        connectionState: "connected",
        isWalletConnectionPending: true,
      })
    ).toBe(true);
    expect(
      isWalletConnectionResolving({
        connectionState: "connected",
        isWalletConnectionPending: false,
      })
    ).toBe(false);
  });
});
