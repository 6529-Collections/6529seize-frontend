import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { StoredDeviceKey } from "@/lib/device-signing/device-key-storage";
import type { LoginE2eeDevice } from "@/lib/device-signing/login-e2ee";
import { installNodeWebCrypto } from "../../lib/device-signing/device-signing-test-utils";

const mockRecords = new Map<string, StoredDeviceKey>();
jest.mock("@/lib/device-signing/device-key-storage", () => ({
  deviceKeyStorage: {
    read: async (address: string) => mockRecords.get(address),
    write: async (record: StoredDeviceKey) => {
      mockRecords.set(record.address, record);
    },
    readAll: async () => [...mockRecords.values()],
  },
}));

jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => true,
}));

jest.mock("@/services/auth/session-v2.utils", () => ({
  getSessionClientType: () => "web",
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

const mockPrepareE2ee = jest.fn<Promise<LoginE2eeDevice | null>, []>();
jest.mock("@/lib/device-signing/login-e2ee", () => ({
  ...jest.requireActual("@/lib/device-signing/login-e2ee"),
  prepareLoginE2eeDevice: () => mockPrepareE2ee(),
}));

const mockAdopt = jest.fn(async (_params: unknown) => true);
jest.mock("@/components/auth/authLoginE2eeDevice", () => ({
  adoptLoginE2eeDevice: (params: unknown) => mockAdopt(params),
}));

import { createAuthRequestSignIn } from "@/components/auth/authRequestSignIn";
import {
  buildDeviceGrantUrn,
  buildMlsDeviceGrantUrn,
  renderCombinedGrantStatement,
  renderDeviceGrantStatement,
} from "@/lib/device-signing/grant-message";
import { loginWithSessionV2 } from "@/services/auth/session-v2.utils";

// A fresh wallet per test: a declined grant sign-in makes that wallet's next
// automatic sign-in an ordinary one for the rest of the page (module state).
let SIGNER = "0x1111111111111111111111111111111111111111";
let signerCounter = 0;
const SCOPES = ["post", "edit", "delete", "react"];
const MLS_KEY = `0x${"3d".repeat(32)}`;
const OTHER_MLS_KEY = `0x${"ab".repeat(32)}`;
const loginMock = loginWithSessionV2 as jest.Mock;

const header = () => [
  "https://staging.6529.io wants you to sign in with your Ethereum account:",
  SIGNER,
  "",
];
const footer = [
  "",
  "URI: https://staging.6529.io",
  "Version: 1",
  "Chain ID: 1",
  "Nonce: a1b2c3d4e5f60718293a4b5c6d7e8f90",
  "Issued At: 2026-10-12T12:00:00.000Z",
  "Expiration Time: 2026-10-12T12:05:00.000Z",
];

const expiresAt = () =>
  Math.floor(Date.now() / 60_000) * 60 + 180 * 24 * 60 * 60;

const signingOnlyMessage = (deviceKeyHex: string): string => {
  const terms = {
    deviceKeyHex,
    scopes: SCOPES,
    expiresAtSeconds: expiresAt(),
  };
  return [
    ...header(),
    renderDeviceGrantStatement(terms),
    ...footer,
    "Resources:",
    `- ${buildDeviceGrantUrn(terms)}`,
  ].join("\n");
};

const combinedMessage = (deviceKeyHex: string, mlsKey: string): string => {
  const signing = {
    deviceKeyHex,
    scopes: SCOPES,
    expiresAtSeconds: expiresAt(),
  };
  const mls = {
    deviceKeyHex: mlsKey,
    ciphersuite: 1,
    expiresAtSeconds: signing.expiresAtSeconds,
  };
  return [
    ...header(),
    renderCombinedGrantStatement(signing, mls),
    ...footer,
    "Resources:",
    `- ${buildDeviceGrantUrn(signing)}`,
    `- ${buildMlsDeviceGrantUrn(mls)}`,
  ].join("\n");
};

type NonceParams = {
  readonly signerAddress: string;
  readonly deviceGrant?:
    | {
        readonly device_key: string;
        readonly mls_device_key?: string;
        readonly mls_ciphersuite?: string;
      }
    | undefined;
};

/** A server that issues combined grants, like the NC8 backend. */
const combinedServer = (params: NonceParams): string => {
  const grant = params.deviceGrant;
  if (!grant) {
    return [...header(), "Sign in to 6529.", ...footer].join("\n");
  }
  return grant.mls_device_key
    ? combinedMessage(grant.device_key, grant.mls_device_key)
    : signingOnlyMessage(grant.device_key);
};

const createSubject = (
  nonceFor: (params: NonceParams) => string | Promise<string> = combinedServer
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

const preparedE2eeDevice = (deviceKeyHex = MLS_KEY) => {
  const device = {
    deviceKeyHex,
    ciphersuite: 1,
    adopt: jest.fn(async () => true),
    dispose: jest.fn(),
  };
  mockPrepareE2ee.mockResolvedValue(device);
  return device;
};

const storedGrant = (): ApiDeviceGrant =>
  ({
    id: `0x${"7".repeat(64)}`,
    wallet: SIGNER,
    key_type: "ed25519",
    device_key: mockRecords.get(SIGNER)?.publicKeyHex,
    scopes: SCOPES,
    device_label: "Browser",
    domain: "staging.6529.io",
    issued_at: Date.now(),
    expires_at: Date.now() + 180 * 86_400_000,
    created_at: Date.now(),
    revoked_at: null,
    last_used_at: null,
  }) as ApiDeviceGrant;

describe("sign-in with a combined signing + encrypted messages grant (NC8)", () => {
  beforeAll(installNodeWebCrypto);
  beforeEach(() => {
    signerCounter += 1;
    SIGNER = `0x${signerCounter.toString(16).padStart(40, "0")}`;
    mockRecords.clear();
    mockPrepareE2ee.mockReset();
    mockPrepareE2ee.mockResolvedValue(null);
    mockAdopt.mockClear();
    loginMock.mockReset();
    loginMock.mockImplementation(async () => ({
      address: SIGNER,
      role: "profile-1",
      access_token: "jwt",
      access_token_expires_at: "2026-10-12T13:00:00.000Z",
      client_type: "web",
      device_grant: storedGrant(),
    }));
  });

  it("asks for one challenge granting both keys and signs it once", async () => {
    const e2ee = preparedE2eeDevice();
    const { getNonce, getSignature, signIn } = createSubject();

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: true });

    const signingKey = mockRecords.get(SIGNER)!.publicKeyHex;
    expect(getNonce).toHaveBeenCalledTimes(1);
    expect(getNonce).toHaveBeenCalledWith({
      signerAddress: SIGNER,
      deviceGrant: {
        device_key: signingKey,
        device_key_type: "ed25519",
        device_scopes: SCOPES.join(","),
        mls_device_key: MLS_KEY,
        mls_ciphersuite: "1",
      },
    });
    expect(getSignature).toHaveBeenCalledTimes(1);
    expect(getSignature).toHaveBeenCalledWith({
      message: combinedMessage(signingKey, MLS_KEY),
    });
    expect(mockAdopt).toHaveBeenCalledWith({
      e2eeDevice: e2ee,
      message: combinedMessage(signingKey, MLS_KEY),
      walletSignature: "0xsigned",
      storedGrantId: `0x${"7".repeat(64)}`,
      ownProfileId: "profile-1",
      signerAddress: SIGNER,
    });
    expect(e2ee.dispose).not.toHaveBeenCalled();
  });

  it("uses the signing-only grant when the server issues no combined grant", async () => {
    const e2ee = preparedE2eeDevice();
    const { getNonce, getSignature, signIn } = createSubject((params) =>
      signingOnlyMessage(params.deviceGrant!.device_key)
    );

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: true });

    expect(getNonce).toHaveBeenCalledTimes(1);
    expect(getSignature).toHaveBeenCalledTimes(1);
    expect(mockAdopt).not.toHaveBeenCalled();
    expect(e2ee.dispose).toHaveBeenCalled();
  });

  it("retries with the signing-only grant when the server rejects the combined request", async () => {
    const e2ee = preparedE2eeDevice();
    const { getNonce, getSignature, signIn } = createSubject((params) => {
      if (params.deviceGrant?.mls_device_key) {
        throw new Error('"mls_device_key" is not allowed');
      }
      return combinedServer(params);
    });

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: true });

    expect(getNonce).toHaveBeenCalledTimes(2);
    expect(getNonce.mock.calls[1]?.[0].deviceGrant).not.toHaveProperty(
      "mls_device_key"
    );
    expect(getSignature).toHaveBeenCalledTimes(1);
    expect(getSignature.mock.calls[0]).toEqual([
      { message: signingOnlyMessage(mockRecords.get(SIGNER)!.publicKeyHex) },
    ]);
    expect(e2ee.dispose).toHaveBeenCalled();
    expect(mockAdopt).not.toHaveBeenCalled();
  });

  it("never signs a combined challenge for another MLS key", async () => {
    const e2ee = preparedE2eeDevice();
    const { getNonce, getSignature, signIn } = createSubject((params) =>
      params.deviceGrant?.mls_device_key
        ? combinedMessage(params.deviceGrant.device_key, OTHER_MLS_KEY)
        : combinedServer(params)
    );

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: true });

    expect(getNonce).toHaveBeenCalledTimes(2);
    const signed = getSignature.mock.calls.map(
      (call) => (call as unknown as [{ message: string }])[0].message
    );
    expect(signed).toEqual([
      signingOnlyMessage(mockRecords.get(SIGNER)!.publicKeyHex),
    ]);
    expect(e2ee.dispose).toHaveBeenCalled();
  });

  it("drops the MLS key when the wallet declines", async () => {
    const e2ee = preparedE2eeDevice();
    const { getSignature, signIn, setToast } = createSubject();
    getSignature.mockResolvedValueOnce({
      signature: null,
      userRejected: true,
      failureToastShown: false,
    });

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: false });

    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" })
    );
    expect(e2ee.dispose).toHaveBeenCalled();
    expect(loginMock).not.toHaveBeenCalled();
    expect(mockAdopt).not.toHaveBeenCalled();
  });

  it("drops the MLS key when the login fails", async () => {
    const e2ee = preparedE2eeDevice();
    loginMock.mockRejectedValueOnce(new Error("login failed"));
    const { signIn } = createSubject();

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: false });

    expect(e2ee.dispose).toHaveBeenCalled();
    expect(mockAdopt).not.toHaveBeenCalled();
  });

  it("does not hand the key over when the server stored no grant", async () => {
    const e2ee = preparedE2eeDevice();
    loginMock.mockImplementationOnce(async () => ({
      address: SIGNER,
      role: "profile-1",
      access_token: "jwt",
      access_token_expires_at: "2026-10-12T13:00:00.000Z",
      client_type: "web",
    }));
    const { signIn } = createSubject();

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: true });

    expect(mockAdopt).not.toHaveBeenCalled();
    expect(e2ee.dispose).toHaveBeenCalled();
  });

  it("keeps the signing-only flow when encrypted messages are unavailable", async () => {
    const { getNonce, getSignature, signIn } = createSubject();

    await expect(
      signIn({ signerAddress: SIGNER, role: null })
    ).resolves.toEqual({ success: true });

    expect(getNonce).toHaveBeenCalledTimes(1);
    expect(getNonce.mock.calls[0]?.[0].deviceGrant).not.toHaveProperty(
      "mls_device_key"
    );
    expect(getSignature).toHaveBeenCalledTimes(1);
    expect(mockAdopt).not.toHaveBeenCalled();
  });

  it("never signs an ordinary challenge that carries a grant it did not ask for", async () => {
    const { getSignature, signIn, setToast } = createSubject((params) =>
      params.deviceGrant
        ? combinedServer(params)
        : combinedMessage(`0x${"d7".repeat(32)}`, MLS_KEY)
    );

    await expect(
      signIn({ signerAddress: SIGNER, role: "proxy-role" })
    ).resolves.toEqual({ success: false });

    expect(getSignature).not.toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" })
    );
  });

  it("does not prepare an MLS key when no signing grant is requested", async () => {
    const { signIn } = createSubject();
    await signIn({ signerAddress: SIGNER, role: "proxy-role" });
    expect(mockPrepareE2ee).not.toHaveBeenCalled();
  });

  it("grants both keys from Turn on signed messages too, with one signature", async () => {
    preparedE2eeDevice();
    const { getSignature, signIn } = createSubject();

    await expect(
      signIn({
        signerAddress: SIGNER,
        role: null,
        deviceGrantMode: "required",
      })
    ).resolves.toEqual({ success: true });

    expect(getSignature).toHaveBeenCalledTimes(1);
    expect(mockAdopt).toHaveBeenCalledTimes(1);
  });
});
