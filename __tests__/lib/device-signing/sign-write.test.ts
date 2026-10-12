import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { ApiDeviceSignature } from "@/generated/models/ApiDeviceSignature";
import type { StoredDeviceKey } from "@/lib/device-signing/device-key-storage";
import { installNodeWebCrypto, VECTORS } from "./device-signing-test-utils";

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

let mockEnabled = true;
jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => mockEnabled,
}));

let mockWalletAddress: string | null = null;
let mockWalletRole: string | null = null;
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: () => mockWalletAddress,
  getWalletRole: () => mockWalletRole,
}));

jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

import { canonicalizeBody } from "@/lib/device-signing/canonical-json";
import {
  ensureDeviceKey,
  saveDeviceGrant,
} from "@/lib/device-signing/device-key-store";
import { verifyEventIdSignature } from "@/lib/device-signing/ed25519";
import { computeInterimEventId } from "@/lib/device-signing/interim-event";
import { getInvalidDeviceSignatureReason } from "@/lib/device-signing/sign-write";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";
import {
  deleteDrop,
  postDrop,
  postDropUpdate,
  sendDropReaction,
} from "@/services/api/signed-drop-writes";

const ADDRESS = "0x1111111111111111111111111111111111111111";
const DROP_ID = "b0c5d6e7-1111-4222-8333-944455556666";
const WAVE_ID = VECTORS.body.wave_id;
const DAY = 86_400_000;
const postMock = commonApiPost as jest.Mock;
const deleteMock = commonApiDelete as jest.Mock;

const createBody = () =>
  ({ ...VECTORS.body }) as unknown as Parameters<typeof postDrop>[0];

/** The structured error common-api raises for the backend's 400 response. */
const invalidSignatureError = (reason = "grant was revoked") => {
  const error = `Invalid device signature: ${reason}`;
  return Object.assign(new Error(error), {
    name: "ApiError",
    status: 400,
    response: {
      status: 400,
      body: JSON.stringify({ error, code: "INVALID_DEVICE_SIGNATURE" }),
    },
  });
};

async function setUpGrant(scopes = ["post", "edit", "delete", "react"]) {
  const record = await ensureDeviceKey(ADDRESS);
  const now = Date.now();
  const grant = {
    id: VECTORS.authRef,
    wallet: ADDRESS,
    key_type: "ed25519",
    device_key: record.publicKeyHex,
    scopes,
    device_label: "Chrome on macOS",
    domain: "staging.6529.io",
    issued_at: now,
    expires_at: now + 180 * DAY,
    created_at: now,
    revoked_at: null,
    last_used_at: null,
  } as ApiDeviceGrant;
  await saveDeviceGrant(ADDRESS, grant);
  return { record, grant };
}

const sentSignature = (
  mock: jest.Mock,
  call = 0
): ApiDeviceSignature | undefined =>
  (
    mock.mock.calls[call]?.[0] as {
      body?: { device_signature?: ApiDeviceSignature };
    }
  ).body?.device_signature;

async function expectVerifies({
  signature,
  kind,
  refs,
  body,
}: {
  readonly signature: ApiDeviceSignature;
  readonly kind: number;
  readonly refs: string[];
  readonly body: object | null;
}) {
  const record = mockRecords.get(ADDRESS);
  const { bodyHash, bodySize } = canonicalizeBody(body);
  const eventId = computeInterimEventId({
    kind,
    kindVersion: 1,
    wave: WAVE_ID,
    author: ADDRESS,
    keyType: 2,
    deviceKey: record!.publicKeyHex,
    authRef: signature.grant_id,
    seq: signature.seq,
    anchor: 0,
    claimedTime: signature.claimed_time,
    refs,
    bodyHash,
    bodySize,
  });
  await expect(
    verifyEventIdSignature({
      publicKeyHex: record!.publicKeyHex,
      eventId,
      signatureHex: signature.signature,
    })
  ).resolves.toBe(true);
}

