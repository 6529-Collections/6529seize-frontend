/** @jest-environment node */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { bytesToHex } from "viem";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { ApiRegisterDeviceGrantRequest } from "@/generated/models/ApiRegisterDeviceGrantRequest";
import type { StoredDeviceKey } from "@/lib/device-signing/device-key-storage";
import type { AppGrantTypedData } from "@/lib/device-signing/app-grant-request";
import { computeAppGrantId } from "@/lib/device-signing/app-grant";
import {
  prepareConnectionDeviceSetup,
  acceptConnectionDeviceSetup,
} from "@/lib/device-signing/connection-setup";
import { createMemoryE2eeStorage } from "@/lib/e2ee/storage";
import { loadMlsWasm, MLS_WASM_MANIFEST } from "@/lib/e2ee/wasm";
import { MlsClient } from "@/lib/e2ee/mls-adapter";

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
jest.mock("@/services/api/device-grants-api", () => ({
  registerAppDeviceGrant: async (request: ApiRegisterDeviceGrantRequest) => {
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
  },
  revokeDeviceGrant: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: async () => mockGrant,
  commonApiFetch: async () => ({ id: profileId }),
}));
jest.mock("@/components/e2ee/e2eeLocalState", () => ({
  setE2eeEnrollmentMarker: jest.fn(),
}));

beforeEach(() => {
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
  expect(mockRecord).toBeNull();
  expect(await mockStorage.getDevice(profileId)).toBeNull();
  await acceptConnectionDeviceSetup({
    envelope: prepared!.envelope,
    secret: prepared!.secret,
    wallet,
    accessToken: "test-session",
    target: "native",
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
  await acceptConnectionDeviceSetup({
    envelope: prepared!.envelope,
    secret: prepared!.secret,
    wallet,
    accessToken: "test-session",
    target: "native",
  });
  expect(mockRecord).toBe(beforeRecord);
  expect((await mockStorage.getDevice(profileId))?.deviceKey).toBe(
    beforeDevice?.deviceKey
  );
  expect(await mockStorage.getWasmState(profileId)).toEqual(beforeState);
});
