import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { StoredDeviceKey } from "@/lib/device-signing/device-key-storage";
import { installNodeWebCrypto } from "../../lib/device-signing/device-signing-test-utils";

const mockRecords = new Map<string, StoredDeviceKey>();
let mockFailStorageWrites = false;
jest.mock("@/lib/device-signing/device-key-storage", () => ({
  deviceKeyStorage: {
    read: async (address: string) => mockRecords.get(address),
    write: async (record: StoredDeviceKey) => {
      if (mockFailStorageWrites) {
        throw new Error("IndexedDB unavailable");
      }
      mockRecords.set(record.address, record);
    },
    readAll: async () => [...mockRecords.values()],
  },
}));

let mockEnabled = true;
jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => mockEnabled,
}));

let mockClientType: "web" | "native" = "web";
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
import {
  buildDeviceGrantUrn,
  renderDeviceGrantStatement,
  renderLegacyDeviceGrantStatement,
} from "@/lib/device-signing/grant-message";
import { loginWithSessionV2 } from "@/services/auth/session-v2.utils";

const SIGNER = "0x1111111111111111111111111111111111111111";
const SCOPES = "post,edit,delete,react";
const loginMock = loginWithSessionV2 as jest.Mock;

const ordinaryMessage = [
  "https://staging.6529.io wants you to sign in with your Ethereum account:",
  SIGNER,
  "",
  "Sign in to 6529.",
  "",
  "URI: https://staging.6529.io",
  "Version: 1",
  "Chain ID: 1",
  "Nonce: a1b2c3d4e5f60718293a4b5c6d7e8f90",
  "Issued At: 2026-10-12T12:00:00.000Z",
  "Expiration Time: 2026-10-12T12:05:00.000Z",
].join("\n");

const grantMessage = (
  deviceKeyHex: string,
  signer = SIGNER,
  renderStatement = renderDeviceGrantStatement
): string => {
  const terms = {
    deviceKeyHex,
    scopes: SCOPES.split(","),
    expiresAtSeconds: Math.floor(Date.now() / 60_000) * 60 + 180 * 24 * 60 * 60,
  };
  return [
    ...ordinaryMessage.split("\n").slice(0, 1),
    signer,
    "",
    renderStatement(terms),
    ...ordinaryMessage.split("\n").slice(4),
    "Resources:",
    `- ${buildDeviceGrantUrn(terms)}`,
  ].join("\n");
};

type NonceParams = {
  readonly signerAddress: string;
  readonly deviceGrant?: { readonly device_key: string } | undefined;
};

const createSubject = (
  nonceFor: (params: NonceParams) => string | Promise<string> = (params) =>
    params.deviceGrant
      ? grantMessage(params.deviceGrant.device_key, params.signerAddress)
      : ordinaryMessage
) => {
  const getNonce = jest.fn(async (params: NonceParams) => ({
    signable_message: await nonceFor(params),
    server_signature: "server-signature",
  }));
  const getSignature = jest.fn(
    async (): Promise<{
      signature: string | null;
      userRejected: boolean;
      failureToastShown: boolean;
    }> => ({
      signature: "0xsigned",
      userRejected: false,
      failureToastShown: false,
    })
  );
  const setToast = jest.fn();
  const signIn = createAuthRequestSignIn({ getNonce, getSignature, setToast });
  return { getNonce, getSignature, setToast, signIn };
};

const flushPromises = async () => {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve();
  }
};

const ELECTRON_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) 6529/1.0.0 Chrome/138.0.0.0 Electron/37.2.0 Safari/537.36";

