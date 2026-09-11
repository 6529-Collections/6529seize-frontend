import {
  getCollectedStatsIdentityKey,
  getStatsPath,
  getProfileStatsPath,
} from "@/components/user/stats/userPageStats.helpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

describe("getStatsPath", () => {
  const baseProfile = {
    wallets: [{ wallet: "0xabc" }],
    consolidation_key: "key123",
  } as unknown as ApiIdentity;

  it("returns wallet path when active address provided", () => {
    const result = getStatsPath(baseProfile, "0xdef");
    expect(result).toBe("wallet/0xdef");
  });

  it("returns consolidation path when no active address", () => {
    const result = getStatsPath(baseProfile, null);
    expect(result).toBe("consolidation/key123");
  });

  it("falls back to first wallet when no active address and no consolidation key", () => {
    const profile = {
      wallets: [{ wallet: "0x999" }],
    } as unknown as ApiIdentity;
    const result = getStatsPath(profile, null);
    expect(result).toBe("wallet/0x999");
  });
});

describe("getCollectedStatsIdentityKey", () => {
  it("deduplicates whitespace and case variants of a single custody wallet", () => {
    expect(
      getProfileStatsPath({
        primary_wallet: " 0xABC ",
        wallets: [{ wallet: "0xabc" }, { wallet: " 0xAbC " }, { wallet: " " }],
      } as ApiIdentity)
    ).toBe("wallet/0xabc");
  });
  it("does not silently substitute a wallet for an unresolved multi-wallet profile", () => {
    expect(() =>
      getProfileStatsPath({
        wallets: [{ wallet: "0x111" }, { wallet: "0x222" }],
      } as ApiIdentity)
    ).toThrow("confirmed consolidation");
  });
  const profile = {
    handle: "punk6529",
    primary_wallet: "0xabc",
    wallets: [{ wallet: "0xdef" }],
  } as unknown as ApiIdentity;

  it("uses the profile handle before its individual custody wallets", () => {
    expect(getCollectedStatsIdentityKey(profile)).toBe("punk6529");
  });

  it("falls back to wallet when handle is missing", () => {
    const walletOnlyProfile = {
      primary_wallet: "0x999",
      wallets: [{ wallet: "0x888" }],
    } as unknown as ApiIdentity;
    expect(getCollectedStatsIdentityKey(walletOnlyProfile)).toBe("0x999");
  });
});
