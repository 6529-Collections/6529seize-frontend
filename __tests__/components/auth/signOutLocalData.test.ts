import { renderHook } from "@testing-library/react";
import type { EditorState } from "lexical";
import { act, createElement, type ReactNode } from "react";
import { signOutAndRemoveLocalData } from "@/components/auth/signOutLocalData";
import { registerE2eeSignOutHost } from "@/components/e2ee/signout/e2eeSignOut";
import { useWaveDraftPersistence } from "@/components/waves/create-drop-content/useWaveDraftPersistence";
import { EditingDropProvider } from "@/contexts/EditingDropContext";
import { removeCreateWaveDrafts } from "@/helpers/waves/create-wave-draft.helpers";
import { clearAllWaveDrafts } from "@/helpers/waves/wave-draft.helpers";
import {
  clearAllWalletAuth,
  invalidateAuthSessionForAddress,
  PROFILE_SWITCHED_EVENT,
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
    resetShownWallet = showSignedInWallet(WALLET_X);

    await signOutAndRemoveLocalData("profile", removeAuthJwt);

    expect(
      has(globalThis.localStorage, waveDraftsKey(WALLET_X, PROFILE_P))
    ).toBe(true);
  });

  it("removes every profile's drafts on sign out all", async () => {
    signIn(WALLET_Y, PROFILE_Q);
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();
    resetShownWallet = showSignedInWallet(WALLET_X);

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

  it("removes a wallet's drafts saved without a profile id only for that wallet", async () => {
    signIn(WALLET_Y, PROFILE_Q);
    signIn(WALLET_X, PROFILE_P);
    const local = globalThis.localStorage;
    local.setItem(waveDraftsKey(WALLET_X, ""), "[]");
    local.setItem(waveDraftsKey(WALLET_Y, ""), "[]");
    resetShownWallet = showSignedInWallet(WALLET_X);

    await signOutAndRemoveLocalData("profile", removeAuthJwt);

    expect(has(local, waveDraftsKey(WALLET_X, ""))).toBe(false);
    expect(has(local, waveDraftsKey(WALLET_Y, ""))).toBe(true);
  });

  it("signs out as before when this tab shows no signed-in wallet", async () => {
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();
    const signOut = jest.fn(removeAuthJwt);

    await signOutAndRemoveLocalData("profile", signOut);

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(false);
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

describe("sign-out while the encrypted-messages choice is open", () => {
  let releaseChoice: () => void = () => undefined;
  let unregisterHost: () => void = () => undefined;

  beforeEach(() => {
    const choice = new Promise<void>((resolve) => {
      releaseChoice = resolve;
    });
    unregisterHost = registerE2eeSignOutHost(async (_scope, signOut) => {
      await choice;
      await signOut();
    });
  });

  afterEach(() => {
    unregisterHost();
  });

  it("refuses when another tab changes the stored profile meanwhile", async () => {
    signIn(WALLET_Y, PROFILE_Q);
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();
    resetShownWallet = showSignedInWallet(WALLET_X);
    const signOut = jest.fn(removeAuthJwt);

    const pending = signOutAndRemoveLocalData("profile", signOut);
    setActiveWalletAccount(WALLET_Y);
    releaseChoice();

    await expect(pending).rejects.toBeInstanceOf(DisplayedProfileChangedError);
    expect(signOut).not.toHaveBeenCalled();
    expectCleanupNotRun();
    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(true);
  });

  it("signs out the accounts connected when the choice is confirmed", async () => {
    signIn(WALLET_X, PROFILE_P);
    seedLocalData();
    resetShownWallet = showSignedInWallet(WALLET_X);

    const pending = signOutAndRemoveLocalData("all", clearAllWalletAuth);
    // Another tab adds a profile; the selection returns to X.
    signIn(WALLET_Y, PROFILE_Q);
    setActiveWalletAccount(WALLET_X);
    releaseChoice();
    await pending;

    expect(
      has(globalThis.localStorage, waveDraftsKey(WALLET_Y, PROFILE_Q))
    ).toBe(false);
  });
});

describe("a pending chat draft save at sign-out", () => {
  const typedState = {
    toJSON: () => ({
      root: {
        type: "root",
        children: [
          { type: "paragraph", children: [{ type: "text", text: "typed" }] },
        ],
      },
    }),
  } as unknown as EditorState;

  const renderComposer = () =>
    renderHook(
      () =>
        useWaveDraftPersistence({
          waveId: "wave-1",
          isDropMode: false,
          activeDrop: null,
          editorState: typedState,
          dropEditorRefreshKey: 0,
        }),
      {
        wrapper: ({ children }: { readonly children: ReactNode }) =>
          createElement(EditingDropProvider, null, children),
      }
    );

  it("is not written back after Logout of the last account", async () => {
    jest.useFakeTimers();
    signIn(WALLET_X, PROFILE_P);
    resetShownWallet = showSignedInWallet(WALLET_X);
    const { unmount } = renderComposer();

    await act(() => signOutAndRemoveLocalData("profile", removeAuthJwt));
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    unmount();

    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(false);
  });

  it("is not written back when the sign-out announces no profile change", async () => {
    jest.useFakeTimers();
    signIn(WALLET_X, PROFILE_P);
    const switched = jest.fn();
    globalThis.addEventListener(PROFILE_SWITCHED_EVENT, switched);
    const { unmount } = renderComposer();

    await act(() =>
      signOutAndRemoveLocalData("profile", async () => {
        for (const key of [
          "6529-wallet-accounts",
          "6529-wallet-active-address",
          "6529-wallet-address",
          "6529-wallet-refresh-token",
        ]) {
          globalThis.localStorage.removeItem(key);
        }
      })
    );
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    unmount();
    globalThis.removeEventListener(PROFILE_SWITCHED_EVENT, switched);

    expect(switched).not.toHaveBeenCalled();
    expect(clearAllWaveDrafts).toHaveBeenCalled();
    expect(has(globalThis.sessionStorage, CHAT_DRAFT_KEY)).toBe(false);
  });
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
