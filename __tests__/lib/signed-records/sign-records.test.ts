/**
 * @jest-environment node
 */
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import {
  importVectorPrivateKey,
  installNodeWebCrypto,
} from "../device-signing/device-signing-test-utils";
import { RECORD_VECTORS } from "./signed-records-test-utils";

const mockGetWalletAddress = jest.fn<string | null, []>();
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: () => mockGetWalletAddress(),
}));

const mockAllocateDeviceSeq = jest.fn();
jest.mock("@/lib/device-signing/device-key-store", () => ({
  allocateDeviceSeq: (...args: unknown[]) => mockAllocateDeviceSeq(...args),
}));

const mockIsOwnProfileSession = jest.fn<boolean, unknown[]>();
jest.mock("@/lib/device-signing/own-profile-session", () => ({
  isOwnProfileSession: (...args: unknown[]) => mockIsOwnProfileSession(...args),
}));

import {
  payloadDraft,
  recordDraft,
  sealedDraft,
  signRecords,
} from "@/lib/signed-records/sign-records";
import { RecordKind } from "@/lib/signed-records/record-kinds";
import {
  computeRecordEventId,
  encodeSignedRecordsHeader,
} from "@/lib/signed-records/record-event";
import {
  compareOrderKeys,
  orderKeyOf,
} from "@/lib/signed-records/record-order";
import {
  familyWave,
  parseFamilyWave,
} from "@/lib/signed-records/record-families";
import { verifyEventIdSignature } from "@/lib/device-signing/ed25519";

const inputs = RECORD_VECTORS.inputs;
const follow = RECORD_VECTORS.followRecord;

const grant = (overrides: Partial<ApiDeviceGrant> = {}): ApiDeviceGrant =>
  ({
    id: inputs.authRef,
    wallet: inputs.author,
    key_type: "ed25519",
    device_key: inputs.deviceKey,
    scopes: ["post", "edit", "delete", "react"],
    device_label: "Browser",
    domain: "localhost",
    issued_at: 0,
    expires_at: Date.UTC(2027, 4, 1),
    created_at: 0,
    revoked_at: null,
    last_used_at: null,
    ...overrides,
  }) as ApiDeviceGrant;

async function allocation(seq: number, grantOverrides = {}) {
  return {
    grant: grant(grantOverrides),
    seq,
    record: {
      address: inputs.author,
      keyPair: { privateKey: await importVectorPrivateKey() },
      publicKeyHex: inputs.deviceKey,
      grant: grant(grantOverrides),
      lastSeq: seq,
      ownProfileId: "profile-1",
    },
  };
}

beforeAll(() => {
  installNodeWebCrypto();
});

beforeEach(() => {
  jest.useRealTimers();
  mockGetWalletAddress.mockReturnValue(inputs.author);
  mockIsOwnProfileSession.mockReturnValue(true);
  mockAllocateDeviceSeq.mockReset();
});

