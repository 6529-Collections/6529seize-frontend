import { getDesktopProfileMigrationState } from "@/services/auth/desktop-profile-state";

const address = (digit: string) => `0x${digit.repeat(40)}`;

const account = (digit: string, extra: Record<string, unknown> = {}) => ({
  address: address(digit),
  role: null,
  jwt: `jwt-${digit}`,
  profileId: `id-${digit}`,
  profileHandle: `handle-${digit}`,
  authSessionVersion: "v2",
  refreshToken: "page-refresh-token",
  ...extra,
});

describe("getDesktopProfileMigrationState", () => {
  it("returns an empty state for anything that is not a state object", () => {
    for (const value of [null, undefined, "x", 1, []]) {
      expect(getDesktopProfileMigrationState(value)).toEqual({
        version: 1,
        accounts: [],
        activeAddress: null,
      });
    }
  });

  it("keeps known fields, lower-cases addresses and drops refresh tokens", () => {
    const state = getDesktopProfileMigrationState({
      accounts: [
        account("A", { address: `0x${"A".repeat(40)}`, unknown: "field" }),
      ],
      activeAddress: `0x${"A".repeat(40)}`,
    });

    expect(state).toEqual({
      version: 1,
      accounts: [
        {
          address: address("a"),
          role: null,
          jwt: "jwt-A",
          profileId: "id-A",
          profileHandle: "handle-A",
          authSessionVersion: "v2",
          refreshToken: null,
        },
      ],
      activeAddress: address("a"),
    });
  });

  it("skips malformed and duplicate profiles instead of failing", () => {
    const state = getDesktopProfileMigrationState({
      accounts: [
        account("1"),
        { address: "not-an-address" },
        account("1", { jwt: "duplicate" }),
        account("2", { role: 5 }),
        "garbage",
        account("3", { authSessionVersion: "v1" }),
      ],
      activeAddress: null,
    });

    expect(state.accounts.map((saved) => saved.address)).toEqual([
      address("1"),
      address("3"),
    ]);
    expect(state.accounts[0]?.jwt).toBe("jwt-1");
    expect(state.accounts[1]?.authSessionVersion).toBeNull();
  });

  it("keeps at most five profiles and never drops the active one", () => {
    const state = getDesktopProfileMigrationState({
      accounts: ["1", "2", "3", "4", "5", "6"].map((digit) => account(digit)),
      activeAddress: address("6"),
    });

    expect(state.accounts).toHaveLength(5);
    expect(state.accounts.map((saved) => saved.address)).toContain(
      address("6")
    );
    expect(state.activeAddress).toBe(address("6"));
  });

  it("clears an active address that is not in the list", () => {
    const state = getDesktopProfileMigrationState({
      accounts: [account("1")],
      activeAddress: address("9"),
    });

    expect(state.activeAddress).toBeNull();
  });
});
