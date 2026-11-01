import { requestAppSignedMessagesGrant } from "@/components/auth/authAppSignedMessagesGrant";

const mockPrepareE2ee = jest.fn();
jest.mock("@/lib/device-signing/login-e2ee", () => ({
  prepareLoginE2eeDevice: (...args: unknown[]) => mockPrepareE2ee(...args),
}));

const mockRequestAppDeviceGrant = jest.fn();
jest.mock("@/lib/device-signing/app-grant-request", () => ({
  requestAppDeviceGrant: (...args: unknown[]) =>
    mockRequestAppDeviceGrant(...args),
}));

jest.mock("@/services/api/device-grants-api", () => ({
  registerAppDeviceGrant: jest.fn(),
}));

const mockSetMarker = jest.fn();
jest.mock("@/components/e2ee/e2eeLocalState", () => ({
  setE2eeEnrollmentMarker: (...args: unknown[]) => mockSetMarker(...args),
}));

jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true },
}));

const ADDRESS = "0x1111111111111111111111111111111111111111";
const GRANT_ID = `0x${"7".repeat(64)}`;
const E2EE_DEVICE = { deviceKeyHex: `0x${"3d".repeat(32)}`, ciphersuite: 79 };

const params = (overrides: object = {}) => ({
  address: ADDRESS,
  ownProfileId: "profile-1",
  signAppGrant: jest.fn(),
  ...overrides,
});

describe("Turn on signed messages in the apps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrepareE2ee.mockResolvedValue(E2EE_DEVICE);
    mockRequestAppDeviceGrant.mockResolvedValue({
      success: true,
      grant: { id: GRANT_ID },
      e2eeAdopted: true,
    });
  });

  it("grants the encrypted-messages key too and wakes the engine", async () => {
    await expect(requestAppSignedMessagesGrant(params())).resolves.toEqual({
      success: true,
    });
    expect(mockRequestAppDeviceGrant).toHaveBeenCalledWith(
      expect.objectContaining({
        address: ADDRESS,
        ownProfileId: "profile-1",
        origin: globalThis.location.host,
        platform: "phone",
        e2eeDevice: E2EE_DEVICE,
      })
    );
    expect(mockSetMarker).toHaveBeenCalledWith("profile-1", true);
  });

  it("asks for no encrypted-messages key without a profile", async () => {
    await requestAppSignedMessagesGrant(params({ ownProfileId: null }));
    expect(mockPrepareE2ee).not.toHaveBeenCalled();
    expect(mockRequestAppDeviceGrant).toHaveBeenCalledWith(
      expect.objectContaining({ e2eeDevice: null })
    );
  });

  it("reports the handover when turning on encrypted messages", async () => {
    await expect(
      requestAppSignedMessagesGrant(params({ encryptedMessages: true }))
    ).resolves.toEqual({
      success: true,
      e2ee: { grantId: GRANT_ID, grantSaved: true, adopted: true },
    });
    expect(mockPrepareE2ee).toHaveBeenCalledWith({ required: true });
  });

  it("signs nothing when turning on encrypted messages without a key", async () => {
    mockPrepareE2ee.mockResolvedValue(null);
    await expect(
      requestAppSignedMessagesGrant(params({ encryptedMessages: true }))
    ).resolves.toEqual({ success: false, reason: "unavailable" });
    expect(mockRequestAppDeviceGrant).not.toHaveBeenCalled();
  });

  it.each([
    ["rejected", "rejected"],
    ["device-key", "device-key"],
    ["register-failed", "sign-in-failed"],
    ["signature-failed", "signature-failed"],
  ])("reports %s as %s", async (reason, expected) => {
    mockRequestAppDeviceGrant.mockResolvedValue({ success: false, reason });
    await expect(requestAppSignedMessagesGrant(params())).resolves.toEqual({
      success: false,
      reason: expected,
    });
  });

  it("names a WalletConnect session error", async () => {
    mockRequestAppDeviceGrant.mockImplementation(async ({ signTypedData }) => {
      await signTypedData({});
      return { success: false, reason: "signature-failed" };
    });
    const signAppGrant = jest.fn(async () => ({
      error: Object.assign(new Error("No matching key. session topic"), {
        name: "WalletConnectError",
      }),
    }));
    const result = await requestAppSignedMessagesGrant(
      params({ signAppGrant })
    );
    expect(signAppGrant).toHaveBeenCalled();
    expect(result).toEqual({ success: false, reason: "walletconnect-session" });
  });
});
