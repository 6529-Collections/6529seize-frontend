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

import { fakeJwt } from "@/__tests__/helpers/fakeJwt";

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
  jwt: fakeJwt({ sub: address }),
  profileId: null,
  profileHandle: null,
  authSessionVersion,
  refreshToken: null,
});

describe("desktop profile restore", () => {
  beforeEach(() => {
    jest.mocked(persistAccountsWithActive).mockClear();
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

  it("normalizes a shell snapshot saved with checksummed addresses", () => {
    const checksummed = "0xAbCdEf0123456789aBcDeF0123456789AbCdEf01";
    jest.mocked(getConnectedWalletAccounts).mockReturnValue([]);

    restoreDesktopProfileState({
      version: 1,
      accounts: [profile(checksummed, "v2")],
      activeAddress: checksummed,
    });

    expect(persistAccountsWithActive).toHaveBeenCalledWith(
      [{ ...profile(checksummed, "v2"), address: checksummed.toLowerCase() }],
      checksummed.toLowerCase()
    );
  });

  it("keeps a legacy refresh token for a profile the shell saved in mixed case", () => {
    const checksummed = "0xAbCdEf0123456789aBcDeF0123456789AbCdEf01";
    jest.mocked(getConnectedWalletAccounts).mockReturnValue([
      {
        ...profile(checksummed.toLowerCase(), null),
        refreshToken: "legacy-refresh-token",
      },
    ]);

    restoreDesktopProfileState({
      version: 1,
      accounts: [profile(checksummed, null)],
      activeAddress: null,
    });

    expect(persistAccountsWithActive).toHaveBeenCalledWith(
      [
        {
          ...profile(checksummed, null),
          address: checksummed.toLowerCase(),
          refreshToken: "legacy-refresh-token",
        },
      ],
      null
    );
  });

  it.each([
    ["not an object", null],
    ["a wrong version", { version: 2, accounts: [], activeAddress: null }],
    [
      "more than five profiles",
      {
        version: 1,
        accounts: ["1", "2", "3", "4", "5", "6"].map((digit) =>
          profile(`0x${digit.repeat(40)}`, "v2")
        ),
        activeAddress: null,
      },
    ],
    [
      "an invalid address",
      {
        version: 1,
        accounts: [{ ...profile(V2, "v2"), address: "0x123" }],
        activeAddress: null,
      },
    ],
    [
      "a duplicate profile",
      {
        version: 1,
        accounts: [
          profile(V2, "v2"),
          profile(V2.toUpperCase().replace("0X", "0x"), "v2"),
        ],
        activeAddress: null,
      },
    ],
    [
      "an active profile that is not listed",
      {
        version: 1,
        accounts: [profile(V2, "v2")],
        activeAddress: `0x${"9".repeat(40)}`,
      },
    ],
    [
      "a token issued for another address",
      {
        version: 1,
        accounts: [{ ...profile(V2, "v2"), jwt: fakeJwt({ sub: LEGACY }) }],
        activeAddress: V2,
      },
    ],
    [
      "a token that is not a JWT",
      {
        version: 1,
        accounts: [{ ...profile(V2, "v2"), jwt: "not-a-token" }],
        activeAddress: V2,
      },
    ],
  ])("rejects a shell snapshot with %s and writes nothing", (_name, saved) => {
    expect(() => restoreDesktopProfileState(saved)).toThrow(TypeError);
    expect(persistAccountsWithActive).not.toHaveBeenCalled();
  });

  it("round-trips a checksummed address through the shell", () => {
    const checksummed = "0xAbCdEf0123456789aBcDeF0123456789AbCdEf01";
    jest
      .mocked(getConnectedWalletAccounts)
      .mockReturnValue([{ ...profile(checksummed, "v2"), refreshToken: null }]);
    jest.mocked(getWalletAddress).mockReturnValue(checksummed);

    const saved = getPageDesktopProfileState();
    restoreDesktopProfileState(saved);

    expect(saved.activeAddress).toBe(checksummed.toLowerCase());
    expect(persistAccountsWithActive).toHaveBeenLastCalledWith(
      [{ ...profile(checksummed, "v2"), address: checksummed.toLowerCase() }],
      checksummed.toLowerCase()
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
