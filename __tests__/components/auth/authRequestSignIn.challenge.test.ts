/**
 * @jest-environment-options {"url":"https://6529.io/waves"}
 */
let mockClientType: "web" | "native" | "desktop" = "web";
jest.mock("@/services/auth/session-v2.utils", () => ({
  getSessionClientType: () => mockClientType,
  loginWithSessionV2: jest.fn(),
  persistSessionResponse: jest.fn(async () => true),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  canStoreAnotherWalletAccount: () => true,
}));

jest.mock("@/utils/error-sanitizer", () => ({
  ...jest.requireActual("@/utils/error-sanitizer"),
  logErrorSecurely: jest.fn(),
}));

import { createAuthRequestSignIn } from "@/components/auth/authRequestSignIn";
import { loginWithSessionV2 } from "@/services/auth/session-v2.utils";
import {
  appSignInChallenge,
  siweSignInChallenge,
} from "./signInChallengeFixtures";

const SIGNER = "0xabc0000000000000000000000000000000000001";
const OTHER_WALLET = "0x2222222222222222222222222222222222222222";
const loginMock = jest.mocked(loginWithSessionV2);
const VERIFY_FAILED_TOAST = {
  message: "Couldn't verify the authentication response. Please try again.",
  type: "error",
};

const createSubject = (message: string) => {
  const getNonce = jest.fn(async () => ({
    signable_message: message,
    server_signature: "server-signature",
  }));
  const getSignature = jest.fn(async () => ({
    signature: "0xsigned",
    userRejected: false,
    failureToastShown: false,
  }));
  const setToast = jest.fn();
  const signIn = createAuthRequestSignIn({ getNonce, getSignature, setToast });
  return { getSignature, setToast, signIn };
};

const expectSigned = async (message: string, role: string | null = null) => {
  const { getSignature, setToast, signIn } = createSubject(message);
  await expect(signIn({ signerAddress: SIGNER, role })).resolves.toEqual({
    success: true,
  });
  expect(getSignature).toHaveBeenCalledWith({ message });
  expect(setToast).not.toHaveBeenCalled();
};

const expectRefused = async (message: string) => {
  const { getSignature, setToast, signIn } = createSubject(message);
  await expect(signIn({ signerAddress: SIGNER, role: null })).resolves.toEqual({
    success: false,
  });
  expect(getSignature).not.toHaveBeenCalled();
  expect(loginMock).not.toHaveBeenCalled();
  expect(setToast).toHaveBeenCalledWith(VERIFY_FAILED_TOAST);
};

beforeEach(() => {
  mockClientType = "web";
  loginMock.mockReset();
  loginMock.mockImplementation(async () => ({
    address: SIGNER,
    role: null,
    access_token: "jwt",
    access_token_expires_at: "2026-11-10T15:00:00.000Z",
    client_type: mockClientType,
  }));
});

describe("sign-in challenge checks on the website", () => {
  it("signs the website's challenge for this host and wallet", async () => {
    await expectSigned(siweSignInChallenge({ address: SIGNER }));
  });

  it("signs the same challenge for a proxy sign-in and sends the role", async () => {
    await expectSigned(siweSignInChallenge({ address: SIGNER }), "proxy-1");
    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "proxy-1", signerAddress: SIGNER })
    );
  });

  it.each([
    ["another 6529 host", { origin: "https://staging.6529.io" }],
    ["a gateway host", { origin: "https://ipfs.6529.io" }],
    ["another site", { origin: "https://example.com" }],
    ["another wallet", { address: OTHER_WALLET }],
    ["another chain", { chainId: 5 }],
    ["another statement", { statement: "Approve all tokens." }],
    ["unrequested resources", { resources: ["https://example.com/terms"] }],
  ])("refuses a challenge for %s", async (_case, overrides) => {
    await expectRefused(siweSignInChallenge({ address: SIGNER, ...overrides }));
  });

  it("refuses a challenge whose URI names another site", async () => {
    await expectRefused(
      siweSignInChallenge({ address: SIGNER }).replace(
        "URI: https://6529.io",
        "URI: https://example.com"
      )
    );
  });

  it("refuses a challenge with extra lines", async () => {
    await expectRefused(
      `${siweSignInChallenge({ address: SIGNER })}\nRequest ID: 1`
    );
  });

  it("refuses the apps' challenge format", async () => {
    await expectRefused(appSignInChallenge({ address: SIGNER }));
  });
});

describe("sign-in challenge checks in 6529 Mobile", () => {
  beforeEach(() => {
    mockClientType = "native";
  });

  it("signs the mobile app's challenge for this API and wallet", async () => {
    await expectSigned(appSignInChallenge({ address: SIGNER }));
  });

  it("signs it for a proxy sign-in", async () => {
    await expectSigned(appSignInChallenge({ address: SIGNER }), "proxy-1");
  });

  it.each([
    ["another wallet", { address: OTHER_WALLET }],
    ["another chain", { chainId: 11155111 }],
    ["another API", { audience: "api.example.com" }],
    ["extra lines", { extraLines: ["Payload Hash: " + "a".repeat(64)] }],
  ])("refuses a challenge for %s", async (_case, overrides) => {
    await expectRefused(appSignInChallenge({ address: SIGNER, ...overrides }));
  });

  it("refuses a challenge with a site domain instead of the app's", async () => {
    await expectRefused(
      appSignInChallenge({ address: SIGNER }).replace(
        "Domain: native",
        "Domain: 6529.io"
      )
    );
  });

  it("refuses another action", async () => {
    await expectRefused(
      appSignInChallenge({ address: SIGNER }).replace(
        "Action: login",
        "Action: create_drop"
      )
    );
  });

  it("refuses the website's challenge format", async () => {
    await expectRefused(siweSignInChallenge({ address: SIGNER }));
  });
});

describe("sign-in challenge checks in 6529 Desktop off its loopback page", () => {
  it("refuses a desktop challenge when the page is not the app's local server", async () => {
    mockClientType = "desktop";
    await expectRefused(
      appSignInChallenge({
        address: SIGNER,
        clientType: "desktop",
        origin: "http://localhost:6529",
      })
    );
  });
});
