import {
  getConnectedWalletAccounts,
  getWalletAddress,
  persistAccountsWithActive,
} from "@/services/auth/auth.utils";
import {
  getPageDesktopProfileState,
  isSameDesktopProfileState,
  restoreDesktopProfileState,
} from "@/services/auth/desktop-profile-restore";

jest.mock("@/services/auth/auth.utils", () => ({
  getConnectedWalletAccounts: jest.fn(),
  getWalletAddress: jest.fn(),
  persistAccountsWithActive: jest.fn(),
}));

const V2 = `0x${"1".repeat(40)}`;
const LEGACY = `0x${"2".repeat(40)}`;

const profile = (address: string, authSessionVersion: "v2" | null) => ({
  address,
  role: null,
  jwt: `jwt-${address}`,
  profileId: null,
  profileHandle: null,
  authSessionVersion,
  refreshToken: null,
});

describe("desktop profile restore", () => {
  beforeEach(() => {
    jest.mocked(getConnectedWalletAccounts).mockReturnValue([
      { ...profile(V2, "v2"), refreshToken: "should-not-survive" },
      { ...profile(LEGACY, null), refreshToken: "legacy-refresh-token" },
    ]);
    jest.mocked(getWalletAddress).mockReturnValue(LEGACY.toUpperCase());
  });

  it("offers the page's profiles to the shell without refresh tokens", () => {
    expect(getPageDesktopProfileState()).toEqual({
      version: 1,
      accounts: [profile(V2, "v2"), profile(LEGACY, null)],
      activeAddress: LEGACY,
    });
  });

  it("keeps only an older session's refresh token the page already held", () => {
    restoreDesktopProfileState({
      version: 1,
      accounts: [profile(V2, "v2"), profile(LEGACY, null)],
      activeAddress: V2,
    });

    expect(persistAccountsWithActive).toHaveBeenCalledWith(
      [
        profile(V2, "v2"),
        { ...profile(LEGACY, null), refreshToken: "legacy-refresh-token" },
      ],
      V2
    );
  });

  it("compares snapshots by content, not key order", () => {
    const left = {
      version: 1 as const,
      accounts: [profile(V2, "v2")],
      activeAddress: V2,
    };
    const right = {
      activeAddress: V2,
      accounts: [{ ...profile(V2, "v2") }],
      version: 1 as const,
    };

    expect(isSameDesktopProfileState(left, right)).toBe(true);
    expect(
      isSameDesktopProfileState(left, { ...left, activeAddress: null })
    ).toBe(false);
  });
});
