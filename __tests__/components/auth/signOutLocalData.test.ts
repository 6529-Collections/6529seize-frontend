import { signOutAndRemoveLocalData } from "@/components/auth/signOutLocalData";
import { removeCreateWaveDrafts } from "@/helpers/waves/create-wave-draft.helpers";
import { clearAllWaveDrafts } from "@/helpers/waves/wave-draft.helpers";
import {
  clearAllWalletAuth,
  invalidateAuthSessionForAddress,
  removeAuthJwt,
  setActiveWalletAccount,
  setAuthJwt,
  syncConnectedWalletProfile,
} from "@/services/auth/auth.utils";
import {
  DisplayedProfileChangedError,
  showSignedInWallet,
} from "@/services/auth/displayed-wallet-guard";

jest.mock("@/services/auth/native-refresh-token-storage", () => ({
  removeNativeRefreshToken: jest.fn(async () => undefined),
}));
// The real cleanup runs; the spies show which paths reach it.
jest.mock("@/helpers/waves/wave-draft.helpers", () => {
  const actual = jest.requireActual("@/helpers/waves/wave-draft.helpers");
  return { ...actual, clearAllWaveDrafts: jest.fn(actual.clearAllWaveDrafts) };
});
jest.mock("@/helpers/waves/create-wave-draft.helpers", () => {
  const actual = jest.requireActual(
    "@/helpers/waves/create-wave-draft.helpers"
  );
  return {
    ...actual,
    removeCreateWaveDrafts: jest.fn(actual.removeCreateWaveDrafts),
  };
});

const WALLET_X = "0x1111111111111111111111111111111111111111";
const WALLET_Y = "0x2222222222222222222222222222222222222222";
const WALLET_Z = "0x3333333333333333333333333333333333333333";
const PROFILE_P = "profile-p";
const PROFILE_Q = "profile-q";

const CHAT_DRAFT_KEY = "wave-draft:v1:wave-1";
const LEGACY_WAVE_DRAFTS_KEY = "create-wave-drafts:v1";
const waveDraftsKey = (wallet: string, profileId: string) =>
  `create-wave-drafts:v2:${wallet.toLowerCase()}:${profileId}`;
const grantHintKey = (wallet: string) =>
  `6529-device-grant-hint:${wallet.toLowerCase()}`;
const ROLE_KEY_X = `auth-role-${WALLET_X.toLowerCase()}`;

const signIn = (wallet: string, profileId: string): void => {
  setAuthJwt(wallet, `jwt-${wallet}`, `refresh-${wallet}`, profileId);
  syncConnectedWalletProfile(wallet, profileId, null);
};

const seedLocalData = (): void => {
  globalThis.sessionStorage.setItem(CHAT_DRAFT_KEY, "{}");
  globalThis.localStorage.setItem(LEGACY_WAVE_DRAFTS_KEY, "[]");
  globalThis.localStorage.setItem(waveDraftsKey(WALLET_X, PROFILE_P), "[]");
  globalThis.localStorage.setItem(waveDraftsKey(WALLET_Y, PROFILE_Q), "[]");
  globalThis.localStorage.setItem(grantHintKey(WALLET_X), "{}");
  globalThis.localStorage.setItem(grantHintKey(WALLET_Y), "{}");
};

const has = (storage: Storage, key: string): boolean =>
  storage.getItem(key) !== null;

const expectCleanupNotRun = (): void => {
  expect(clearAllWaveDrafts).not.toHaveBeenCalled();
  expect(removeCreateWaveDrafts).not.toHaveBeenCalled();
};

let resetShownWallet: () => void = () => undefined;

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
});

afterEach(() => {
  resetShownWallet();
  resetShownWallet = () => undefined;
  jest.useRealTimers();
});

