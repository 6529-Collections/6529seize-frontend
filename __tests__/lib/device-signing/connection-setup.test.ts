/** @jest-environment node */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { bytesToHex } from "viem";
import type { PrivateKeyAccount } from "viem/accounts";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { ApiRegisterDeviceGrantRequest } from "@/generated/models/ApiRegisterDeviceGrantRequest";
import type { StoredDeviceKey } from "@/lib/device-signing/device-key-storage";
import type { AppGrantTypedData } from "@/lib/device-signing/app-grant-request";
import { computeAppGrantId } from "@/lib/device-signing/app-grant";
import {
  prepareConnectionDeviceSetup,
  acceptConnectionDeviceSetup,
} from "@/lib/device-signing/connection-setup";
import { E2EE_CIPHERSUITE, E2EE_LEGACY_CIPHERSUITE } from "@/lib/e2ee/grant";
import { createMemoryE2eeStorage } from "@/lib/e2ee/storage";
import { loadMlsWasm, MLS_WASM_MANIFEST } from "@/lib/e2ee/wasm";
import { MlsClient } from "@/lib/e2ee/mls-adapter";
import {
  addUser,
  createWorld,
  settle,
  type TestUser,
  type World,
} from "../e2ee/support/harness";

const wallet = `0x${"1".repeat(40)}`;
const profileId = "11111111-1111-4111-8111-111111111111";
let mockStorage = createMemoryE2eeStorage();
let mockRecord: StoredDeviceKey | null = null;
let mockGrant: ApiDeviceGrant;
let mockGrantId: string;
const mockWasm = loadMlsWasm({
  bytes: new Uint8Array(
    readFileSync(join(process.cwd(), "public", MLS_WASM_MANIFEST.file))
  ),
});
jest.mock("@/lib/e2ee/wasm-loader", () => ({
  loadDefaultWasm: () => mockWasm,
}));
jest.mock("@/lib/e2ee/storage", () => ({
  ...jest.requireActual("@/lib/e2ee/storage"),
  getDefaultE2eeStorage: () => mockStorage,
}));
jest.mock("@/lib/device-signing/device-key-storage", () => ({
  deviceKeyStorage: {
    read: async () => mockRecord,
    write: async (record: StoredDeviceKey) => {
      mockRecord = record;
    },
  },
}));
const mockRegister = jest.fn(
  async ({ body: request }: { body: ApiRegisterDeviceGrantRequest }) => {
    mockGrant = {
      id: mockGrantId,
      wallet: request.grant.wallet,
      device_key: request.grant.device_key,
      scopes: request.grant.scopes,
      domain: request.grant.origin,
      issued_at: request.grant.issued_at * 1000,
      expires_at: request.grant.expires_at * 1000,
      revoked_at: null,
    } as ApiDeviceGrant;
    return mockGrant;
  }
);
const mockRevoke = jest.fn(async (_input: { endpoint: string }) => undefined);
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: (input: {
    endpoint: string;
    body: ApiRegisterDeviceGrantRequest;
  }) =>
    input.endpoint === "device-grants"
      ? mockRegister(input)
      : mockRevoke(input),
  commonApiFetch: async () => ({ id: profileId }),
}));
jest.mock("@/components/e2ee/e2eeLocalState", () => ({
  setE2eeEnrollmentMarker: jest.fn(),
}));

beforeEach(() => {
  mockRegister.mockClear();
  mockRevoke.mockClear();
  mockRecord = null;
  mockStorage = createMemoryE2eeStorage();
});

beforeAll(() => {
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { host: "6529.io" },
  });
});

