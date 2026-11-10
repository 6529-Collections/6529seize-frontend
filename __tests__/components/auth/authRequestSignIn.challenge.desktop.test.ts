/**
 * @jest-environment-options {"url":"http://localhost:6529/"}
 */
jest.mock("@/services/auth/session-v2.utils", () => ({
  getSessionClientType: () => "desktop",
  loginWithSessionV2: jest.fn(async () => ({
    address: "0xabc0000000000000000000000000000000000001",
    role: null,
    access_token: "jwt",
    access_token_expires_at: "2026-11-10T15:00:00.000Z",
    client_type: "desktop",
  })),
  persistSessionResponse: jest.fn(async () => true),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  canStoreAnotherWalletAccount: () => true,
}));

import { createAuthRequestSignIn } from "@/components/auth/authRequestSignIn";
import { appSignInChallenge } from "./signInChallengeFixtures";

const SIGNER = "0xabc0000000000000000000000000000000000001";

const signInWith = async (message: string, role: string | null = null) => {
  const getSignature = jest.fn(async () => ({
    signature: "0xsigned",
    userRejected: false,
    failureToastShown: false,
  }));
  const setToast = jest.fn();
  const signIn = createAuthRequestSignIn({
    getNonce: async () => ({
      signable_message: message,
      server_signature: "server-signature",
    }),
    getSignature,
    setToast,
  });
  const result = await signIn({ signerAddress: SIGNER, role });
  return { getSignature, result };
};

describe("sign-in challenge checks in 6529 Desktop", () => {
  const desktopChallenge = (origin = "http://localhost:6529") =>
    appSignInChallenge({ address: SIGNER, clientType: "desktop", origin });

  it("signs the desktop app's challenge for its local page", async () => {
    const { getSignature, result } = await signInWith(desktopChallenge());
    expect(result).toEqual({ success: true });
    expect(getSignature).toHaveBeenCalledWith({ message: desktopChallenge() });
  });

  it("signs it for a proxy sign-in", async () => {
    const { result } = await signInWith(desktopChallenge(), "proxy-1");
    expect(result).toEqual({ success: true });
  });

  it.each([
    "http://localhost:6530",
    "http://127.0.0.1:6529",
    "https://6529.io",
  ])("refuses a challenge for the page %s", async (origin) => {
    const { getSignature, result } = await signInWith(desktopChallenge(origin));
    expect(result).toEqual({ success: false });
    expect(getSignature).not.toHaveBeenCalled();
  });

  it("refuses the mobile app's challenge", async () => {
    const { getSignature } = await signInWith(
      appSignInChallenge({ address: SIGNER })
    );
    expect(getSignature).not.toHaveBeenCalled();
  });
});
