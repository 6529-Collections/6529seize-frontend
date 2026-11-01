/**
 * @jest-environment node
 */
import { privateKeyToAccount } from "viem/accounts";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { ApiRegisterDeviceGrantRequest } from "@/generated/models/ApiRegisterDeviceGrantRequest";
import {
  type AppGrantRequest,
  requestAppDeviceGrant,
} from "@/lib/device-signing/app-grant-request";
import {
  buildAppGrantTypedData,
  computeAppGrantId,
} from "@/lib/device-signing/app-grant";
import type { LoginE2eeDevice } from "@/lib/device-signing/login-e2ee";

const mockEnsureDeviceKey = jest.fn();
const mockSaveDeviceGrant = jest.fn();
jest.mock("@/lib/device-signing/device-key-store", () => ({
  ensureDeviceKey: (...args: unknown[]) => mockEnsureDeviceKey(...args),
  saveDeviceGrant: (...args: unknown[]) => mockSaveDeviceGrant(...args),
}));

const account = privateKeyToAccount(`0x${"42".repeat(32)}`);
const WALLET = account.address.toLowerCase();
const SIGNING_KEY = `0x${"d7".repeat(32)}`;
const MLS_KEY = `0x${"3d".repeat(32)}`;
const NOW = 1_792_324_800_000;

const e2eeDevice = (): jest.Mocked<LoginE2eeDevice> => ({
  deviceKeyHex: MLS_KEY,
  ciphersuite: 0x004f,
  adopt: jest.fn().mockResolvedValue(true),
  dispose: jest.fn(),
});

/** A server that stores exactly the signed grant, keyed by its digest. */
const storingServer = () =>
  jest.fn(async (request: ApiRegisterDeviceGrantRequest) => {
    const { grant } = request;
    const { message } = buildAppGrantTypedData({
      wallet: grant.wallet,
      deviceKeyHex: grant.device_key,
      scopes: grant.scopes,
      mls:
        grant.mls_device_key && grant.ciphersuite
          ? {
              deviceKeyHex: grant.mls_device_key,
              ciphersuite: grant.ciphersuite,
            }
          : null,
      issuedAtSeconds: grant.issued_at,
      expiresAtSeconds: grant.expires_at,
      origin: grant.origin,
    });
    return {
      id: computeAppGrantId(message),
      wallet: grant.wallet,
      key_type: "ed25519",
      device_key: grant.device_key,
      scopes: grant.scopes,
      device_label: request.device_label ?? "",
      domain: grant.origin,
      issued_at: grant.issued_at * 1000,
      expires_at: grant.expires_at * 1000,
      created_at: NOW,
      revoked_at: null,
      last_used_at: null,
    } as ApiDeviceGrant;
  });

const baseRequest = (
  overrides: Partial<AppGrantRequest> = {}
): AppGrantRequest => ({
  address: account.address,
  ownProfileId: "profile-1",
  origin: "6529.io",
  platform: "phone",
  deviceLabel: "6529 app on iPhone",
  e2eeDevice: null,
  now: () => NOW,
  signTypedData: async (typedData) => ({
    signature: await account.signTypedData(typedData),
  }),
  registerGrant: storingServer(),
  ...overrides,
});

describe("requestAppDeviceGrant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureDeviceKey.mockResolvedValue({
      address: WALLET,
      publicKeyHex: SIGNING_KEY,
    });
    mockSaveDeviceGrant.mockResolvedValue(true);
  });

  it("registers a signing-only grant and stores it like a sign-in grant", async () => {
    const registerGrant = jest.fn(baseRequest().registerGrant);
    const result = await requestAppDeviceGrant(baseRequest({ registerGrant }));

    expect(result).toMatchObject({ success: true, e2eeAdopted: false });
    const [request] = registerGrant.mock.calls[0]!;
    expect(request).toMatchObject({
      grant: {
        wallet: WALLET,
        device_key: SIGNING_KEY,
        scopes: ["post", "edit", "delete", "react"],
        mls_device_key: null,
        ciphersuite: null,
        issued_at: NOW / 1000,
        expires_at: NOW / 1000 + 180 * 86_400,
        origin: "6529.io",
      },
      device_label: "6529 app on iPhone",
    });
    expect(mockSaveDeviceGrant).toHaveBeenCalledWith(
      WALLET,
      expect.objectContaining({ device_key: SIGNING_KEY }),
      "profile-1"
    );
  });

  it("grants and hands over the encrypted-messages key with the same signature", async () => {
    const device = e2eeDevice();
    const signTypedData = jest.fn(baseRequest().signTypedData);
    const result = await requestAppDeviceGrant(
      baseRequest({ e2eeDevice: device, platform: "desktop", signTypedData })
    );

    expect(signTypedData).toHaveBeenCalledTimes(1);
    expect(signTypedData.mock.calls[0]![0].message).toMatchObject({
      mlsDeviceKey: MLS_KEY,
      ciphersuite: 0x004f,
    });
    expect(result).toMatchObject({ success: true, e2eeAdopted: true });
    expect(device.adopt).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: "profile-1",
        wallet: WALLET,
        origin: "6529.io",
        platform: "desktop",
        issuedAtSeconds: NOW / 1000,
      })
    );
    expect(device.dispose).not.toHaveBeenCalled();
  });

  it("reports a declined signature and releases the encrypted-messages key", async () => {
    const device = e2eeDevice();
    const registerGrant = jest.fn();
    await expect(
      requestAppDeviceGrant(
        baseRequest({
          e2eeDevice: device,
          registerGrant,
          signTypedData: async () => ({ userRejected: true }),
        })
      )
    ).resolves.toEqual({ success: false, reason: "rejected" });
    expect(registerGrant).not.toHaveBeenCalled();
    expect(device.dispose).toHaveBeenCalled();
  });

  it("reports a wallet error as a failed signature", async () => {
    await expect(
      requestAppDeviceGrant(
        baseRequest({
          signTypedData: async () => ({ error: new Error("locked") }),
        })
      )
    ).resolves.toEqual({ success: false, reason: "signature-failed" });
  });

  it("does not trust a server answer for another grant", async () => {
    const device = e2eeDevice();
    const result = await requestAppDeviceGrant(
      baseRequest({
        e2eeDevice: device,
        registerGrant: async (request) => ({
          ...(await storingServer()(request)),
          id: `0x${"1".repeat(64)}`,
        }),
      })
    );
    expect(result).toEqual({ success: false, reason: "register-failed" });
    expect(mockSaveDeviceGrant).not.toHaveBeenCalled();
    expect(device.dispose).toHaveBeenCalled();
  });

  it("reports a failed registration", async () => {
    await expect(
      requestAppDeviceGrant(
        baseRequest({
          registerGrant: async () => {
            throw new Error("400");
          },
        })
      )
    ).resolves.toEqual({ success: false, reason: "register-failed" });
  });

  it("reports a device key that cannot be prepared", async () => {
    mockEnsureDeviceKey.mockRejectedValue(new Error("no IndexedDB"));
    await expect(requestAppDeviceGrant(baseRequest())).resolves.toEqual({
      success: false,
      reason: "device-key",
    });
  });
});