it("transfers a new MLS identity and non-extractable signing key without touching source keys", async () => {
  const signing = jest.fn(async (typedData: AppGrantTypedData) => {
    mockGrantId = computeAppGrantId(typedData.message);
    return { signature: "0x1234" };
  });
  const prepared = await prepareConnectionDeviceSetup({
    wallet,
    profileId,
    target: "native",
    sign: signing,
    isCurrent: () => true,
  });
  expect(prepared).not.toBeNull();
  expect(signing).toHaveBeenCalledTimes(1);
  // D172: the phone signs an app grant v2 for {0x004E} (uint16[] suites).
  const signed = signing.mock.calls[0]![0];
  expect(signed.domain.version).toBe("2");
  expect(signed.types.DeviceGrant).toContainEqual({
    name: "ciphersuites",
    type: "uint16[]",
  });
  expect(signed.message).toMatchObject({ ciphersuites: [0x004e] });
  expect(mockRegister).not.toHaveBeenCalled();
  expect(mockRecord).toBeNull();
  expect(await mockStorage.getDevice(profileId)).toBeNull();
  const outcome = await acceptConnectionDeviceSetup({
    envelope: prepared!.envelope,
    secret: prepared!.secret,
    wallet,
    accessToken: "test-session",
    target: "native",
  });
  expect(outcome).toBe("pending-enrollment");
  expect(mockRegister).toHaveBeenCalledTimes(1);
  // The receiving device registers exactly the v2 terms that were signed.
  expect(mockRegister.mock.calls[0]![0].body.grant).toMatchObject({
    version: 2,
    ciphersuite: 0x004e,
    ciphersuites: [0x004e],
  });
  const record = mockRecord as StoredDeviceKey | null;
  expect(record?.keyPair.privateKey.extractable).toBe(false);
  const challenge = new Uint8Array([1, 2, 3]);
  const signature = await crypto.subtle.sign(
    "Ed25519",
    record!.keyPair.privateKey,
    challenge
  );
  expect(
    await crypto.subtle.verify(
      "Ed25519",
      record!.keyPair.publicKey,
      signature,
      challenge
    )
  ).toBe(true);
  expect(
    bytesToHex(
      new Uint8Array(
        await crypto.subtle.exportKey("raw", record!.keyPair.publicKey)
      )
    )
  ).toBe(mockGrant.device_key);
  const device = await mockStorage.getDevice(profileId);
  const client = MlsClient.load(
    await mockWasm,
    (await mockStorage.getWasmState(profileId))!
  );
  try {
    expect(client.deviceKey()).toBe(device?.deviceKey);
  } finally {
    client.dispose();
  }
  expect(device?.loginGrantId).toBe(mockGrant.id);
  expect(device?.platform).toBe("phone");
});

it("does not sign or register a grant after the source account changes", async () => {
  const sign = jest.fn();
  await expect(
    prepareConnectionDeviceSetup({
      wallet,
      profileId,
      target: "desktop",
      sign,
      isCurrent: () => false,
    })
  ).rejects.toThrow("context changed");
  expect(sign).not.toHaveBeenCalled();
});

it("keeps existing signing keys and registered MLS history when another setup link is accepted", async () => {
  const baseline = await prepareConnectionDeviceSetup({
    wallet,
    profileId,
    target: "native",
    sign: async (data) => {
      mockGrantId = computeAppGrantId(data.message);
      return { signature: "0x1234" };
    },
    isCurrent: () => true,
  });
  await acceptConnectionDeviceSetup({
    envelope: baseline!.envelope,
    secret: baseline!.secret,
    wallet,
    accessToken: "test-session",
    target: "native",
  });
  const beforeRecord = mockRecord;
  const beforeDevice = await mockStorage.getDevice(profileId);
  const beforeState = await mockStorage.getWasmState(profileId);
  await mockStorage.writeBatch(profileId, {
    device: { ...beforeDevice!, registered: true },
  });
  const prepared = await prepareConnectionDeviceSetup({
    wallet,
    profileId,
    target: "native",
    sign: async (data) => {
      mockGrantId = computeAppGrantId(data.message);
      return { signature: "0x1234" };
    },
    isCurrent: () => true,
  });
  const outcome = await acceptConnectionDeviceSetup({
    envelope: prepared!.envelope,
    secret: prepared!.secret,
    wallet,
    accessToken: "test-session",
    target: "native",
  });
  expect(outcome).toBe("reused");
  expect(mockRegister).toHaveBeenCalledTimes(1);
  expect(mockRecord).toBe(beforeRecord);
  expect((await mockStorage.getDevice(profileId))?.deviceKey).toBe(
    beforeDevice?.deviceKey
  );
  expect(await mockStorage.getWasmState(profileId)).toEqual(beforeState);
});