describe("signRecords", () => {
  it("signs exactly the backend's follow vector", async () => {
    jest.useFakeTimers({ now: follow.claimed_time });
    mockAllocateDeviceSeq.mockResolvedValueOnce(await allocation(follow.seq));
    const result = await signRecords(
      [
        recordDraft(
          "ps",
          inputs.principal,
          "follow",
          `identity:${inputs.target}`,
          {
            actions: ["DROP_CREATED"],
          }
        ),
      ],
      { anchor: follow.anchor }
    );
    expect(result).toEqual({
      status: "signed",
      events: [follow],
      grantId: inputs.authRef,
    });
  });

  it("signs exactly the backend's unset vector (no body)", async () => {
    const unset = RECORD_VECTORS.followUnset;
    jest.useFakeTimers({ now: unset.claimed_time });
    mockAllocateDeviceSeq.mockResolvedValueOnce(await allocation(unset.seq));
    const result = await signRecords(
      [
        recordDraft(
          "ps",
          inputs.principal,
          "follow",
          `identity:${inputs.target}`,
          null
        ),
      ],
      { anchor: unset.anchor }
    );
    expect(result).toEqual({
      status: "signed",
      events: [unset],
      grantId: inputs.authRef,
    });
  });

  it("signs a batch with one sequence number each", async () => {
    mockAllocateDeviceSeq
      .mockResolvedValueOnce(await allocation(11))
      .mockResolvedValueOnce(await allocation(12));
    const wave = familyWave("pv", inputs.principal);
    const result = await signRecords(
      [
        sealedDraft(wave, "keys", new Uint8Array([2, 123, 125])),
        recordDraft("ps", inputs.principal, "follow", "wave:w1", null),
      ],
      { anchor: 5 }
    );
    if (result.status !== "signed") {
      throw new Error(result.status);
    }
    expect(result.events.map((event) => event.seq)).toEqual([11, 12]);
    expect(result.events[0]).toMatchObject({
      kind: RecordKind.SEALED,
      refs: ["keys"],
      body: JSON.stringify({
        c: Buffer.from([2, 123, 125]).toString("base64url"),
        v: 1,
      }),
    });
    expect(result.events[1]).toMatchObject({
      kind: RecordKind.RECORD,
      body: null,
      body_size: 0,
    });
    for (const event of result.events) {
      expect(computeRecordEventId(event)).toBe(event.id);
      await expect(
        verifyEventIdSignature({
          publicKeyHex: event.device_key,
          eventId: event.id,
          signatureHex: event.signature,
        })
      ).resolves.toBe(true);
    }
  });

  it("returns no-grant without a wallet, a grant, the post scope or an own session", async () => {
    const draft = recordDraft("ps", inputs.principal, "follow", "k", {});
    mockGetWalletAddress.mockReturnValueOnce(null);
    await expect(signRecords([draft], { anchor: 1 })).resolves.toEqual({
      status: "no-grant",
    });
    mockAllocateDeviceSeq.mockResolvedValueOnce(null);
    await expect(signRecords([draft], { anchor: 1 })).resolves.toEqual({
      status: "no-grant",
    });
    mockAllocateDeviceSeq.mockResolvedValueOnce(
      await allocation(3, { scopes: ["react"] })
    );
    await expect(signRecords([draft], { anchor: 1 })).resolves.toEqual({
      status: "no-grant",
    });
    mockAllocateDeviceSeq.mockResolvedValueOnce(await allocation(4));
    mockIsOwnProfileSession.mockReturnValueOnce(false);
    await expect(signRecords([draft], { anchor: 1 })).resolves.toEqual({
      status: "no-grant",
    });
  });

  it("claims a time no earlier than notBefore", async () => {
    jest.useFakeTimers({ now: 1_800_000_000_000 });
    try {
      mockAllocateDeviceSeq
        .mockResolvedValueOnce(await allocation(21))
        .mockResolvedValueOnce(await allocation(22));
      const draft = recordDraft("ps", inputs.principal, "follow", "k", {});
      const later = await signRecords([draft], {
        anchor: 1,
        notBefore: 1_800_000_090_000,
      });
      const now = await signRecords([draft], {
        anchor: 1,
        notBefore: 1_700_000_000_000,
      });
      if (later.status !== "signed" || now.status !== "signed") {
        throw new Error("not signed");
      }
      expect(later.events[0]!.claimed_time).toBe(1_800_000_090_000);
      expect(now.events[0]!.claimed_time).toBe(1_800_000_000_000);
    } finally {
      jest.useRealTimers();
    }
    await expect(
      signRecords([recordDraft("ps", inputs.principal, "follow", "k", {})], {
        anchor: 1,
        notBefore: 1.5,
      })
    ).rejects.toThrow("notBefore");
  });

  it("claims rising times through one batch, so its records order as drafted", async () => {
    jest.useFakeTimers({ now: 1_800_000_000_000 });
    try {
      mockAllocateDeviceSeq
        .mockResolvedValueOnce(await allocation(31))
        .mockResolvedValueOnce(await allocation(32))
        .mockResolvedValueOnce(await allocation(33));
      const draft = recordDraft("ps", inputs.principal, "follow", "k", {});
      const signed = await signRecords([draft, draft, draft], {
        anchor: 1,
        notBefore: 1_800_000_000_005,
      });
      if (signed.status !== "signed") {
        throw new Error("not signed");
      }
      // The clock does not move: each record still claims a later time.
      expect(signed.events.map((event) => event.claimed_time)).toEqual([
        1_800_000_000_005, 1_800_000_000_006, 1_800_000_000_007,
      ]);
    } finally {
      jest.useRealTimers();
    }
  });

  it("needs an anchor and something to sign", async () => {
    const draft = recordDraft("ps", inputs.principal, "follow", "k", {});
    await expect(signRecords([draft], { anchor: 0 })).rejects.toThrow("anchor");
    await expect(signRecords([], { anchor: 1 })).rejects.toThrow(
      "Nothing to sign"
    );
  });

  it("reports a cancelled batch", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      signRecords([recordDraft("ps", inputs.principal, "follow", "k", {})], {
        anchor: 1,
        signal: controller.signal,
      })
    ).resolves.toEqual({ status: "failed", reason: "aborted" });
  });
});

