import { getConnectionProfileIndicator } from "@/components/auth/connection-state-indicator";

describe("getConnectionProfileIndicator", () => {
  it("returns disconnected styles when user is not authenticated", () => {
    const result = getConnectionProfileIndicator({
      isAuthenticated: false,
      isConnected: false,
    });

    expect(result.state).toBe("disconnected");
    expect(result.avatarClassName).toContain("tw-ring-white/10");
    expect(result.overlayClassName).toBe("");
    expect(result.buttonClassName).toContain("tw-border-white/20");
    expect(result.title).toBe("Disconnected");
  });

  it("returns authorized-only styles when authenticated without a live wallet connection", () => {
    const result = getConnectionProfileIndicator({
      isAuthenticated: true,
      isConnected: false,
    });

    expect(result.state).toBe("authorized_only");
    expect(result.avatarClassName).toContain("tw-bg-amber-900/40");
    expect(result.overlayClassName).toBe("tw-bg-amber-950/30");
    expect(result.buttonClassName).toContain("tw-border-amber-700/60");
    expect(result.title).toBe("Authorized only (wallet not connected)");
  });

  it("returns authorized+connected styles when authenticated and connected", () => {
    const result = getConnectionProfileIndicator({
      isAuthenticated: true,
      isConnected: true,
    });

    expect(result.state).toBe("authorized_connected");
    expect(result.avatarClassName).toContain("tw-bg-emerald-900/35");
    expect(result.overlayClassName).toBe("tw-bg-emerald-950/25");
    expect(result.buttonClassName).toContain("tw-border-emerald-700/55");
    expect(result.title).toBe("Authorized and Connected");
  });
});