/** Signs a mobile share and records the grant ID expected by the API mock. */
async function prepareNativeShare(account: PrivateKeyAccount) {
  const prepared = await prepareConnectionDeviceSetup({
    wallet: account.address,
    profileId,
    target: "native",
    sign: async (data) => {
      mockGrantId = computeAppGrantId(data.message);
      return {
        signature: await account.signTypedData<Record<string, unknown>>({
          ...data,
          message: { ...data.message },
        }),
      };
    },
    isCurrent: () => true,
  });
  if (!prepared) throw new Error("Expected a signed native share");
  return prepared;
}

function acceptNativeShare(
  prepared: Awaited<ReturnType<typeof prepareNativeShare>>,
  address: string
) {
  return acceptConnectionDeviceSetup({
    ...prepared,
    wallet: address,
    accessToken: "test-session",
    target: "native",
  });
}

describe("accepting a v2 share on a registered earlier-suite device", () => {
  let world: World;
  let receiver: TestUser;

  beforeEach(async () => {
    world = await createWorld();
    receiver = await addUser(world, profileId, undefined, {
      earlierSuite: true,
    });
    // Install a usable signing key separately from the receiver's legacy MLS state.
    await acceptNativeShare(
      await prepareNativeShare(receiver.account),
      receiver.account.address
    );
    mockRegister.mockClear();
    mockStorage = receiver.primary.storage;
    expect(await mockStorage.getDevice(profileId)).toMatchObject({
      registered: true,
      grant: { ciphersuite: E2EE_LEGACY_CIPHERSUITE },
    });
  });

  afterEach(() => {
    for (const device of world?.devices ?? []) device.engine.dispose();
  });

  it("registers the new grant and adopts the current suite while preserving earlier history", async () => {
    const peer = await addUser(world, "peer", undefined, {
      earlierSuite: true,
    });
    const conversation = await receiver.primary.engine.createConversation({
      profileIds: [peer.profileId],
      kind: "dm",
    });
    await settle(world);
    await receiver.primary.engine.send(conversation, {
      text: "Earlier message",
    });
    await settle(world);
    receiver.primary.engine.dispose();
    const earlierMessages = await mockStorage.listMessages(
      profileId,
      conversation
    );
    expect(earlierMessages).toContainEqual(
      expect.objectContaining({ text: "Earlier message" })
    );
    const earlierDevice = await mockStorage.getDevice(profileId);
    const earlierSigning = mockRecord;

    const outcome = await acceptNativeShare(
      await prepareNativeShare(receiver.account),
      receiver.account.address
    );

    expect(outcome).toBe("pending-enrollment");
    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRecord).toBe(earlierSigning);
    const adopted = await mockStorage.getDevice(profileId);
    expect(adopted).toMatchObject({
      loginGrantId: mockGrantId,
      platform: "phone",
      registered: false,
      grant: { version: 2, ciphersuites: [E2EE_CIPHERSUITE] },
    });
    expect(adopted?.deviceKey).not.toBe(earlierDevice?.deviceKey);
    expect(
      (await mockStorage.listGroups(profileId)).find(
        ({ g }) => g === conversation
      )?.status
    ).toBe("superseded");
    expect(await mockStorage.listMessages(profileId, conversation)).toEqual(
      earlierMessages
    );
  });

  it("revokes the new grant if adoption fails and only the old device remains", async () => {
    receiver.primary.engine.dispose();
    const earlierDevice = await mockStorage.getDevice(profileId);
    const earlierSigning = mockRecord;
    jest
      .spyOn(mockStorage, "writeBatch")
      .mockRejectedValueOnce(new Error("Storage failure"));
    const share = await prepareNativeShare(receiver.account);

    await expect(
      acceptNativeShare(share, receiver.account.address)
    ).rejects.toThrow("Device setup could not be saved");

    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRevoke).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: `device-grants/${mockGrantId}/revoke`,
      })
    );
    expect(await mockStorage.getDevice(profileId)).toEqual(earlierDevice);
    expect(mockRecord).toBe(earlierSigning);
  });
});
