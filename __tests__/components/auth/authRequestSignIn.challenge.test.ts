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
import { logErrorSecurely } from "@/utils/error-sanitizer";
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
  loginMock.mockImplementation(
    async () =>
      ({
        address: SIGNER,
        role: null,
        access_token: "jwt",
        access_token_expires_at: "2026-11-10T15:00:00.000Z",
        client_type: mockClientType,
      }) as Awaited<ReturnType<typeof loginWithSessionV2>>
  );
});

const EXPIRES_LINE = "Expiration Time: 2026-11-10T14:37:52.000Z";
const LONG_TEXT = "x".repeat(2001);

/** Replaces one exact line of a challenge. */
const withLine = (message: string, line: string, replacement: string) => {
  expect(message.split("\n")).toContain(line);
  return message
    .split("\n")
    .map((current) => (current === line ? replacement : current))
    .join("\n");
};

/** Swaps two exact lines of a challenge. */
const swapLines = (message: string, first: string, second: string) =>
  message
    .split("\n")
    .map((current) => {
      if (current === first) return second;
      return current === second ? first : current;
    })
    .join("\n");

describe("sign-in challenge checks on the website", () => {
  const challenge = () => siweSignInChallenge({ address: SIGNER });

  it("signs the website's challenge for this host and wallet", async () => {
    await expectSigned(challenge());
  });

  it("signs the same challenge for a proxy sign-in and sends the role", async () => {
    await expectSigned(challenge(), "proxy-1");
    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "proxy-1", signerAddress: SIGNER })
    );
  });

  it.each([
    [
      "a reworded statement",
      () =>
        siweSignInChallenge({
          address: SIGNER,
          statement: "Welcome back to 6529. Signing costs no gas.",
        }),
    ],
    [
      "another nonce shape",
      () =>
        withLine(
          challenge(),
          "Nonce: 251566deb966204ff0646078ebf6a8f9",
          "Nonce: ab6edf48-fd9f-4809-a2ce-185f0235288c"
        ),
    ],
    [
      "optional Not Before and Request ID fields",
      () =>
        `${challenge()}\nNot Before: 2026-11-10T14:32:52.000Z\nRequest ID: req-42`,
    ],
    [
      "fields in another order",
      () => swapLines(challenge(), "Version: 1", "Chain ID: 1"),
    ],
    [
      "a lifetime of one hour",
      () =>
        withLine(
          challenge(),
          EXPIRES_LINE,
          "Expiration Time: 2026-11-10T15:32:52.000Z"
        ),
    ],
  ])("still signs a challenge with %s", async (_case, build) => {
    await expectSigned(build());
  });

  it.each([
    ["another 6529 host", { origin: "https://staging.6529.io" }],
    ["a gateway host", { origin: "https://ipfs.6529.io" }],
    ["another site", { origin: "https://example.com" }],
    ["another wallet", { address: OTHER_WALLET }],
    ["another chain", { chainId: 5 }],
    ["unrequested resources", { resources: ["https://example.com/terms"] }],
    ["a statement over two lines", { statement: "Sign in.\nApprove tokens." }],
    ["a carriage return in the statement", { statement: "Sign in.\rNow." }],
    ["an over-long statement", { statement: LONG_TEXT }],
    ["an empty statement", { statement: "" }],
    [
      "a device grant it did not request",
      {
        statement: "Sign in.",
        resources: [
          `urn:6529:device-grant:v1:ed25519:${"a".repeat(64)}:post:1`,
        ],
      },
    ],
  ])("refuses a challenge with %s", async (_case, overrides) => {
    await expectRefused(siweSignInChallenge({ address: SIGNER, ...overrides }));
  });

  it.each([
    [
      "a URI for another site",
      "URI: https://6529.io",
      "URI: https://example.com",
    ],
    ["another version", "Version: 1", "Version: 2"],
    [
      "a nonce with whitespace",
      "Nonce: 251566deb966204ff0646078ebf6a8f9",
      "Nonce: 2515 66de",
    ],
    ["an empty nonce", "Nonce: 251566deb966204ff0646078ebf6a8f9", "Nonce: "],
    [
      "a lifetime over one hour",
      EXPIRES_LINE,
      "Expiration Time: 2026-11-10T15:32:53.000Z",
    ],
    [
      "an expiry before it was issued",
      EXPIRES_LINE,
      "Expiration Time: 2026-11-10T14:00:00.000Z",
    ],
    ["an unreadable expiry", EXPIRES_LINE, "Expiration Time: soon"],
    ["no expiry", EXPIRES_LINE, "Not Before: 2026-11-10T14:32:52.000Z"],
  ])("refuses a challenge with %s", async (_case, line, replacement) => {
    await expectRefused(withLine(challenge(), line, replacement));
  });

  it.each([
    ["an unknown field", "Payload Hash: abc"],
    ["a repeated field", "Chain ID: 1"],
    ["a Request ID with spaces", "Request ID: two words"],
    ["an unreadable Not Before", "Not Before: later"],
    ["a line that is not a field", "Approve all tokens"],
  ])("refuses a challenge with %s", async (_case, extraLine) => {
    await expectRefused(`${challenge()}\n${extraLine}`);
  });

  it("refuses the apps' challenge format", async () => {
    await expectRefused(appSignInChallenge({ address: SIGNER }));
  });
});

