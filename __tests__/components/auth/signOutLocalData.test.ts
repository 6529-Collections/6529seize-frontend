import { signOutAndRemoveLocalData } from "@/components/auth/signOutLocalData";
import {
  clearAllWalletAuth,
  invalidateAuthSessionForAddress,
  removeAuthJwt,
  setActiveWalletAccount,
  setAuthJwt,
  syncConnectedWalletProfile,
} from "@/services/auth/auth.utils";

jest.mock("@/services/auth/native-refresh-token-storage", () => ({
  removeNativeRefreshToken: jest.fn(async () => undefined),
}));

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

beforeEach(() => {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
});

describe("signOutAndRemoveLocalData", () => {
  it("removes the signed-out profile's drafts and grant note on sign-out", async () => {
    signIn(WALLET_Y, PROFILE_Q);
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();

    await signOutAndRemoveLocalData("profile", removeAuthJwt);

    const local = globalThis.localStorage;
    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(false);
    expect(has(local, waveDraftsKey(WALLET_X, PROFILE_P))).toBe(false);
    expect(has(local, grantHintKey(WALLET_X))).toBe(false);
    expect(has(local, ROLE_KEY_X)).toBe(false);
    // The profile that stays signed in keeps its data.
    expect(has(local, waveDraftsKey(WALLET_Y, PROFILE_Q))).toBe(true);
    expect(has(local, grantHintKey(WALLET_Y))).toBe(true);
    expect(has(local, LEGACY_WAVE_DRAFTS_KEY)).toBe(true);
  });

  it("keeps a profile's drafts while another of its wallets stays signed in", async () => {
    signIn(WALLET_Z, PROFILE_P);
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();

    await signOutAndRemoveLocalData("profile", removeAuthJwt);

    expect(
      has(globalThis.localStorage, waveDraftsKey(WALLET_X, PROFILE_P))
    ).toBe(true);
    expect(has(globalThis.localStorage, grantHintKey(WALLET_X))).toBe(false);
  });

  it("removes every profile's drafts and grant notes on sign out all", async () => {
    signIn(WALLET_Y, PROFILE_Q);
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();

    await signOutAndRemoveLocalData("all", clearAllWalletAuth);

    const local = globalThis.localStorage;
    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(false);
    expect(has(local, waveDraftsKey(WALLET_X, PROFILE_P))).toBe(false);
    expect(has(local, waveDraftsKey(WALLET_Y, PROFILE_Q))).toBe(false);
    expect(has(local, LEGACY_WAVE_DRAFTS_KEY)).toBe(false);
    expect(has(local, grantHintKey(WALLET_X))).toBe(false);
    expect(has(local, grantHintKey(WALLET_Y))).toBe(false);
    expect(has(local, ROLE_KEY_X)).toBe(false);
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

    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(true);
    expect(
      has(globalThis.localStorage, waveDraftsKey(WALLET_X, PROFILE_P))
    ).toBe(true);
    expect(has(globalThis.localStorage, grantHintKey(WALLET_X))).toBe(true);
  });

  it("keeps everything when the sign-out did not sign anyone out", async () => {
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();

    await signOutAndRemoveLocalData("all", async () => undefined);

    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(true);
    expect(has(globalThis.localStorage, LEGACY_WAVE_DRAFTS_KEY)).toBe(true);
    expect(has(globalThis.localStorage, grantHintKey(WALLET_X))).toBe(true);
  });
});

describe("drafts when a session ends without an explicit sign-out", () => {
  it("survive an expired session for the same profile", async () => {
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();

    await invalidateAuthSessionForAddress(WALLET_X);
    signIn(WALLET_X, PROFILE_P);

    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(true);
    expect(
      has(globalThis.localStorage, waveDraftsKey(WALLET_X, PROFILE_P))
    ).toBe(true);
  });

  it("survive a session that the app drops after a rejected token", async () => {
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();

    await removeAuthJwt();

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

    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(true);
    expect(
      has(globalThis.localStorage, waveDraftsKey(WALLET_X, PROFILE_P))
    ).toBe(true);
  });
});