describe("device-signed drop writes", () => {
  beforeAll(installNodeWebCrypto);
  beforeEach(() => {
    mockRecords.clear();
    mockEnabled = true;
    mockWalletAddress = ADDRESS;
    mockWalletRole = null;
    postMock.mockReset().mockResolvedValue({ id: "drop" });
    deleteMock.mockReset().mockResolvedValue(undefined);
  });

  it("signs a new drop over exactly the body it sends", async () => {
    await setUpGrant();
    const body = createBody();
    await postDrop(body, { errorMode: "structured" });

    const sent = postMock.mock.calls[0]![0] as {
      endpoint: string;
      body: Record<string, unknown>;
      errorMode: string;
    };
    expect(sent.endpoint).toBe("drops");
    expect(sent.errorMode).toBe("structured");
    const signature = sentSignature(postMock)!;
    expect(signature.grant_id).toBe(VECTORS.authRef);
    expect(signature.signature).toMatch(/^0x[0-9a-f]{128}$/);
    expect(signature.seq).toBeGreaterThanOrEqual(signature.claimed_time - 5);
    const { device_signature: _ignored, ...unsigned } = sent.body;
    expect(unsigned).toEqual(body);
    await expectVerifies({
      signature,
      kind: 1,
      refs: [DROP_ID],
      body,
    });
    expect(mockRecords.get(ADDRESS)?.lastSeq).toBe(signature.seq);
  });

  it("signs edits, deletes and both reaction directions", async () => {
    await setUpGrant();
    const target = { dropId: DROP_ID, waveId: WAVE_ID };
    const update = createBody() as unknown as Parameters<
      typeof postDropUpdate
    >[1];
    await postDropUpdate(target, update);
    await expectVerifies({
      signature: sentSignature(postMock, 0)!,
      kind: 2,
      refs: [DROP_ID],
      body: update,
    });

    await deleteDrop(target);
    expect(deleteMock.mock.calls[0]![0]).toMatchObject({
      endpoint: `drops/${DROP_ID}`,
    });
    await expectVerifies({
      signature: sentSignature(deleteMock, 0)!,
      kind: 3,
      refs: [DROP_ID],
      body: null,
    });

    await sendDropReaction({ ...target, reaction: ":+1:" });
    expect(postMock.mock.calls[1]![0].body.reaction).toBe(":+1:");
    await expectVerifies({
      signature: sentSignature(postMock, 1)!,
      kind: 4,
      refs: [DROP_ID],
      body: { on: true, reaction: ":+1:" },
    });

    await sendDropReaction({ ...target, reaction: null });
    expect(deleteMock.mock.calls[1]![0].endpoint).toBe(
      `drops/${DROP_ID}/reaction`
    );
    await expectVerifies({
      signature: sentSignature(deleteMock, 1)!,
      kind: 4,
      refs: [DROP_ID],
      body: { on: false },
    });

    const seqs = [
      sentSignature(postMock, 0)!.seq,
      sentSignature(deleteMock, 0)!.seq,
      sentSignature(postMock, 1)!.seq,
      sentSignature(deleteMock, 1)!.seq,
    ];
    expect([...seqs].sort((a, b) => a - b)).toEqual(seqs);
    expect(new Set(seqs).size).toBe(4);
  });

  it("sends exactly today's unsigned requests when the flag is off", () => {
    mockEnabled = false;
    void postDrop(createBody(), { errorMode: "structured" });
    void deleteDrop({ dropId: DROP_ID, waveId: WAVE_ID });
    // Synchronous: no signing step is awaited before the request starts.
    expect(postMock).toHaveBeenCalledWith({
      endpoint: "drops",
      body: createBody(),
      errorMode: "structured",
    });
    expect(deleteMock).toHaveBeenCalledWith({ endpoint: `drops/${DROP_ID}` });
  });

  it("never signs for a proxy role, without a grant or outside the grant's scopes", async () => {
    mockWalletRole = "proxy-profile";
    await setUpGrant(["post"]);
    await postDrop(createBody());
    expect(sentSignature(postMock, 0)).toBeUndefined();

    mockWalletRole = null;
    await sendDropReaction({
      dropId: DROP_ID,
      waveId: WAVE_ID,
      reaction: null,
    });
    expect(deleteMock.mock.calls[0]![0]).toEqual({
      endpoint: `drops/${DROP_ID}/reaction`,
    });

    mockRecords.clear();
    await postDrop(createBody());
    expect(sentSignature(postMock, 1)).toBeUndefined();
  });

  it.each([
    "unknown grant",
    "grant was revoked",
    "grant expired",
    "grant does not include the post scope",
    "grant wallet does not belong to the acting profile",
    "signature does not verify",
  ])(
    "drops the local grant and resends once unsigned when rejected with: %s",
    async (reason) => {
      await setUpGrant();
      postMock
        .mockRejectedValueOnce(invalidSignatureError(reason))
        .mockResolvedValueOnce({ id: "drop" });

      await expect(postDrop(createBody())).resolves.toEqual({ id: "drop" });
      expect(postMock).toHaveBeenCalledTimes(2);
      expect(sentSignature(postMock, 0)).toBeDefined();
      expect(sentSignature(postMock, 1)).toBeUndefined();
      expect(mockRecords.get(ADDRESS)?.grant).toBeNull();
    }
  );

  it.each([
    "event or sequence number was already used",
    "claimed_time is more than 10 minutes from server time",
  ])(
    "keeps the grant, resends once unsigned and re-signs the next write with a fresh sequence after: %s",
    async (reason) => {
      await setUpGrant();
      postMock
        .mockRejectedValueOnce(invalidSignatureError(reason))
        .mockResolvedValue({ id: "drop" });

      await postDrop(createBody());
      expect(sentSignature(postMock, 1)).toBeUndefined();
      expect(mockRecords.get(ADDRESS)?.grant).not.toBeNull();

      await postDrop(createBody());
      const first = sentSignature(postMock, 0)!;
      const next = sentSignature(postMock, 2)!;
      expect(next.seq).toBeGreaterThan(first.seq);
      expect(next.signature).not.toBe(first.signature);
    }
  );

  it("resends a legacy-string rejection unsigned as well", async () => {
    await setUpGrant();
    deleteMock
      .mockRejectedValueOnce("Invalid device signature: grant expired")
      .mockResolvedValueOnce(undefined);

    await deleteDrop({ dropId: DROP_ID, waveId: WAVE_ID });
    expect(deleteMock).toHaveBeenCalledTimes(2);
    expect(deleteMock.mock.calls[1]![0]).toEqual({
      endpoint: `drops/${DROP_ID}`,
    });
    expect(mockRecords.get(ADDRESS)?.grant).toBeNull();
  });

  it("keeps the grant and surfaces any other failure without resending", async () => {
    await setUpGrant();
    const error = Object.assign(new Error("Drop too long"), { status: 400 });
    postMock.mockRejectedValueOnce(error);

    await expect(postDrop(createBody())).rejects.toBe(error);
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(mockRecords.get(ADDRESS)?.grant).not.toBeNull();
  });

  it("reads the rejection reason from structured and legacy errors", () => {
    expect(getInvalidDeviceSignatureReason(invalidSignatureError())).toBe(
      "grant was revoked"
    );
    expect(
      getInvalidDeviceSignatureReason("Invalid device signature: grant expired")
    ).toBe("grant expired");
    expect(
      getInvalidDeviceSignatureReason(
        Object.assign(new Error("Bad request"), {
          status: 400,
          response: {
            status: 400,
            body: JSON.stringify({ code: "INVALID_DEVICE_SIGNATURE" }),
          },
        })
      )
    ).toBe("");
    expect(
      getInvalidDeviceSignatureReason(
        Object.assign(new Error("Invalid device signature: x"), { status: 403 })
      )
    ).toBeNull();
    expect(getInvalidDeviceSignatureReason(new Error("Forbidden"))).toBeNull();
  });
});