describe("sign-in challenge checks in 6529 Mobile", () => {
  const challenge = () => appSignInChallenge({ address: SIGNER });
  const PURPOSE_LINE = "Purpose: Sign this message to authenticate with 6529.";

  beforeEach(() => {
    mockClientType = "native";
  });

  it("signs the mobile app's challenge for this API and wallet", async () => {
    await expectSigned(challenge());
  });

  it("signs it for a proxy sign-in", async () => {
    await expectSigned(challenge(), "proxy-1");
  });

  it.each([
    [
      "a reworded purpose",
      () => withLine(challenge(), PURPOSE_LINE, "Purpose: Sign in to 6529."),
    ],
    [
      "fields in another order",
      () => swapLines(challenge(), "Action: login", PURPOSE_LINE),
    ],
    [
      "another nonce shape",
      () =>
        withLine(
          challenge(),
          "Nonce: ab6edf48-fd9f-4809-a2ce-185f0235288c",
          "Nonce: 251566deb966204ff0646078ebf6a8f9"
        ),
    ],
  ])("still signs a challenge with %s", async (_case, build) => {
    await expectSigned(build());
  });

  it.each([
    ["another wallet", { address: OTHER_WALLET }],
    ["another chain", { chainId: 11155111 }],
    ["another API", { audience: "api.example.com" }],
    ["a payload hash", { extraLines: ["Payload Hash: " + "a".repeat(64)] }],
    ["a repeated wallet", { extraLines: [`Wallet: ${OTHER_WALLET}`] }],
    ["a client origin", { extraLines: ["Client Origin: https://6529.io"] }],
  ])("refuses a challenge with %s", async (_case, overrides) => {
    await expectRefused(appSignInChallenge({ address: SIGNER, ...overrides }));
  });

  it.each([
    ["a site domain instead of the app's", "Domain: native", "Domain: 6529.io"],
    ["another action", "Action: login", "Action: create_drop"],
    ["another session type", "Session Type: native", "Session Type: desktop"],
    ["an over-long purpose", PURPOSE_LINE, `Purpose: ${LONG_TEXT}`],
    ["a carriage return in the purpose", PURPOSE_LINE, "Purpose: Sign in.\r"],
    [
      "no nonce",
      "Nonce: ab6edf48-fd9f-4809-a2ce-185f0235288c",
      "Action: login",
    ],
    [
      "a lifetime over one hour",
      EXPIRES_LINE,
      "Expiration Time: 2026-11-10T16:00:00.000Z",
    ],
  ])("refuses a challenge with %s", async (_case, line, replacement) => {
    await expectRefused(withLine(challenge(), line, replacement));
  });

  it("refuses the website's challenge format", async () => {
    await expectRefused(siweSignInChallenge({ address: SIGNER }));
  });
});

describe("refused challenge logging", () => {
  const logMock = jest.mocked(logErrorSecurely);

  beforeEach(() => {
    logMock.mockClear();
  });

  it.each([
    ["origin", { origin: "https://example.com" }],
    ["address", { address: OTHER_WALLET }],
    ["chain", { chainId: 5 }],
    ["resources", { resources: ["https://example.com/terms"] }],
    ["shape", { statement: "Sign in.\nApprove tokens." }],
  ] as const)(
    "logs a refusal for %s with the reason code only",
    async (reason, overrides) => {
      await expectRefused(
        siweSignInChallenge({ address: SIGNER, ...overrides })
      );

      expect(logMock).toHaveBeenCalledTimes(1);
      const [context, error] = logMock.mock.calls[0]!;
      expect(context).toBe(`requestSignIn:challenge-refused:${reason}`);
      const logged = `${context} ${String(error)}`;
      expect(logged).not.toContain(SIGNER);
      expect(logged).not.toContain(OTHER_WALLET);
      expect(logged).not.toContain("251566deb966204ff0646078ebf6a8f9");
      expect((error as { response?: unknown }).response).toBeUndefined();
      expect(logged).not.toContain("wants you to sign in");
    }
  );

  it("logs timestamps and nonce problems by code", async () => {
    await expectRefused(
      withLine(
        siweSignInChallenge({ address: SIGNER }),
        EXPIRES_LINE,
        "Expiration Time: 2026-11-10T14:00:00.000Z"
      )
    );
    await expectRefused(
      withLine(
        siweSignInChallenge({ address: SIGNER }),
        "Nonce: 251566deb966204ff0646078ebf6a8f9",
        "Nonce: two words"
      )
    );

    expect(logMock.mock.calls.map(([context]) => context)).toEqual([
      "requestSignIn:challenge-refused:timestamps",
      "requestSignIn:challenge-refused:nonce",
    ]);
  });

  it("logs nothing for a challenge it signs", async () => {
    await expectSigned(siweSignInChallenge({ address: SIGNER }));

    expect(logMock).not.toHaveBeenCalled();
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