describe("drafts, streams, order and transport", () => {
  it("refuses bad types, keys and owners", () => {
    expect(() =>
      recordDraft("ps", inputs.principal, "Follow", "k", {})
    ).toThrow("Invalid record type");
    expect(() =>
      recordDraft("ps", inputs.principal, "follow", "k".repeat(201), {})
    ).toThrow("too long");
    expect(() => recordDraft("pv", "0x01", "mute", "k", {})).toThrow(
      "Invalid pv owner"
    );
    expect(parseFamilyWave("4a1e0e2c-7a7d-4b38-9c0b-2f1d6d1c9a10")).toBeNull();
    expect(parseFamilyWave("cv/0x0a1b")).toEqual({
      family: "cv",
      owner: "0x0a1b",
    });
    // Lane owners are lowercase hex, as the relays take them.
    expect(parseFamilyWave("cv/group-1")).toBeNull();
    expect(() =>
      recordDraft("ps", inputs.principal, "follow", "\uD800", {})
    ).toThrow("well-formed");
  });

  it("takes a bare wallet as the owner of a public stream only", () => {
    expect(
      recordDraft("ps", inputs.author, "subs.mode", null, { automatic: true })
    ).toEqual({
      kind: RecordKind.RECORD,
      wave: `ps/${inputs.author}`,
      refs: ["subs.mode"],
      body: { automatic: true },
    });
    expect(() => recordDraft("pv", inputs.author, "reader", "k", {})).toThrow(
      "Invalid pv owner"
    );
  });

  it("builds payload references within 4 MiB", () => {
    const wave = familyWave("pv", inputs.principal);
    expect(payloadDraft(wave, "cms", `0x${"a".repeat(64)}`, 2048)).toEqual({
      kind: RecordKind.SEALED,
      wave,
      refs: ["cms"],
      body: { h: `0x${"a".repeat(64)}`, n: 2048, v: 1 },
    });
    expect(() =>
      payloadDraft(wave, "cms", `0x${"a".repeat(64)}`, 5 * 1024 * 1024)
    ).toThrow("4 MiB");
  });

  it("orders like the backend", () => {
    expect(
      compareOrderKeys(
        orderKeyOf(follow),
        orderKeyOf(RECORD_VECTORS.followUnset)
      )
    ).toBe(-1);
    expect(compareOrderKeys(orderKeyOf(follow), orderKeyOf(follow))).toBe(0);
  });

  it("encodes the transport header as base64url JSON", () => {
    const header = encodeSignedRecordsHeader([follow]);
    expect(header).toBe(
      Buffer.from(JSON.stringify([follow])).toString("base64url")
    );
  });
});