describe("signOutAndRemoveLocalData", () => {
  it("removes the signed-out profile's drafts on sign-out", async () => {
    signIn(WALLET_Y, PROFILE_Q);
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();
    resetShownWallet = showSignedInWallet(WALLET_X);

    await signOutAndRemoveLocalData("profile", removeAuthJwt);

    const local = globalThis.localStorage;
    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(false);
    expect(has(local, waveDraftsKey(WALLET_X, PROFILE_P))).toBe(false);
    expect(has(local, ROLE_KEY_X)).toBe(false);
    // The profile that stays signed in keeps its data.
    expect(has(local, waveDraftsKey(WALLET_Y, PROFILE_Q))).toBe(true);
    expect(has(local, LEGACY_WAVE_DRAFTS_KEY)).toBe(true);
    // Device-grant notes stay with the device keys.
    expect(has(local, grantHintKey(WALLET_X))).toBe(true);
    expect(has(local, grantHintKey(WALLET_Y))).toBe(true);
  });

  it("keeps a profile's drafts while another of its wallets stays signed in", async () => {
    signIn(WALLET_Z, PROFILE_P);
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();

    await signOutAndRemoveLocalData("profile", removeAuthJwt);

    expect(
      has(globalThis.localStorage, waveDraftsKey(WALLET_X, PROFILE_P))
    ).toBe(true);
  });

  it("removes every profile's drafts on sign out all", async () => {
    signIn(WALLET_Y, PROFILE_Q);
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();

    await signOutAndRemoveLocalData("all", clearAllWalletAuth);

    const local = globalThis.localStorage;
    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(false);
    expect(has(local, waveDraftsKey(WALLET_X, PROFILE_P))).toBe(false);
    expect(has(local, waveDraftsKey(WALLET_Y, PROFILE_Q))).toBe(false);
    expect(has(local, LEGACY_WAVE_DRAFTS_KEY)).toBe(false);
    expect(has(local, ROLE_KEY_X)).toBe(false);
    expect(has(local, grantHintKey(WALLET_X))).toBe(true);
    expect(has(local, grantHintKey(WALLET_Y))).toBe(true);
  });

  it("keeps everything when the sign-out fails", async () => {
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();
    const failure = new Error("wallet did not disconnect");

    await expect(
      signOutAndRemoveLocalData("profile", async () => {
        throw failure;
      })
    ).rejects.toBe(failure);

    expectCleanupNotRun();
    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(true);
    expect(
      has(globalThis.localStorage, waveDraftsKey(WALLET_X, PROFILE_P))
    ).toBe(true);
  });

  it("keeps everything when the sign-out did not sign anyone out", async () => {
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();

    await signOutAndRemoveLocalData("all", async () => undefined);

    expectCleanupNotRun();
    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(true);
    expect(has(globalThis.localStorage, LEGACY_WAVE_DRAFTS_KEY)).toBe(true);
  });
});

describe("sign-out from a tab that shows another profile", () => {
  it.each(["profile", "all"] as const)(
    "refuses %s sign-out, signs nothing out and catches up",
    async (scope) => {
      jest.useFakeTimers();
      signIn(WALLET_X, PROFILE_P);
      signIn(WALLET_Y, PROFILE_Q);
      seedLocalData();
      // Another tab selected Y; this tab still shows X.
      resetShownWallet = showSignedInWallet(WALLET_X);
      const signOut = jest.fn(async () => undefined);
      const keys: (string | null)[] = [];
      const onStorage = (event: Event) => {
        keys.push((event as StorageEvent).key);
      };
      globalThis.addEventListener("storage", onStorage);

      await expect(
        signOutAndRemoveLocalData(scope, signOut)
      ).rejects.toBeInstanceOf(DisplayedProfileChangedError);

      expect(signOut).not.toHaveBeenCalled();
      expectCleanupNotRun();
      expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(true);
      jest.runAllTimers();
      expect(keys).toEqual(["6529-wallet-active-address"]);
      globalThis.removeEventListener("storage", onStorage);
    }
  );

  it.each([
    ["profile", removeAuthJwt],
    ["all", clearAllWalletAuth],
  ] as const)(
    "runs %s sign-out when this tab shows the stored profile",
    async (scope, action) => {
      signIn(WALLET_X, PROFILE_P);
      seedLocalData();
      resetShownWallet = showSignedInWallet(WALLET_X.toUpperCase());
      const signOut = jest.fn(action);

      await signOutAndRemoveLocalData(scope, signOut);

      expect(signOut).toHaveBeenCalledTimes(1);
      expect(clearAllWaveDrafts).toHaveBeenCalled();
      expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(false);
    }
  );
});

describe("drafts when a session ends without an explicit sign-out", () => {
  it("survive an expired session for the same profile", async () => {
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();

    await invalidateAuthSessionForAddress(WALLET_X);
    signIn(WALLET_X, PROFILE_P);

    expectCleanupNotRun();
    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(true);
    expect(
      has(globalThis.localStorage, waveDraftsKey(WALLET_X, PROFILE_P))
    ).toBe(true);
  });

  it("survive a session that the app drops after a rejected token", async () => {
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();

    await removeAuthJwt();

    expectCleanupNotRun();
    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(true);
    expect(
      has(globalThis.localStorage, waveDraftsKey(WALLET_X, PROFILE_P))
    ).toBe(true);
  });

  it("survive a profile switch", async () => {
    signIn(WALLET_Y, PROFILE_Q);
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();

    setActiveWalletAccount(WALLET_Y);

    expectCleanupNotRun();
    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(true);
    expect(
      has(globalThis.localStorage, waveDraftsKey(WALLET_X, PROFILE_P))
    ).toBe(true);
  });
});