describe("sign-in with a device grant", () => {
  let userAgentSpy: jest.SpyInstance | null = null;
  beforeAll(installNodeWebCrypto);
  afterEach(() => {
    userAgentSpy?.mockRestore();
    userAgentSpy = null;
  });
  beforeEach(() => {
    mockRecords.clear();
    mockEnabled = true;
    mockClientType = "web";
    mockFailStorageWrites = false;
    loginMock.mockReset();
    loginMock.mockImplementation(async () => ({
      address: SIGNER,
      role: null,
      access_token: "jwt",
      access_token_expires_at: "2026-10-12T13:00:00.000Z",
      client_type: "web",
      device_grant: {
        id: `0x${"7".repeat(64)}`,
        wallet: SIGNER,
        key_type: "ed25519",
        device_key: mockRecords.get(SIGNER)?.publicKeyHex,
        scopes: SCOPES.split(","),
        device_label: "Browser",
        domain: "staging.6529.io",
        issued_at: Date.now(),
        expires_at: Date.now() + 180 * 86_400_000,
        created_at: Date.now(),
        revoked_at: null,
        last_used_at: null,
      } as ApiDeviceGrant,
    }));
  });

  it("asks for a grant for this device's key, checks it, sends the label and stores the grant", async () => {
    const { getNonce, getSignature, signIn } = createSubject();

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: true });

    const record = mockRecords.get(SIGNER);
    expect(record?.publicKeyHex).toMatch(/^0x[0-9a-f]{64}$/);
    expect(getNonce).toHaveBeenCalledTimes(1);
    expect(getNonce).toHaveBeenCalledWith({
      signerAddress: SIGNER,
      deviceGrant: {
        device_key: record?.publicKeyHex,
        device_key_type: "ed25519",
        device_scopes: SCOPES,
      },
    });
    expect(getSignature).toHaveBeenCalledWith({
      message: grantMessage(record!.publicKeyHex),
    });
    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({ deviceLabel: expect.any(String) })
    );
    await flushPromises();
    expect(mockRecords.get(SIGNER)?.grant?.device_key).toBe(
      record?.publicKeyHex
    );
  });

  it("signs a grant challenge from a server still on the legacy statement", async () => {
    const { getSignature, signIn } = createSubject((params) =>
      params.deviceGrant
        ? grantMessage(
            params.deviceGrant.device_key,
            params.signerAddress,
            renderLegacyDeviceGrantStatement
          )
        : ordinaryMessage
    );

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: true });

    const record = mockRecords.get(SIGNER);
    expect(getSignature).toHaveBeenCalledTimes(1);
    expect(getSignature).toHaveBeenCalledWith({
      message: grantMessage(
        record!.publicKeyHex,
        SIGNER,
        renderLegacyDeviceGrantStatement
      ),
    });
    await flushPromises();
    expect(mockRecords.get(SIGNER)?.grant?.device_key).toBe(
      record?.publicKeyHex
    );
  });

  it.each([
    ["the flag is off", () => (mockEnabled = false), null],
    ["the client is native", () => (mockClientType = "native"), null],
    [
      "running in 6529 Desktop (Electron)",
      () => {
        userAgentSpy = jest
          .spyOn(globalThis.navigator, "userAgent", "get")
          .mockReturnValue(ELECTRON_USER_AGENT);
      },
      null,
    ],
    ["acting through a proxy role", () => undefined, "proxy-role"],
  ])("signs in exactly as before when %s", async (_case, arrange, role) => {
    arrange();
    const { getNonce, getSignature, signIn } = createSubject();

    await expect(signIn({ signerAddress: SIGNER, role })).resolves.toEqual({
      success: true,
    });
    expect(getNonce).toHaveBeenCalledWith({ signerAddress: SIGNER });
    expect(getSignature).toHaveBeenCalledWith({ message: ordinaryMessage });
    expect(loginMock.mock.calls[0]![0]).not.toHaveProperty("deviceLabel");
    expect(mockRecords.size).toBe(0);
  });

  it("still signs in normally when the device key cannot be set up", async () => {
    mockFailStorageWrites = true;
    const { getNonce, getSignature, signIn } = createSubject();

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: true });
    expect(getNonce).toHaveBeenCalledWith({ signerAddress: SIGNER });
    expect(getSignature).toHaveBeenCalledWith({ message: ordinaryMessage });
  });

  it("uses an ordinary challenge as is when the server ignores the grant", async () => {
    const { getNonce, getSignature, signIn } = createSubject(
      () => ordinaryMessage
    );

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: true });
    expect(getNonce).toHaveBeenCalledTimes(1);
    expect(getSignature).toHaveBeenCalledWith({ message: ordinaryMessage });
    expect(loginMock.mock.calls[0]![0]).not.toHaveProperty("deviceLabel");
  });

  it("never signs a grant for another key and falls back to an ordinary challenge", async () => {
    const { getNonce, getSignature, signIn } = createSubject((params) =>
      params.deviceGrant
        ? grantMessage(`0x${"ab".repeat(32)}`)
        : ordinaryMessage
    );

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: true });
    expect(getNonce).toHaveBeenCalledTimes(2);
    expect(getNonce).toHaveBeenLastCalledWith({ signerAddress: SIGNER });
    expect(getSignature).toHaveBeenCalledTimes(1);
    expect(getSignature).toHaveBeenCalledWith({ message: ordinaryMessage });
  });

  it("falls back to an ordinary challenge when the grant request fails", async () => {
    const { getNonce, getSignature, signIn } = createSubject((params) => {
      if (params.deviceGrant) {
        throw new Error("400 Bad Request");
      }
      return ordinaryMessage;
    });

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: true });
    expect(getNonce).toHaveBeenCalledTimes(2);
    expect(getSignature).toHaveBeenCalledWith({ message: ordinaryMessage });
  });

  it("does not ask the wallet to sign when a requested grant is unavailable", async () => {
    const { getSignature, setToast, signIn } = createSubject(
      () => ordinaryMessage
    );

    await expect(
      signIn({ signerAddress: SIGNER, role: null, deviceGrantMode: "required" })
    ).resolves.toEqual({ success: false });
    expect(getSignature).not.toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledWith({
      message: "Couldn't turn on signed messages. Please try again.",
      type: "error",
    });
  });

  it("renews through an ordinary sign-in only when the stored grant is in its last 14 days", async () => {
    const first = createSubject();
    await first.signIn({ signerAddress: SIGNER, role: null });
    await flushPromises();

    const again = createSubject();
    await again.signIn({ signerAddress: SIGNER, role: null });
    expect(again.getNonce).toHaveBeenCalledWith({ signerAddress: SIGNER });

    const record = mockRecords.get(SIGNER)!;
    mockRecords.set(SIGNER, {
      ...record,
      grant: { ...record.grant!, expires_at: Date.now() + 5 * 86_400_000 },
    } as StoredDeviceKey);
    const renewal = createSubject();
    await renewal.signIn({ signerAddress: SIGNER, role: null });
    expect(renewal.getNonce).toHaveBeenCalledWith(
      expect.objectContaining({ deviceGrant: expect.any(Object) })
    );
  });

  describe("when a grant sign-in does not finish", () => {
    // Each case uses its own wallet: the fallback lasts for the page.
    const walletOf = (digit: string) => `0x${digit.repeat(40)}`;
    const declined = {
      signature: null,
      userRejected: true,
      failureToastShown: false,
    };

    const expectOrdinaryNextSignIn = async (
      subject: ReturnType<typeof createSubject>,
      signer: string
    ) => {
      subject.getNonce.mockClear();
      subject.getSignature.mockClear();
      await expect(
        subject.signIn({ signerAddress: signer, role: null })
      ).resolves.toEqual({ success: true });
      expect(subject.getNonce).toHaveBeenCalledTimes(1);
      expect(subject.getNonce).toHaveBeenCalledWith({ signerAddress: signer });
      expect(subject.getSignature).toHaveBeenCalledWith({
        message: ordinaryMessage,
      });
      expect(loginMock.mock.calls.at(-1)![0]).not.toHaveProperty("deviceLabel");
    };

    it.each([
      ["the wallet declines it", "2", declined],
      [
        "the wallet cannot sign it",
        "3",
        { signature: null, userRejected: false, failureToastShown: true },
      ],
    ])(
      "signs in with the ordinary challenge next time when %s",
      async (_case, digit, failure) => {
        const signer = walletOf(digit);
        const subject = createSubject();
        subject.getSignature.mockResolvedValueOnce(failure);

        await expect(
          subject.signIn({ signerAddress: signer, role: null })
        ).resolves.toEqual({ success: false });
        expect(subject.getSignature).toHaveBeenCalledWith({
          message: grantMessage(mockRecords.get(signer)!.publicKeyHex, signer),
        });

        await expectOrdinaryNextSignIn(subject, signer);
      }
    );

    it("signs in with the ordinary challenge next time when the grant login fails", async () => {
      const signer = walletOf("4");
      const subject = createSubject();
      loginMock.mockRejectedValueOnce(new Error("500 Internal Server Error"));

      await expect(
        subject.signIn({ signerAddress: signer, role: null })
      ).resolves.toEqual({ success: false });
      expect(loginMock).toHaveBeenCalledWith(
        expect.objectContaining({ deviceLabel: expect.any(String) })
      );

      await expectOrdinaryNextSignIn(subject, signer);
    });

    it("still asks for a grant when signed messages are turned on", async () => {
      const signer = walletOf("5");
      const subject = createSubject();
      subject.getSignature.mockResolvedValueOnce(declined);
      await subject.signIn({ signerAddress: signer, role: null });
      subject.getNonce.mockClear();

      await expect(
        subject.signIn({
          signerAddress: signer,
          role: null,
          deviceGrantMode: "required",
        })
      ).resolves.toEqual({ success: true });
      expect(subject.getNonce).toHaveBeenCalledWith(
        expect.objectContaining({
          signerAddress: signer,
          deviceGrant: expect.any(Object),
        })
      );
    });
  });
});
